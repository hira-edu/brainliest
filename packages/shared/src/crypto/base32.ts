import { Buffer } from 'node:buffer';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function base32Encode(data: Uint8Array): string {
  let bits = 0;
  let value = 0;
  let output = '';

  for (let i = 0; i < data.length; i += 1) {
    value = (value << 8) | data[i]!;
    bits += 8;

    while (bits >= 5) {
      const index = (value >>> (bits - 5)) & 31;
      bits -= 5;
      output += BASE32_ALPHABET[index] ?? '';
    }
  }

  if (bits > 0) {
    const index = (value << (5 - bits)) & 31;
    output += BASE32_ALPHABET[index] ?? '';
  }

  return output;
}

export function base32Decode(input: string): Uint8Array {
  const normalized = input.replace(/=+$/u, '').replace(/\s+/gu, '').toUpperCase();
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (let i = 0; i < normalized.length; i += 1) {
    const char = normalized[i]!;
    const index = BASE32_ALPHABET.indexOf(char);
    if (index === -1) {
      throw new Error(`Invalid base32 character: ${char}`);
    }

    value = (value << 5) | index;
    bits += 5;

    if (bits >= 8) {
      const byte = (value >>> (bits - 8)) & 0xff;
      bits -= 8;
      bytes.push(byte);
    }
  }

  return Buffer.from(bytes);
}
