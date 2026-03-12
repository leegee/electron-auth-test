import fs from 'node:fs';
import { type BrowserWindow, session } from 'electron';
import log from 'electron-log/main';
export default log;

log.initialize();

log.transports.file.level = 'warn';
log.transports.console.level = 'debug';

const logFile = log.transports.file.getFile()?.path;

try {
    if (logFile && fs.existsSync(logFile)) {
        fs.unlinkSync(logFile);
        console.log(`Cleared old log: ${logFile}`);
    }
} catch (err) {
    console.warn('Failed to clear log file:', err);
}


export function enableRequestLogging(mainWindow: BrowserWindow) {
    const filter = { urls: ['*://*/*'] };

    mainWindow.webContents.on('did-fail-load', (_, code, desc, url) => {
        log.error('LOAD FAILED:', code, desc, url);
    });

    session.defaultSession.webRequest.onBeforeRequest(filter, (details, callback) => {
        log.info('REQUEST:', details.resourceType, details.method, details.url);
        callback({});
    });

    session.defaultSession.webRequest.onCompleted(filter, (details) => {
        log.info('RESPONSE:', details.statusCode, details.url);
    });

    session.defaultSession.webRequest.onErrorOccurred(filter, (details) => {
        log.error('FAILED:', details.error, details.url);
    });
}


export function enableRendererDependencyLogging() {
    const filter = { urls: ['*://*/*'] }

    session.defaultSession.webRequest.onBeforeRequest(filter, (details, callback) => {

        const parent = details.referrer || 'ROOT'

        log.info(
            `LOAD ${details.resourceType}`,
            `${parent}  →  ${details.url}`
        )

        callback({})
    })

    session.defaultSession.webRequest.onErrorOccurred(filter, (details) => {
        log.error(
            `FAILED ${details.resourceType}`,
            `${details.referrer || 'ROOT'}  →  ${details.url}`,
            details.error
        )
    })
}
