import type { WritingEntity, ExportOptions } from '@shared/entity-types';

// TODO: Implement export pipeline

export async function exportEntity(
  entity: WritingEntity,
  options: ExportOptions
): Promise<Buffer> {
  throw new Error('Not implemented');
}
