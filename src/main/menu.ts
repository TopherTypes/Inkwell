import { Menu, app, BrowserWindow } from 'electron';

export function setupMenu(mainWindow: BrowserWindow): void {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Entity',
          accelerator: 'CmdOrCtrl+N',
        },
        {
          label: 'New Project',
          accelerator: 'CmdOrCtrl+Shift+N',
        },
        { type: 'separator' },
        {
          label: 'Open',
          accelerator: 'CmdOrCtrl+O',
        },
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
        },
        {
          label: 'Save As',
          accelerator: 'CmdOrCtrl+Shift+S',
        },
        { type: 'separator' },
        {
          label: 'Export',
          accelerator: 'CmdOrCtrl+E',
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: 'CmdOrCtrl+Q',
          click: () => app.quit(),
        },
      ],
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Toggle Navigator',
          accelerator: 'CmdOrCtrl+\\',
        },
        {
          label: 'Toggle Metadata',
          accelerator: 'CmdOrCtrl+Shift+\\',
        },
        {
          label: 'Distraction-Free Mode',
          accelerator: 'F11',
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}
