import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'node:http';

import { app, BrowserWindow, ipcMain } from 'electron';
import keytar from 'keytar';
import { config } from 'dotenv';

interface GitHubTokenResponse {
  access_token: string;
  scope?: string;
  token_type?: string;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isPackaged = app.isPackaged;
const isProd = process.env.NODE_ENV === 'production';
const envFile = isPackaged || isProd
  ? '.env.production'
  : '.env.development';

config({ path: path.resolve(process.cwd(), envFile) });

const CLIENT_ID = getEnv('CLIENT_ID');
const CLIENT_SECRET = getEnv('CLIENT_SECRET');
const SERVICE_NAME = getEnv('SERVICE_NAME');
const ACCOUNT_NAME = getEnv('ACCOUNT_NAME');

const DEV_REDIRECT_URI = 'http://localhost:3000/callback';
const PROD_REDIRECT_URI = 'myapp://callback';

const REDIRECT_URI = isPackaged || isProd ? PROD_REDIRECT_URI : DEV_REDIRECT_URI;

let mainWindow: BrowserWindow;

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', async (event, argv) => {
    // Windows/Linux pass the protocol URL as a command line argument
    const urlArg = argv.find(a => a.startsWith('myapp://'));
    if (urlArg) {
      const code = new URL(urlArg).searchParams.get('code');
      if (code) await exchangeCodeForToken(code);
      mainWindow?.focus();
    }
  });
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if ((isPackaged || isProd) && process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, 'renderer/index.html'));
  }
  // mainWindow.webContents.openDevTools();

  return mainWindow;
}

ipcMain.on('login-github', () => startGithubOAuth());

app.whenReady().then(() => {
  createWindow();

  console.log('NODE_ENV = ', process.env.NODE_ENV);
  console.log('isProd = ', isProd);
  console.log('isPackaged = ', isPackaged);

  if (!isPackaged) {
    startDevHttpServer();
  } else {
    if (!app.isDefaultProtocolClient('myapp')) {
      app.setAsDefaultProtocolClient('myapp');
    }
  }
});

function startGithubOAuth() {
  const oauthWindow = new BrowserWindow({
    width: 500,
    height: 600,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  const authUrl = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=read:user`;
  oauthWindow.loadURL(authUrl);

  // Intercept redirects inside the OAuth window
  oauthWindow.webContents.on('will-redirect', async (event, url) => {
    if (url.startsWith(REDIRECT_URI)) {
      event.preventDefault();
      const code = new URL(url).searchParams.get('code');
      if (code) await exchangeCodeForToken(code);
      oauthWindow.close();
    }
  });
}

async function exchangeCodeForToken(code: string) {
  try {
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

    const tokenData = await tokenResponse.json() as GitHubTokenResponse;
    const accessToken = tokenData.access_token;

    if (accessToken) {
      await keytar.setPassword(SERVICE_NAME, ACCOUNT_NAME, accessToken);
      console.log("Token stored securely in keytar.");
      mainWindow?.webContents.send('oauth-success');
    } else {
      console.error("Failed to get access token");
    }
  } catch (err) {
    console.error("Error exchanging code for token:", err);
  }
}

function startDevHttpServer() {
  const server = createServer(async (req, res) => {
    if (!req.url) return;
    const reqUrl = new URL(req.url, DEV_REDIRECT_URI);

    if (reqUrl.pathname === '/callback') {
      const code = reqUrl.searchParams.get('code');
      if (code) {
        await exchangeCodeForToken(code);
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('Login successful! You can close this window.');
      } else {
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.end('No code received');
      }
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
    }
  });

  server.listen(3000, () => {
    console.log(`Dev HTTP server running on ${DEV_REDIRECT_URI}`);
  });
}

function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env var ${name}`);
  return value;
}

app.on('open-url', async (event, url) => {
  event.preventDefault();
  if (!url.startsWith(PROD_REDIRECT_URI)) return;

  const code = new URL(url).searchParams.get('code');
  if (code) await exchangeCodeForToken(code);
});
