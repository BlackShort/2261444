const fs = require('fs');
const path = require('path');

class Logger {
    constructor() {
        this.logDir = path.join(process.cwd(), 'logs');
        this.ensureLogDirectory();
    }

    ensureLogDirectory() {
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }

    formatMessage(level, message, meta = {}) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level,
            message,
            ...meta
        };
        return JSON.stringify(logEntry) + '\n';
    }

    writeLog(level, message, meta = {}) {
        const logMessage = this.formatMessage(level, message, meta);
        const logFile = path.join(this.logDir, `${new Date().toISOString().split('T')[0]}.log`);
        
        fs.appendFileSync(logFile, logMessage);
        
        const colorCode = {
            'INFO': '\x1b[32m',
            'WARN': '\x1b[33m',
            'ERROR': '\x1b[31m',
            'DEBUG': '\x1b[36m'
        }[level] || '\x1b[0m';
        
        console.log(`${colorCode}[${new Date().toISOString()}] ${level}: ${message}\x1b[0m`, meta);
    }

    info(message, meta = {}) {
        this.writeLog('INFO', message, meta);
    }

    warn(message, meta = {}) {
        this.writeLog('WARN', message, meta);
    }

    error(message, meta = {}) {
        this.writeLog('ERROR', message, meta);
    }

    debug(message, meta = {}) {
        this.writeLog('DEBUG', message, meta);
    }
}

module.exports = new Logger();
