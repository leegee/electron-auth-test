// src/main/index.ts
import { app, BrowserWindow, shell } from 'electron';
import path from 'node:path';

import { electronApp, optimizer, is } from '@electron-toolkit/utils';

import { config } from '@shared/config';
import icon from '../../resources/icon.png?asset';
import log, { /*enableRendererDependencyLogging, enableRequestLogging */ } from './logger';
import { ElectronOAuthPlugin } from './oauth-plugin';
import { initAutoUpdates } from './auto-updates';
// import customProtocol from './custom-protocol';

// if (!is.dev) customProtocol.init();

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', (_event, _argv) => {
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    electronApp.setAppUserModelId('space.goddards.lee.electron-secure-test');

    const mainWindow = createWindow();

    // if (!is.dev) customProtocol.register();

    initAutoUpdates(mainWindow);

    new ElectronOAuthPlugin(mainWindow, {
      serviceName: config.VITE_SERVICE_NAME,
      secretServiceName: config.VITE_SECRET_SERVICE_NAME,
      buildPassword: config.VITE_BUILD_PASSWORD,
    }).init();

    mainWindow.webContents.on('will-navigate', (event, url) => {
      log.warn('main: Navigation attempt to:', url);
      event.preventDefault();
    });

    if (is.dev) {
      // enableRequestLogging(mainWindow);
      // enableRendererDependencyLogging();
      app.on('browser-window-created', (_, window) => optimizer.watchWindowShortcuts(window));
    }

    if (config.VITE_DEV_MODE) mainWindow.webContents.openDevTools();

    log.log('App is ready');

    // macOS re-activate behavior
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on('window-all-closed', () => {
    log.log('All windows closed');
    if (process.platform !== 'darwin') app.quit();
  });

  app.on('before-quit', () => log.log('App quitting...'));
}

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
      enableRemoteModule: false,
      webSecurity: true,
    },
  };
}

function createWindow(): BrowserWindow {
  const mainWindow = new BrowserWindow(getMainWindowOptions());

  mainWindow.on('ready-to-show', () => mainWindow.show());
  mainWindow.setMenu(null);

  mainWindow.webContents.setWindowOpenHandler((details) => {
    log.log('Open system browser for', details.url);
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  loadMainWindow(mainWindow);

  return mainWindow;
}

function loadMainWindow(mainWindow: BrowserWindow) {
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }
}