// src\main\index.ts
import { app, BrowserWindow, ipcMain, net, protocol, shell } from 'electron';
import path from 'node:path';
import url from 'node:url';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';

import icon from '../../resources/icon.png?asset';
import { config } from './config';
import { initIpc } from './ipc-main-bridge';
import { exchangeCodeForToken, OAuthCallbacks, storeActivationKey } from './auth';
import { initAutoUpdates } from './auto-updates';

protocol.registerSchemesAsPrivileged([
  { scheme: config.VITE_CUSTOM_URL_PROTOCOL, privileges: { standard: true, secure: true } },
]);

// Main entry
app.whenReady().then(() => {
  electronApp.setAppUserModelId('space.goddards.lee.electron-secure-test');


  const mainWindow = createWindow();

  if (!handleSecondInstance(mainWindow)) return;

  registerCustomProtocol();
  initIpc(mainWindow);
  initAutoUpdates(mainWindow)

  ipcMain.handle('activate-app', async (_event, activationKey: string) => {
    try {
      console.log('Received activate-app')
      await storeActivationKey(activationKey)
      return { success: true };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  // macOS window re-activation
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  if (config.VITE_SHOW_DEV_TOOLS) app.on('browser-window-created', (_, window) => optimizer.watchWindowShortcuts(window));
});

// Quit when all windows closed except macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => console.log('App quitting...'));


/* *************** Functions *************** */


function getMainWindowOptions() {
  return {
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      sandbox: false,
    },
  };
}


// Load renderer content (HMR in dev, local html in prod)
function loadMainWindow(mainWindow: BrowserWindow) {
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }
}


function createWindow(): BrowserWindow {
  const mainWindow = new BrowserWindow(getMainWindowOptions());

  mainWindow.on('ready-to-show', () => mainWindow.show());
  mainWindow.setMenu(null);

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  if (config.VITE_SHOW_DEV_TOOLS) mainWindow.webContents.openDevTools();

  loadMainWindow(mainWindow);
  return mainWindow;
}


// Register custom protocol for deep links
function registerCustomProtocol() {
  // try {
  //   protocol.registerFileProtocol(config.VITE_CUSTOM_URL_PROTOCOL, (request, callback) => {
  //     const urlPath = request.url.replace(`${config.VITE_CUSTOM_URL_PROTOCOL}://`, '');
  //     const filePath = path.join(app.getAppPath(), 'dist', 'renderer', urlPath);
  //     console.log(`Serving ${config.VITE_CUSTOM_URL_PROTOCOL}:// -> ${filePath}`);
  //     callback({ path: filePath });
  //   });
  // } catch (err) {
  //   console.error(`Failed to register "${config.VITE_CUSTOM_URL_PROTOCOL}" protocol`, err);
  // }
  protocol.handle(config.VITE_CUSTOM_URL_PROTOCOL, (req: GlobalRequest) => {
    try {
      // let urlPath = req.url.replace(`${config.VITE_CUSTOM_URL_PROTOCOL}://`, '');

      const { pathname } = new URL(req.url);
      let urlPath = decodeURIComponent(pathname);

      if (!urlPath || urlPath === '/') {
        urlPath = 'index.html';
      }

      const base = path.join(app.getAppPath(), 'dist', 'renderer');
      const filePath = path.resolve(base, '.' + urlPath);

      // Prevent directory traversal
      if (!filePath.startsWith(base)) {
        return new Response('Forbidden', { status: 403 });
      }

      if (!path.extname(filePath)) {
        return net.fetch(url.pathToFileURL(path.join(base, 'index.html')).toString());
      }

      console.log(`Serving ${config.VITE_CUSTOM_URL_PROTOCOL}://  ${filePath}`)
      return net.fetch(url.pathToFileURL(filePath).toString());
    }

    catch (err) {
      console.error(`Failed to serve "${req.url}"`, err)
      return new Response('Internal error', {
        status: 500,
        headers: { 'content-type': 'text/plain' }
      });
    }
  })
}


// Deep links (Windows/Linux)
function handleSecondInstance(mainWindow: BrowserWindow) {
  const gotLock = app.requestSingleInstanceLock();
  if (!gotLock) {
    app.quit();
    return false;
  }

  app.on('second-instance', async (_event, argv) => {
    const urlArg = argv.find(a => a.startsWith(`${config.VITE_CUSTOM_URL_PROTOCOL}://`));
    if (!urlArg) return;

    const code = new URL(urlArg).searchParams.get('code');
    if (!code) return;

    const callbacks: OAuthCallbacks = {
      onSuccess: () => mainWindow.webContents.send('oauth-success'),
      onError: (err) => mainWindow.webContents.send('oauth-error', err),
      onRequireActivation: () => mainWindow.webContents.send('require-activation'),
    };

    await exchangeCodeForToken(code, callbacks);
    mainWindow.focus();
  });

  return true;
}
