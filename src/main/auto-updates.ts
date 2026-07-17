import { BrowserWindow, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from './logger';

autoUpdater.logger = log;

let updateState: "ready" | "downloading" | "" = "";

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

    autoUpdater.on('download-progress', (progress) => {
        mainWindow.webContents.send('update-progress', {
            percent: progress.percent,
            transferred: progress.transferred,
            total: progress.total,
        });
    });

    autoUpdater.on('error', (err) => {
        log.error('Update error:', err);
        mainWindow.webContents.send('update-error', err.message);
    });

    autoUpdater.on('update-downloaded', () => {
        updateState = "ready";
        log.info('Update downloaded, will install on quit');
        mainWindow.webContents.send('update-downloaded');
    });

    ipcMain.on('download-update', () => {
        if (updateState === 'downloading') {
            throw new Error('Update already downloading');
        }

        updateState = 'downloading';
        autoUpdater.downloadUpdate();
    });

    ipcMain.on('install-update', () => {
        if (updateState !== "ready") {
            throw new Error('No update ready');
        }

        // (isSilent, runAfterUpdate)
        autoUpdater.quitAndInstall(false, true);
    });

    // Delayed so as not to slow down launch
    setTimeout(() => {
        autoUpdater.checkForUpdates().catch(err => log.error('Failed to check updates', err));
    }, 5000);

    log.info('Auto-updater initialized');
}

