import { app, shell, BrowserWindow, ipcMain, protocol } from 'electron'
import path from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import keytar from 'keytar';

import icon from '../../resources/icon.png?asset'
import { config } from './config';
import { exchangeCodeForToken, initIpc } from './ipc-bridge';
import { startDevHttpServer } from './httpServer';
import { decryptActivationKey } from './activation';

let devServer: ReturnType<typeof startDevHttpServer> | null = null;

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  if (!config.isPackaged && !devServer) {
    devServer = startDevHttpServer(mainWindow);
  }

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

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  initIpc(mainWindow);

  if (config.SHOW_DEV_TOOLS) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.setMenu(null);

  // xxx
  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }
}


protocol.registerSchemesAsPrivileged([
  { scheme: config.CUSTOM_URL_PROTOCOL, privileges: { standard: true, secure: true } }
]);



app.on('before-quit', () => {
  console.log('App quitting...');
  if (devServer) {
    console.log('Closing dev HTTP server');
    devServer.close(() => console.log('Closed dev HTTP server'));
    devServer = null;
  }
});


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

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

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.on('ping', () => console.log('pong'))

  ipcMain.handle('get-config', () => {
    return {
      CUSTOM_URL_PROTOCOL: config.CUSTOM_URL_PROTOCOL,
      ACCOUNT_NAME: config.ACCOUNT_NAME,
      SERVICE_NAME: config.SERVICE_NAME,
    }
  })

  ipcMain.handle('activate-app', async (_event, activationKey: string) => {
    try {
      const secret = decryptActivationKey(activationKey, config.INIT_BUILD_PASSWORD);
      await keytar.setPassword(config.SERVICE_NAME, config.ACCOUNT_NAME, secret);
      return { success: true };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  });

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

