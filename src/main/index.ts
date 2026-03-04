import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'node:http';

import { app, BrowserWindow, protocol } from 'electron';

import { exchangeCodeForToken, init } from './ipc-bridge.ts';
import { config } from './config.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow;
let devServer: ReturnType<typeof startDevHttpServer> | null = null;

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', async (_event, argv) => {
    const urlArg = argv.find(a => a.startsWith(`${config.CUSTOM_URL_PROTOCOL}://`));
    if (urlArg) {
      const code = new URL(urlArg).searchParams.get('code');
      if (code) await exchangeCodeForToken(mainWindow, code);
      mainWindow?.focus();
    }
  });
}

protocol.registerSchemesAsPrivileged([
  { scheme: config.CUSTOM_URL_PROTOCOL, privileges: { standard: true, secure: true } }
]);


app.on('window-all-closed', app.quit);

app.on('before-quit', () => {
  console.log('App quitting...');
  if (devServer) {
    console.log('Closing dev HTTP server');
    devServer.close(() => console.log('Closed dev HTTP server'));
    devServer = null;
  }
});

app.whenReady().then(() => {
  console.log('NODE_ENV = ', process.env.NODE_ENV);
  console.log('isPackaged = ', config.isPackaged);

  if (config.isPackaged) {
    try {
      if (!app.isDefaultProtocolClient(config.CUSTOM_URL_PROTOCOL)) {
        console.log('Set as default protocol handler for', config.CUSTOM_URL_PROTOCOL);
        app.setAsDefaultProtocolClient(config.CUSTOM_URL_PROTOCOL);
      }
    } catch (err) {
      throw new Error(`Failed to setAsDefaultProtocolClient "${config.CUSTOM_URL_PROTOCOL}" protocol ${(err as Error).toString()}`);
    }
  }

  try {
    protocol.registerFileProtocol(config.CUSTOM_URL_PROTOCOL, (request, callback) => {
      const urlPath = request.url.replace(`${config.CUSTOM_URL_PROTOCOL}://`, '');
      // Adjust path for packaged vs dev if needed
      const filePath = path.join(app.getAppPath(), 'dist', 'renderer', urlPath);
      console.log(`Serving ${config.CUSTOM_URL_PROTOCOL}:// -> ${filePath}`);
      callback({ path: filePath });
    });
  } catch (err) {
    console.error(`Failed to register "${config.CUSTOM_URL_PROTOCOL}" protocol`, err);
  }

  const preloadPath = config.isPackaged
    ? path.join(app.getAppPath(), 'dist/preload.cjs')     // prod
    : path.join(__dirname, '../preload.cjs');         // dev

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

  init(mainWindow);

  if (config.SHOW_DEV_TOOLS) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.setMenu(null);
  mainWindow.once('ready-to-show', () => mainWindow.show());

  if (config.isPackaged) {
    const rendererPath = path.resolve(app.getAppPath(), 'dist', 'renderer', 'index.html');
    mainWindow.loadFile(rendererPath)
      .catch((err) => console.error('Failed to load renderer:', err));
  } else {
    if (process.env.VITE_DEV_SERVER_URL) {
      mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    } else {
      throw new Error('process.env.VITE_DEV_SERVER_URL not set!');
    }
  }

  if (!config.isPackaged) {
    devServer = startDevHttpServer();
  }
});



export function startDevHttpServer() {
  const server = createServer(async (req, res) => {
    if (!req.url) return;
    const reqUrl = new URL(req.url, config.DEV_REDIRECT_URI);

    if (reqUrl.pathname === '/callback') {
      const code = reqUrl.searchParams.get('code');
      if (code) {
        await exchangeCodeForToken(mainWindow, code);
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
    console.log(`Dev HTTP server running on ${config.DEV_REDIRECT_URI}`);
  });

  return server;
}

// macOS custom protocol
app.on('open-url', async (event, url) => {
  event.preventDefault();
  if (!url.startsWith(config.PROD_REDIRECT_URI)) {
    console.log('Denied an attempt to open', url);
    return;
  }

  const code = new URL(url).searchParams.get('code');
  if (code) {
    console.log('Got code from URL');
    await exchangeCodeForToken(mainWindow, code);
  } else {
    console.log('No code in URL');
  }
});

