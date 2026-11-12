/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Client-Side End-to-End Hybrid Encryption Engine
 * Uses Native Browser Web Crypto API (SubtleCrypto)
 * Protocol: RSA-OAEP-256 (Key Encapsulation) + AES-256-GCM (Authenticated Payload Cipher)
 */

let cachedServerPublicKey: CryptoKey | null = null;
let cachedKeyId: string | null = null;

// Convert PEM format to ArrayBuffer for Web Crypto API import
function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN [A-Z ]+-----/g, '')
    .replace(/-----END [A-Z ]+-----/g, '')
    .replace(/[\r\n\s]/g, '');
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// Convert ArrayBuffer to Base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Convert Base64 to ArrayBuffer
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Fetch and import the server's RSA-OAEP-256 public encryption key
 */
export async function getServerPublicKey(): Promise<{ key: CryptoKey; keyId: string }> {
  if (cachedServerPublicKey && cachedKeyId) {
    return { key: cachedServerPublicKey, keyId: cachedKeyId };
  }

  const res = await fetch('/api/auth/crypto-key');
  if (!res.ok) {
    throw new Error('Failed to retrieve server encryption key');
  }

  const data = await res.json();
  const keyBuffer = pemToArrayBuffer(data.publicKey);

  const importedKey = await window.crypto.subtle.importKey(
    'spki',
    keyBuffer,
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256',
    },
    false,
    ['encrypt']
  );

  cachedServerPublicKey = importedKey;
  cachedKeyId = data.keyId;

  return { key: importedKey, keyId: data.keyId };
}

export interface EncryptedEnvelope {
  _encrypted: true;
  keyId: string;
  encryptedKey: string; // Base64 RSA-OAEP encrypted AES key
  encryptedData: string; // Base64 AES-256-GCM ciphertext + auth tag
  iv: string; // Base64 12-byte initialization vector
  timestamp: number;
}

/**
 * Encrypt any JavaScript payload before it ever touches the local network / Wi-Fi
 */
export async function encryptPayload(payload: any): Promise<EncryptedEnvelope> {
  const { key: rsaPublicKey, keyId } = await getServerPublicKey();

  // 1. Generate ephemeral 256-bit AES-GCM symmetric key for this single request
  const aesKey = await window.crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    true,
    ['encrypt']
  );

  // 2. Generate random 12-byte IV (NIST recommended for GCM)
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  // 3. Encrypt payload with AES-256-GCM
  const encodedData = new TextEncoder().encode(JSON.stringify(payload));
  const encryptedDataBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    aesKey,
    encodedData
  );

  // 4. Export raw AES key and wrap it with Server RSA-OAEP-256 Public Key
  const rawAesKey = await window.crypto.subtle.exportKey('raw', aesKey);
  const encryptedKeyBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'RSA-OAEP',
    },
    rsaPublicKey,
    rawAesKey
  );

  return {
    _encrypted: true,
    keyId,
    encryptedKey: arrayBufferToBase64(encryptedKeyBuffer),
    encryptedData: arrayBufferToBase64(encryptedDataBuffer),
    iv: arrayBufferToBase64(iv.buffer),
    timestamp: Date.now(),
  };
}

/**
 * Secure wrapper around fetch that automatically encrypts JSON body
 */
export async function secureFetch(url: string, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers || {});

  let body = init?.body;

  // If request has a JSON body, encrypt it with hybrid RSA-OAEP + AES-GCM
  if (body && typeof body === 'string' && (init?.method === 'POST' || init?.method === 'PUT')) {
    try {
      const parsed = JSON.parse(body);
      const envelope = await encryptPayload(parsed);
      body = JSON.stringify(envelope);
      headers.set('Content-Type', 'application/json');
      headers.set('X-E2EE-Encrypted', 'RSA-OAEP-256+AES-256-GCM');
    } catch {
      // If not JSON or already encrypted, pass through
    }
  }

  return fetch(url, {
    ...init,
    headers,
    body,
  });
}
