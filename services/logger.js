const fs = require('fs');
const path = require('path');

class Logger {
  constructor() {
    this.logDir = path.join(__dirname, '..', 'logs');
    this.ensureLogDirectory();
    this.logLevels = {
      ERROR: 0,
      WARN: 1,
      INFO: 2,
      DEBUG: 3
    };
    this.currentLevel = this.logLevels.INFO;
  }

  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  getLogFileName(type = 'app') {
    const date = new Date().toISOString().split('T')[0];
    return path.join(this.logDir, `${type}-${date}.log`);
  }

  formatLogEntry(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const entry = {
      timestamp,
      level,
      message,
      ...meta
    };
    return JSON.stringify(entry) + '\n';
  }

  writeToFile(filename, entry) {
    try {
      fs.appendFileSync(filename, entry);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  log(level, message, meta = {}) {
    if (this.logLevels[level] > this.currentLevel) {
      return;
    }

    const entry = this.formatLogEntry(level, message, meta);
    
    // Write to console with colors
    this.logToConsole(level, message, meta);
    
    // Write to file
    this.writeToFile(this.getLogFileName(), entry);
  }

  logToConsole(level, message, meta) {
    const timestamp = new Date().toISOString();
    const colors = {
      ERROR: '\x1b[31m', // Red
      WARN: '\x1b[33m',  // Yellow
      INFO: '\x1b[36m',  // Cyan
      DEBUG: '\x1b[35m'  // Magenta
    };
    const reset = '\x1b[0m';
    
    const color = colors[level] || '';
    const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
    
    console.log(`${color}[${timestamp}] ${level}: ${message}${metaStr}${reset}`);
  }

  error(message, meta = {}) {
    this.log('ERROR', message, meta);
  }

  warn(message, meta = {}) {
    this.log('WARN', message, meta);
  }

  info(message, meta = {}) {
    this.log('INFO', message, meta);
  }

  debug(message, meta = {}) {
    this.log('DEBUG', message, meta);
  }

  // Workflow-specific logging
  logWorkflowExecution(executionId, event, data = {}) {
    const filename = this.getLogFileName('workflow');
    const entry = this.formatLogEntry('INFO', `Workflow execution: ${event}`, {
      executionId,
      event,
      ...data
    });
    
    this.writeToFile(filename, entry);
    this.logToConsole('INFO', `🔄 Workflow ${executionId}: ${event}`, data);
  }

  logTelegramEvent(nodeId, event, data = {}) {
    const filename = this.getLogFileName('telegram');
    const entry = this.formatLogEntry('INFO', `Telegram event: ${event}`, {
      nodeId,
      event,
      ...data
    });
    
    this.writeToFile(filename, entry);
    this.logToConsole('INFO', `🤖 Telegram ${nodeId}: ${event}`, data);
  }

  logError(error, context = {}) {
    const errorData = {
      message: error.message,
      stack: error.stack,
      ...context
    };
    
    this.error('Application error', errorData);
    
    // Write to separate error log
    const filename = this.getLogFileName('error');
    const entry = this.formatLogEntry('ERROR', error.message, errorData);
    this.writeToFile(filename, entry);
  }

  // Get recent logs for debugging
  getRecentLogs(type = 'app', lines = 100) {
    try {
      const filename = this.getLogFileName(type);
      
      if (!fs.existsSync(filename)) {
        return [];
      }

      const content = fs.readFileSync(filename, 'utf-8');
      const logLines = content.trim().split('\n').filter(line => line);
      
      return logLines
        .slice(-lines)
        .map(line => {
          try {
            return JSON.parse(line);
          } catch {
            return { message: line, timestamp: new Date().toISOString() };
          }
        });
    } catch (error) {
      this.error('Failed to read logs', { type, error: error.message });
      return [];
    }
  }

  // Clean old log files (keep last 7 days)
  cleanOldLogs() {
    try {
      const files = fs.readdirSync(this.logDir);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      files.forEach(file => {
        const filePath = path.join(this.logDir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.mtime < sevenDaysAgo) {
          fs.unlinkSync(filePath);
          this.info(`Deleted old log file: ${file}`);
        }
      });
    } catch (error) {
      this.error('Failed to clean old logs', { error: error.message });
    }
  }
}

// Create singleton instance
const logger = new Logger();

// Clean old logs on startup
logger.cleanOldLogs();

module.exports = logger;