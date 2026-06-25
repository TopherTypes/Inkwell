import { encrypt, decrypt } from './encryption';
import { CONTAINER_VERSION } from '@shared/schema-version';
import type { FileHeader } from '@shared/entity-types';

const MAGIC = Buffer.from([0x49, 0x4e, 0x4b, 0x57]); // "INKW"

export function writeContainer(header: FileHeader, body: unknown): Buffer {
  const headerJson = JSON.stringify(header);
  const bodyJson = JSON.stringify(body);
  const encrypted = encrypt(bodyJson);

  const headerBuffer = Buffer.from(headerJson, 'utf8');
  const headerLength = headerBuffer.length;

  const versionBuffer = Buffer.alloc(4);
  versionBuffer.writeUInt32LE(CONTAINER_VERSION, 0);

  const lengthBuffer = Buffer.alloc(4);
  lengthBuffer.writeUInt32LE(headerLength, 0);

  return Buffer.concat([MAGIC, versionBuffer, lengthBuffer, headerBuffer, encrypted]);
}

export function readContainer(buf: Buffer): { header: FileHeader; body: unknown } {
  if (buf.length < 40) {
    throw new Error('Invalid container: too small');
  }

  // Verify magic bytes
  if (!buf.subarray(0, 4).equals(MAGIC)) {
    throw new Error('Invalid container: bad magic bytes');
  }

  // Read container version
  const containerVersion = buf.readUInt32LE(4);
  if (containerVersion !== CONTAINER_VERSION) {
    throw new Error(`Unsupported container version: ${containerVersion}`);
  }

  // Read header length
  const headerLength = buf.readUInt32LE(8);

  // Extract header
  const headerBuffer = buf.subarray(12, 12 + headerLength);
  const headerJson = headerBuffer.toString('utf8');
  const header: FileHeader = JSON.parse(headerJson);

  // Extract and decrypt body
  const encryptedBody = buf.subarray(12 + headerLength);
  const bodyJson = decrypt(encryptedBody);
  const body = JSON.parse(bodyJson);

  return { header, body };
}
