import type { ScreenplayEntity, ExportOptions } from '@shared/entity-types';

// TODO: Implement Fountain export (screenplay only)

export async function exportFountain(
  entity: ScreenplayEntity
): Promise<Buffer> {
  throw new Error('Not implemented');
}
