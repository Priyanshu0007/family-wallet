/**
 * Checks if the browser and device support the platform authenticator and WebAuthn PRF extension.
 */
export async function checkBiometricsSupport(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (!window.PublicKeyCredential) return false;

  try {
    const isPlatformAvailable = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    if (!isPlatformAvailable) return false;

    // Check capability for PRF
    if (typeof PublicKeyCredential.getClientCapabilities === 'function') {
      const capabilities = await (PublicKeyCredential as any).getClientCapabilities();
      return !!capabilities.extensions?.includes("prf");
    }
  } catch (err) {
    console.error("[Biometrics] Error checking support:", err);
  }
  return false;
}

const PRF_SALT = new TextEncoder().encode("tijori-wallet-prf-salt-fixed-32b");

/**
 * Registers a new platform credential with PRF support.
 * Returns the raw credential ID and the derived PRF key output (if returned during creation).
 */
export async function registerBiometrics(): Promise<{ credentialId: Uint8Array; prfOutput: ArrayBuffer | null }> {
  const challenge = window.crypto.getRandomValues(new Uint8Array(32));
  const userId = window.crypto.getRandomValues(new Uint8Array(16));
  const rpId = window.location.hostname;

  const creationOptions: any = {
    publicKey: {
      challenge,
      rp: { name: "Tijori Wallet", id: rpId },
      user: {
        id: userId,
        name: "tijori-user",
        displayName: "Tijori User"
      },
      pubKeyCredParams: [
        { type: "public-key", alg: -7 }, // ES256
        { type: "public-key", alg: -257 } // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: "platform",
        userVerification: "required",
        requireResidentKey: false
      },
      extensions: {
        prf: {
          eval: {
            first: PRF_SALT
          }
        }
      }
    }
  };

  const credential = await navigator.credentials.create(creationOptions) as any;
  if (!credential) {
    throw new Error("Failed to create biometric credential.");
  }

  const extensionResults = credential.getClientExtensionResults();
  if (!extensionResults?.prf || !extensionResults.prf.enabled) {
    throw new Error("Biometric hardware key derivation (PRF) not enabled by authenticator.");
  }

  const prfOutput = extensionResults.prf.results?.first || null;

  return {
    credentialId: new Uint8Array(credential.rawId),
    prfOutput
  };
}

/**
 * Authenticates with an existing credential and retrieves the derived PRF key.
 */
export async function authenticateBiometrics(credentialId: Uint8Array): Promise<ArrayBuffer> {
  const challenge = window.crypto.getRandomValues(new Uint8Array(32));
  const rpId = window.location.hostname;

  const getOptions: any = {
    publicKey: {
      challenge,
      rpId,
      allowCredentials: [{
        type: "public-key",
        id: credentialId
      }],
      userVerification: "required",
      extensions: {
        prf: {
          eval: {
            first: PRF_SALT
          }
        }
      }
    }
  };

  const assertion = await navigator.credentials.get(getOptions) as any;
  if (!assertion) {
    throw new Error("Failed to authenticate with biometrics.");
  }

  const extensionResults = assertion.getClientExtensionResults();
  const prfOutput = extensionResults.prf?.results?.first;
  if (!prfOutput) {
    throw new Error("Failed to retrieve biometric key from authenticator.");
  }

  return prfOutput;
}

/**
 * Encrypts data using a raw 32-byte key buffer.
 */
export async function encryptWithPrfKey(text: string, prfOutput: ArrayBuffer): Promise<string> {
  const key = await window.crypto.subtle.importKey(
    "raw",
    prfOutput,
    { name: "AES-GCM" },
    false,
    ["encrypt"]
  );

  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(text)
  );

  const ivBase64 = btoa(String.fromCharCode(...iv));
  const cipherBase64 = btoa(String.fromCharCode(...new Uint8Array(encrypted)));
  return `${ivBase64}:${cipherBase64}`;
}

/**
 * Decrypts data using a raw 32-byte key buffer.
 */
export async function decryptWithPrfKey(encrypted: string, prfOutput: ArrayBuffer): Promise<string> {
  const key = await window.crypto.subtle.importKey(
    "raw",
    prfOutput,
    { name: "AES-GCM" },
    false,
    ["decrypt"]
  );

  const [ivBase64, cipherBase64] = encrypted.split(":");
  if (!ivBase64 || !cipherBase64) {
    throw new Error("Invalid encrypted format");
  }

  const iv = Uint8Array.from(atob(ivBase64), c => c.charCodeAt(0));
  const ciphertext = Uint8Array.from(atob(cipherBase64), c => c.charCodeAt(0));

  const decrypted = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext
  );

  return new TextDecoder().decode(decrypted);
}
