import fs from 'node:fs';
import log from 'electron-log/main';

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


export default log;
