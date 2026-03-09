import 'electron-log/preload';
import log from 'electron-log';

// Avoid duplicate log messages in Vite dev mode
if (typeof window !== 'undefined' && !(window as any).__electronLogInitialized) {
    (window as any).__electronLogInitialized = true;
    log.transports.console.level = false;
}


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
