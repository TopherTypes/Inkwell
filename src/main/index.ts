import { app, BrowserWindow } from 'electron';
import { createWindow } from './window';

let mainWindow: BrowserWindow | null = null;

app.on('ready', () => {
  mainWindow = createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    mainWindow = createWindow();
  }
});

// TODO: Register IPC handlers (file-handlers.ts, export-handlers.ts)
// TODO: Set up menu (menu.ts)
