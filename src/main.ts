import 'dotenv/config';
import { app, BrowserWindow, ipcMain, shell } from 'electron';
import keytar from 'keytar';
import express from 'express';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';

interface GitHubTokenResponse {
  access_token: string;
  scope?: string;
  token_type?: string;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CLIENT_ID = getEnv('CLIENT_ID');
const CLIENT_SECRET = getEnv('CLIENT_SECRET');
const REDIRECT_URI = getEnv('REDIRECT_URI');
const SERVICE_NAME = getEnv('SERVICE_NAME');
const ACCOUNT_NAME = getEnv('ACCOUNT_NAME');

let mainWindow: BrowserWindow;

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), // xxx
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (getEnv('VITE_DEV_SERVER_URL')) {
    // Dev mode: load Vite server
    mainWindow.loadURL(getEnv('VITE_DEV_SERVER_URL'));
    mainWindow.webContents.openDevTools();
  } else {
    // Production: load built HTML
    mainWindow.loadFile(path.join(__dirname, 'renderer/index.html'));
  }

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



function startOAuthServer(mainWindow: BrowserWindow) {
  const app = express();

  app.get('/callback', async (req, res) => {
    const code = req.query.code as string;

    if (!code) {
      res.send("No code received");
      return;
    }

    // Exchange code for token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Accept': 'application/json' },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
        redirect_uri: REDIRECT_URI
      })
    });

    const tokenData: GitHubTokenResponse = await tokenResponse.json() as GitHubTokenResponse;
    const accessToken = tokenData.access_token;

    if (accessToken) {
      await keytar.setPassword(SERVICE_NAME, ACCOUNT_NAME, accessToken);
      console.log("Token stored securely in keytar.");
      res.send("Login successful! You can close this window.");
      mainWindow.webContents.send('oauth-success');
    } else {
      res.send("Failed to get access token.");
    }
  });

  app.listen(3000, () => {
    console.log("OAuth callback server running on http://localhost:3000");
  });
}

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env var ${name}`);
  return value;
}
