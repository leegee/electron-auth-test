import eLog from 'electron-log';

let log;

if (typeof process !== 'undefined' && (process as any).type === 'browser') {
    log = require('electron-log/main');
    const fs = require('fs');

    const logFile = log.transports.file.getFile()?.path;
    try {
        if (logFile && fs.existsSync(logFile)) fs.unlinkSync(logFile);
        console.log(`Cleared old log: ${logFile}`);
    } catch (err) {
        console.warn('Failed to clear log file:', err);
    }

    log.transports.file.level = 'warn';
} else {
    log = eLog; // require('electron-log/renderer');
}

log.transports.console.level = 'debug';

export default log;
