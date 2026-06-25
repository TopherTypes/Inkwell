import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

const APP_SALT = Buffer.from('inkwell-v1-salt-2026', 'utf8');
const APP_SECRET = 'inkwell-application-key-do-not-share';

function deriveKey(): Buffer {
  return scryptSync(APP_SECRET, APP_SALT, 32);
}

export function encrypt(plaintext: string): Buffer {
  const key = deriveKey();
  const nonce = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, nonce);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([nonce, tag, encrypted]);
}

export function decrypt(data: Buffer): string {
  const key = deriveKey();
  const nonce = data.subarray(0, 12);
  const tag = data.subarray(12, 28);
  const body = data.subarray(28);
  const decipher = createDecipheriv('aes-256-gcm', key, nonce);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(body), decipher.final()]).toString('utf8');
}
