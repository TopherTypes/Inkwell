import { app, BrowserWindow } from 'electron';
import { createWindow } from './window';
import { setupMenu } from './menu';

let mainWindow: BrowserWindow | null = null;

app.on('ready', () => {
  mainWindow = createWindow();
  setupMenu(mainWindow);
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
