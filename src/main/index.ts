// src\main\index.ts
import { app, BrowserWindow, ipcMain, shell } from 'electron';
import path from 'node:path';

import { electronApp, optimizer, is } from '@electron-toolkit/utils';

import icon from '../../resources/icon.png?asset';
import log from '@shared/logger';
import { config } from './config';
import { initIpc } from './ipc-main-bridge';
import { exchangeCodeForToken, OAuthCallbacks, storeActivationKey } from './auth';
import { initAutoUpdates } from './auto-updates';
import { enableRendererDependencyLogging, enableRequestLogging } from './log-requests';
import customProtocol from './custom-protocol';
import { OAUTH_PROVIDERS } from '@shared/oauthConfig';

customProtocol.init();

// Main entry
app.whenReady().then(() => {
  electronApp.setAppUserModelId('space.goddards.lee.electron-secure-test');

  const mainWindow = createWindow();

  if (!handleSecondInstance(mainWindow)) return;

  customProtocol.register();
  initIpc(mainWindow);
  initAutoUpdates(mainWindow)

  if (config.VITE_DEV_MODE) {
    enableRequestLogging(mainWindow);
    enableRendererDependencyLogging();
  }

  ipcMain.handle('activate-app', async (_event, activationKey: string, provider: keyof typeof OAUTH_PROVIDERS) => {
    try {
      log.log('Received activate-app')
      await storeActivationKey(activationKey, provider)
      return { success: true };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  // macOS window re-activation
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  if (config.VITE_DEV_MODE) app.on('browser-window-created', (_, window) => optimizer.watchWindowShortcuts(window));
});

// Quit when all windows closed except macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => log.log('App quitting...'));


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
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
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

  if (config.VITE_DEV_MODE) mainWindow.webContents.openDevTools();

  loadMainWindow(mainWindow);
  return mainWindow;
}


// Deep links 
function handleSecondInstance(mainWindow: BrowserWindow) {
  const gotLock = app.requestSingleInstanceLock();
  if (!gotLock) {
    app.quit();
    return false;
  }

  // XXX://oauth?provider=XXX&code=XXXX

  // (Windows/Linux)
  app.on('second-instance', async (_event, argv) => {
    const urlArg = argv.find(a =>
      a.startsWith(`${config.VITE_CUSTOM_URL_PROTOCOL}://`)
    );

    if (!urlArg) return;

    const url = new URL(urlArg);

    const code = url.searchParams.get('code');
    const provider = url.searchParams.get('provider') as keyof typeof OAUTH_PROVIDERS;

    if (!code || !provider) return;

    const callbacks: OAuthCallbacks = {
      onSuccess: () => mainWindow.webContents.send('oauth-success'),
      onError: (err) => mainWindow.webContents.send('oauth-error', err),
      onRequireActivation: () => mainWindow.webContents.send('require-activation'),
    };

    await exchangeCodeForToken(provider, code, callbacks);

    mainWindow.focus();
  });

  app.on('open-url', async (event, urlStr) => {
    event.preventDefault();

    const url = new URL(urlStr);

    const code = url.searchParams.get('code');
    const provider = url.searchParams.get('provider') as keyof typeof OAUTH_PROVIDERS;

    if (!code || !provider) return;

    const callbacks: OAuthCallbacks = {
      onSuccess: () => mainWindow.webContents.send('oauth-success'),
      onError: (err) => mainWindow.webContents.send('oauth-error', err),
      onRequireActivation: () => mainWindow.webContents.send('require-activation'),
    };

    await exchangeCodeForToken(provider, code, callbacks);
  });

  return true;
}
