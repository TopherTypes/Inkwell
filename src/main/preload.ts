import { contextBridge, ipcRenderer } from 'electron';
import type { IpcChannel } from '../shared/ipc-channels';

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    invoke: (channel: IpcChannel, ...args: unknown[]) =>
      ipcRenderer.invoke(channel, ...args),
    on: (channel: IpcChannel, listener: (event: unknown, ...args: unknown[]) => void) =>
      ipcRenderer.on(channel, listener),
    off: (channel: IpcChannel, listener: (event: unknown, ...args: unknown[]) => void) =>
      ipcRenderer.off(channel, listener),
  },
});
