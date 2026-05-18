import Dexie, { Table } from 'dexie';
import { encryptText, decryptText } from './crypto';
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

const ENCRYPTED_FIELDS = ['number', 'cvv', 'holder', 'notes'];

class FamilyWalletDB extends Dexie {
  cards!: Table<Card, string>;

  constructor() {
    super('FamilyWalletDB');
    this.version(1).stores({
      cards: 'id, bank, type, network, addedAt'
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
        } catch {
          // If decryption fails, leave it as is or mask it
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
      } catch {
        // ignored
      }
    }
  }
  return dec;
}
