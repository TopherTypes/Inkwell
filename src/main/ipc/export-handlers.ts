import { ipcMain } from 'electron';
import { IPC } from '@shared/ipc-channels';
import type { IpcResult, WritingEntity, ExportOptions } from '@shared/entity-types';

// TODO: Implement export handlers for PDF, RTF, Fountain formats

export function registerExportHandlers(): void {
  ipcMain.handle(IPC.EXPORT_PDF, async (_event, entity: WritingEntity, options: ExportOptions) => {
    // TODO: Implement PDF export
    return { ok: false, error: 'Not implemented' } satisfies IpcResult<Buffer>;
  });

  ipcMain.handle(IPC.EXPORT_RTF, async (_event, entity: WritingEntity, options: ExportOptions) => {
    // TODO: Implement RTF export
    return { ok: false, error: 'Not implemented' } satisfies IpcResult<Buffer>;
  });

  ipcMain.handle(IPC.EXPORT_FOUNTAIN, async (_event, entity: WritingEntity) => {
    // TODO: Implement Fountain export (screenplay only)
    return { ok: false, error: 'Not implemented' } satisfies IpcResult<Buffer>;
  });
}
