import log from 'electron-log';

if (typeof process !== 'undefined' && (process as any).type === 'browser') {
    const fs = require('fs');

    const logFile = log.transports.file.getFile().path;
    try {
        if (fs.existsSync(logFile)) fs.unlinkSync(logFile);
        console.log(`Cleared old log: ${logFile}`);
    } catch (err) {
        console.warn('Failed to clear log file:', err);
    }

    log.transports.file.level = 'warn';
}

log.transports.console.level = 'debug';

export default log;
