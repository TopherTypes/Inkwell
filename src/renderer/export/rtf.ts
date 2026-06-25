import type { WritingEntity, ExportOptions } from '@shared/entity-types';

// TODO: Implement RTF export

export async function exportRtf(
  entity: WritingEntity,
  options: ExportOptions
): Promise<Buffer> {
  throw new Error('Not implemented');
}
