import type { WritingEntity, ExportOptions } from '@shared/entity-types';

// TODO: Implement PDF export using pdfmake

export async function exportPdf(
  entity: WritingEntity,
  options: ExportOptions
): Promise<Buffer> {
  throw new Error('Not implemented');
}
