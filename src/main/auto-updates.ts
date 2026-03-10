import { BrowserWindow, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from './logger';

autoUpdater.logger = log;

export function initAutoUpdates(mainWindow: BrowserWindow) {
    autoUpdater.autoDownload = false;

    autoUpdater.on('checking-for-update', () => {
        log.info('Checking for updates...');
    });

    autoUpdater.on('update-available', (info) => {
        log.info('Update available:', info.version);
        mainWindow.webContents.send('update-available', info.version);
    });

    autoUpdater.on('update-not-available', () => {
        log.info('No update available');
    });

    autoUpdater.on('error', (err) => {
        log.error('Update error:', err);
        mainWindow.webContents.send('update-error', err.message);
    });

    autoUpdater.on('update-downloaded', () => {
        log.info('Update downloaded, will install on quit');
        mainWindow.webContents.send('update-downloaded');
    });

    autoUpdater.checkForUpdates().catch(err => log.error('Failed to check updates', err));

    log.info('Auto-updater initialized');
}

ipcMain.on('download-update', () => {
    autoUpdater.downloadUpdate();
});

ipcMain.on('install-update', () => {
    autoUpdater.quitAndInstall();
});

