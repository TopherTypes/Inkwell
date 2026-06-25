import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, watchFile } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

let electron = null;

function startElectron() {
  if (electron) electron.kill();

  electron = spawn('electron', ['dist-electron/index.js'], {
    stdio: 'inherit',
    env: {
      ...process.env,
      VITE_DEV_SERVER_URL: 'http://localhost:5173/'
    }
  });

  electron.on('exit', (code) => {
    process.exit(code || 0);
  });
}

// Wait for dist-electron/index.js to exist, then start Electron
const checkInterval = setInterval(() => {
  if (existsSync(join(__dirname, 'dist-electron/index.js'))) {
    clearInterval(checkInterval);
    startElectron();
  }
}, 100);

// Restart Electron on main process file changes
watchFile(join(__dirname, 'dist-electron/index.js'), () => {
  startElectron();
});
