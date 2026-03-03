import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'node:http';

import { app, BrowserWindow, ipcMain, session } from 'electron';
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
const envFile = isPackaged
  ? '.env.production'
  : '.env.development';

config({ path: path.resolve(process.cwd(), envFile) });

const CACHE_USER_SESSIONS = ['true', '1'].includes((getEnv('CACHE_USER_SESSIONS') ?? '').toLowerCase());;
const CLIENT_ID = getEnv('CLIENT_ID');
const CLIENT_SECRET = getEnv('CLIENT_SECRET');
const SERVICE_NAME = getEnv('SERVICE_NAME');
const ACCOUNT_NAME = getEnv('ACCOUNT_NAME');
const SHOW_DEV_TOOLS = getEnv('SHOW_DEV_TOOLS');

const DEV_REDIRECT_URI = 'http://localhost:3000/callback';
const PROD_REDIRECT_URI = 'myapp://callback';

const REDIRECT_URI = isPackaged ? PROD_REDIRECT_URI : DEV_REDIRECT_URI;

let mainWindow: BrowserWindow;
let devServer: ReturnType<typeof startDevHttpServer> | null = null;

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
  // Because life has to be difficult:
  const preloadPath = isPackaged
    ? path.join(app.getAppPath(), 'dist/preload.cjs')      // prod
    : path.join(__dirname, '../src/preload.cjs');         // dev

  console.log('preload.cjs file  path:', preloadPath);

  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    show: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: preloadPath,
    }
  });

  if (SHOW_DEV_TOOLS) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.setMenu(null);

  // Who knows why prod needs this?
  mainWindow.once('ready-to-show', () => mainWindow.show());

  if (isPackaged) {
    const rendererPath = path.join(app.getAppPath(), 'dist', 'renderer', 'index.html');
    mainWindow.loadFile(rendererPath)
      .catch((err) => console.error('Failed to load renderer:', err));
  }

  else {
    if (process.env.VITE_DEV_SERVER_URL) {
      mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    } else {
      throw new Error('process.env.VITE_DEV_SERVER_URL not set!');
    }
  }

  return mainWindow;
}

ipcMain.on('login-github', () => startGithubOAuth());

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (devServer) {
    devServer.close();
    devServer = null;
    console.log('Closed HTTP server');
  }
  console.log('App quitting...');
});

app.whenReady().then(() => {
  console.log('NODE_ENV = ', process.env.NODE_ENV);
  console.log('isPackaged = ', isPackaged);

  createWindow();

  if (!isPackaged) {
    devServer = startDevHttpServer();
  } else {
    if (!app.isDefaultProtocolClient('myapp')) {
      app.setAsDefaultProtocolClient('myapp');
    }
  }
});

function startGithubOAuth() {
  const ses = session.fromPartition('persist:oauthWindow', { cache: CACHE_USER_SESSIONS });

  const oauthWindow = new BrowserWindow({
    width: 500,
    height: 600,
    alwaysOnTop: true,
    focusable: true,
    webPreferences: {
      sandbox: true,
      backgroundThrottling: false,
      contextIsolation: true,
      devTools: false,
      nodeIntegration: false,
      session: ses,
    }
  });

  oauthWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('https://github.com')) event.preventDefault();
  });

  oauthWindow.setMenu(null);

  // Intercept redirects inside the OAuth window
  oauthWindow.webContents.on('will-redirect', async (event, url) => {
    if (url.startsWith(REDIRECT_URI)) {
      event.preventDefault();
      const code = new URL(url).searchParams.get('code');
      if (code) await exchangeCodeForToken(code);
      oauthWindow.close();
    }
  });

  oauthWindow.show();
  oauthWindow.focus();
  oauthWindow.loadURL(
    `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=read:user`
  );
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

// Returns a running HTTP server
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

  return server;
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

ipcMain.handle('keytar-set-password', async (_event, service: string, account: string, password: string) => {
  return keytar.setPassword(service, account, password);
});

ipcMain.handle('keytar-get-password', async (_event, service: string, account: string) => {
  return keytar.getPassword(service, account);
});
