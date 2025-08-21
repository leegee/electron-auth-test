const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const keytar = require('keytar');
const express = require('express');

const SERVICE_NAME = 'electron-github-oauth';
const ACCOUNT_NAME = 'github-token';

// GitHub OAuth config
const CLIENT_ID = 'Ov23ligWErUK2Wub3gTT';
const CLIENT_SECRET = 'a24a2465f57cbbc0e398a729e388b996756057a0';
const REDIRECT_URI = 'http://localhost:3000/callback';

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
}

// Mini Express server to handle OAuth2 callback
function startOAuthServer() {
  const app = express();

  app.get('/callback', async (req, res) => {
    const code = req.query.code;

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

    const tokenData = await tokenResponse.json();
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

ipcMain.on('login-github', () => {
  const authUrl = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=read:user`;
  shell.openExternal(authUrl);
});

app.whenReady().then(() => {
  createWindow();
  startOAuthServer();
});
