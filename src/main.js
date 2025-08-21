import { app, BrowserWindow, ipcMain, shell } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

import { startOAuthServer } from './server/auth-callback.js';
import { CLIENT_ID, REDIRECT_URI } from './auth.config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile('src/renderer/index.html');

  mainWindow.webContents.openDevTools();

  return mainWindow;
}

ipcMain.on('login-github', () => {
  const authUrl = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=read:user`;
  shell.openExternal(authUrl);
});

app.whenReady().then(() => {
  createWindow();
  startOAuthServer(mainWindow);
});
