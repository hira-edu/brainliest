import { webcrypto } from 'node:crypto';

import { env } from '@brainliest/config/env.server';

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256; // bits
const IV_LENGTH = 12; // bytes

const encoder = new TextEncoder();
const decoder = new TextDecoder();

async function getKey(): Promise<CryptoKey> {
  const keyMaterial = Buffer.from(env.SITE_KMS_MASTER_KEY, 'hex');

  if (keyMaterial.length * 8 !== KEY_LENGTH) {
    throw new Error(`SITE_KMS_MASTER_KEY must be ${KEY_LENGTH / 8} bytes (received ${keyMaterial.length})`);
  }

  return webcrypto.subtle.importKey(
    'raw',
    keyMaterial,
    { name: ALGORITHM },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encrypt(plaintext: string): Promise<string> {
  const key = await getKey();
  const iv = webcrypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const encoded = encoder.encode(plaintext);

  const ciphertext = await webcrypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    encoded
  );

  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.length);

  return Buffer.from(combined).toString('base64');
}

export async function decrypt(encrypted: string): Promise<string> {
  const key = await getKey();
  const combined = Buffer.from(encrypted, 'base64');

  if (combined.length <= IV_LENGTH) {
    throw new Error('Encrypted payload is too short');
  }

  const iv = combined.subarray(0, IV_LENGTH);
  const ciphertext = combined.subarray(IV_LENGTH);

  const decrypted = await webcrypto.subtle.decrypt(
    { name: ALGORITHM, iv },
    key,
    ciphertext
  );

  return decoder.decode(decrypted);
}
