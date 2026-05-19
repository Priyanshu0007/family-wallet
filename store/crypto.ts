export async function deriveKeyFromPin(pin: string, saltBase64?: string): Promise<{ key: CryptoKey, salt: string }> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(pin),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );

  let salt: Uint8Array;
  if (saltBase64) {
    salt = Uint8Array.from(atob(saltBase64), c => c.charCodeAt(0));
  } else {
    salt = window.crypto.getRandomValues(new Uint8Array(16));
  }

  const key = await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as any,
      iterations: 310000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true, // extractable
    ["encrypt", "decrypt"]
  );

  return {
    key,
    salt: btoa(String.fromCharCode(...salt)),
  };
}

export async function encryptText(text: string, key: CryptoKey): Promise<string> {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();
  const ciphertext = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    key,
    enc.encode(text)
  );
  
  const ivBase64 = btoa(String.fromCharCode(...iv));
  const cipherBase64 = btoa(String.fromCharCode(...new Uint8Array(ciphertext)));
  return `${ivBase64}:${cipherBase64}`;
}

export async function decryptText(encrypted: string, key: CryptoKey): Promise<string> {
  try {
    const [ivBase64, cipherBase64] = encrypted.split(":");
    if (!ivBase64 || !cipherBase64) return encrypted; // fallback for unencrypted data if any
    
    const iv = Uint8Array.from(atob(ivBase64), c => c.charCodeAt(0));
    const ciphertext = Uint8Array.from(atob(cipherBase64), c => c.charCodeAt(0));
    
    const decrypted = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv },
      key,
      ciphertext
    );
    
    const dec = new TextDecoder();
    return dec.decode(decrypted);
  } catch (err) {
    throw new Error("Decryption failed. Invalid key or corrupted data.");
  }
}

export async function exportKeyToBase64(key: CryptoKey): Promise<string> {
  const exported = await window.crypto.subtle.exportKey("raw", key);
  return btoa(String.fromCharCode(...new Uint8Array(exported)));
}

export async function importKeyFromBase64(base64: string): Promise<CryptoKey> {
  const raw = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
  return await window.crypto.subtle.importKey(
    "raw",
    raw,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

/**
 * Check if a string looks like it's already encrypted (matches the IV:ciphertext base64 format).
 * This is used to prevent double-encryption which causes cascading data corruption.
 */
export function looksEncrypted(value: string): boolean {
  if (!value || typeof value !== 'string') return false;
  const parts = value.split(':');
  if (parts.length !== 2) return false;
  const [iv, cipher] = parts;
  // IV should be 16 chars (12 bytes base64) and cipher should be reasonably long
  if (iv.length !== 16) return false;
  // Check both parts are valid base64
  const base64Regex = /^[A-Za-z0-9+/]+=*$/;
  return base64Regex.test(iv) && base64Regex.test(cipher) && cipher.length > 20;
}

export async function hashPinForVerification(pin: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(pin + "verification_salt");
  const hash = await window.crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(hash)));
}
