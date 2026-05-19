import Dexie, { Table } from 'dexie';
import { encryptText, decryptText, looksEncrypted } from './crypto';
import { usePinStore } from './pinStore';

export interface Card {
  id: string;
  bank: string;
  variant: string;
  type: "Credit" | "Debit";
  number: string;
  expiry: string;
  cvv: string;
  holder: string;
  network: string;
  color: string;
  addedAt: number;
  notes?: string;
}

export interface FamilyMember {
  id: string;
  name: string;
  relation: string;
  color: string;
  addedAt: number;
}

const ENCRYPTED_FIELDS = ['number', 'cvv', 'holder', 'notes'];

class FamilyWalletDB extends Dexie {
  cards!: Table<Card, string>;
  family!: Table<FamilyMember, string>;

  constructor() {
    super('FamilyWalletDB');
    this.version(2).stores({
      cards: 'id, bank, type, network, addedAt',
      family: 'id, name, relation, addedAt'
    });

    // Custom encryption middleware instead of `dexie-encrypted` to use Web Crypto directly
    this.use({
      stack: "dbcore",
      name: "encryption",
      create(downlevelDatabase) {
        return {
          ...downlevelDatabase,
          table(tableName) {
            const downlevelTable = downlevelDatabase.table(tableName);
            if (tableName !== 'cards') return downlevelTable;

            return {
              ...downlevelTable,
              async mutate(req) {
                if (req.type === 'add' || req.type === 'put') {
                  const key = usePinStore.getState().cryptoKey;
                  if (!key) throw new Error("Database locked");

                  const encryptedValues = await Promise.all(
                    req.values.map(async (item: any) => {
                      const cloned = { ...item };
                      for (const field of ENCRYPTED_FIELDS) {
                        if (cloned[field]) {
                          // Guard: skip if already encrypted to prevent double-encryption
                          if (looksEncrypted(cloned[field])) {
                            console.warn(`[Encryption] Skipping already-encrypted field "${field}" to prevent double-encryption`);
                            continue;
                          }
                          cloned[field] = await encryptText(cloned[field], key);
                        }
                      }
                      return cloned;
                    })
                  );
                  return downlevelTable.mutate({ ...req, values: encryptedValues });
                }
                return downlevelTable.mutate(req);
              }
            };
          }
        };
      }
    });
  }
}

export const db = new FamilyWalletDB();

// We need a wrapper to decrypt since Dexie hooks don't easily allow async reading middleware for all query types in dbcore without huge complexity.
// We will manually decrypt when reading from the store.
export async function getDecryptedCards(): Promise<Card[]> {
  const key = usePinStore.getState().cryptoKey;
  if (!key) return [];
  const cards = await db.cards.toArray();
  return Promise.all(cards.map(async (card) => {
    const dec = { ...card };
    for (const field of ENCRYPTED_FIELDS) {
      if (dec[field as keyof Card]) {
        try {
          (dec as any)[field] = await decryptText(dec[field as keyof Card] as string, key);
        } catch (err) {
          // Instead of silently leaving encrypted data, throw so the caller can handle it.
          // This prevents the cascading double-encryption bug where encrypted data
          // gets passed back to the DB and re-encrypted on edit.
          console.error(`[Decryption] Failed to decrypt field "${field}" on card ${card.id}:`, err);
          throw new Error(`Decryption failed for card ${card.id}, field "${field}". Key may have changed.`);
        }
      }
    }
    return dec;
  }));
}

export async function getDecryptedCard(id: string): Promise<Card | undefined> {
  const key = usePinStore.getState().cryptoKey;
  if (!key) return undefined;
  const card = await db.cards.get(id);
  if (!card) return undefined;
  
  const dec = { ...card };
  for (const field of ENCRYPTED_FIELDS) {
    if (dec[field as keyof Card]) {
      try {
        (dec as any)[field] = await decryptText(dec[field as keyof Card] as string, key);
      } catch (err) {
        console.error(`[Decryption] Failed to decrypt field "${field}" on card ${id}:`, err);
        throw new Error(`Decryption failed for card ${id}, field "${field}". Key may have changed.`);
      }
    }
  }
  return dec;
}

/**
 * Attempt to repair double/multi-encrypted card data.
 * This fixes the cascading corruption bug where fields got encrypted multiple times.
 * Returns the number of cards repaired.
 */
export async function repairDoubleEncryptedCards(): Promise<number> {
  const key = usePinStore.getState().cryptoKey;
  if (!key) return 0;
  
  const cards = await db.cards.toArray();
  let repairedCount = 0;
  
  for (const card of cards) {
    let cardWasRepaired = false;
    const repaired = { ...card };
    
    for (const field of ENCRYPTED_FIELDS) {
      let value = (card as any)[field];
      if (!value) continue;
      
      // Try to decrypt — if first decryption succeeds but result still looks encrypted,
      // keep decrypting to peel off extra layers
      let decryptionLayers = 0;
      const MAX_LAYERS = 10; // safety limit
      
      try {
        let decrypted = await decryptText(value, key);
        decryptionLayers++;
        
        while (looksEncrypted(decrypted) && decryptionLayers < MAX_LAYERS) {
          decrypted = await decryptText(decrypted, key);
          decryptionLayers++;
        }
        
        if (decryptionLayers > 1) {
          // Data was multi-encrypted — re-encrypt just once
          (repaired as any)[field] = await encryptText(decrypted, key);
          cardWasRepaired = true;
          console.log(`[Repair] Fixed ${decryptionLayers}-layer encryption on card ${card.id}, field "${field}"`);
        }
      } catch {
        // Can't decrypt at all — data may be from a different key, skip
        console.warn(`[Repair] Cannot decrypt field "${field}" on card ${card.id} — skipping`);
      }
    }
    
    if (cardWasRepaired) {
      // Use update to bypass the encryption middleware
      await db.table('cards').update(card.id, repaired);
      repairedCount++;
    }
  }
  
  return repairedCount;
}
