import { ipcMain } from 'electron';
import { IPC } from '@shared/ipc-channels';
import type { IpcResult, WritingEntity, Project } from '@shared/entity-types';

// TODO: Implement file open/save handlers
// TODO: Implement entity creation and project management

export function registerFileHandlers(): void {
  ipcMain.handle(IPC.FILE_OPEN_ENTITY, async (_event, path: string) => {
    // TODO: Implement entity file opening
    return { ok: false, error: 'Not implemented' } satisfies IpcResult<WritingEntity>;
  });

  ipcMain.handle(IPC.FILE_SAVE_ENTITY, async (_event, entity: WritingEntity) => {
    // TODO: Implement entity saving
    return { ok: false, error: 'Not implemented' } satisfies IpcResult<void>;
  });

  ipcMain.handle(IPC.FILE_OPEN_PROJECT, async (_event, path: string) => {
    // TODO: Implement project file opening
    return { ok: false, error: 'Not implemented' } satisfies IpcResult<Project>;
  });

  ipcMain.handle(IPC.FILE_SAVE_PROJECT, async (_event, project: Project) => {
    // TODO: Implement project saving
    return { ok: false, error: 'Not implemented' } satisfies IpcResult<void>;
  });
}
