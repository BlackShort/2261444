const fs = require('fs');
const path = require('path');
const axios = require('axios');

class Logger {
    constructor() {
        this.logDir = path.join(process.cwd(), 'logs');
        this.ensureLogDirectory();
        this.testServerUrl = 'http://20.244.56.144/evaluation-service/logs';
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

    async Log(stack, level, packageName, message) {
        const logData = {
            stack: stack.toLowerCase(),
            level: level.toLowerCase(), 
            package: packageName.toLowerCase(),
            message: message
        };

        try {
            const response = await axios.post(this.testServerUrl, logData, {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 5000
            });

            if (response.status === 200) {
                return response.data;
            }
        } catch (error) {            
            this.writeLog(level.toUpperCase(), `[${packageName}] ${message}`, { 
                stack, 
                package: packageName,
                testServerError: error.message 
            });
        }
    }

    async info(message, meta = {}) {
        this.writeLog('INFO', message, meta);
        
        const packageName = meta.package || 'service';
        const stack = meta.stack || 'backend';
        
        await this.Log(stack, 'info', packageName, message);
    }

    async warn(message, meta = {}) {
        this.writeLog('WARN', message, meta);
        
        const packageName = meta.package || 'service';
        const stack = meta.stack || 'backend';
        
        await this.Log(stack, 'warn', packageName, message);
    }

    async error(message, meta = {}) {
        this.writeLog('ERROR', message, meta);
        
        const packageName = meta.package || 'handler';
        const stack = meta.stack || 'backend';
        
        await this.Log(stack, 'error', packageName, message);
    }

    async debug(message, meta = {}) {
        this.writeLog('DEBUG', message, meta);
        
        const packageName = meta.package || 'service';
        const stack = meta.stack || 'backend';
        
        await this.Log(stack, 'debug', packageName, message);
    }

    async fatal(message, meta = {}) {
        this.writeLog('ERROR', message, meta);
        
        const packageName = meta.package || 'handler';
        const stack = meta.stack || 'backend';
        
        await this.Log(stack, 'fatal', packageName, message);
    }
}

module.exports = new Logger();
