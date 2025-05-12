/**
 * Logger utility to control logging levels application-wide
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'none';

// Set the current log level - change this to control verbosity
const CURRENT_LOG_LEVEL: LogLevel = process.env.NODE_ENV === 'production' ? 'info' : 'info';

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  none: 4
};

export const logger = {
  debug: (message: string, ...args: unknown[]) => {
    if (LOG_LEVEL_PRIORITY[CURRENT_LOG_LEVEL] <= LOG_LEVEL_PRIORITY.debug) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  },
  
  info: (message: string, ...args: unknown[]) => {
    if (LOG_LEVEL_PRIORITY[CURRENT_LOG_LEVEL] <= LOG_LEVEL_PRIORITY.info) {
      console.log(`[INFO] ${message}`, ...args);
    }
  },
  
  warn: (message: string, ...args: unknown[]) => {
    if (LOG_LEVEL_PRIORITY[CURRENT_LOG_LEVEL] <= LOG_LEVEL_PRIORITY.warn) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  },
  
  error: (message: string, ...args: unknown[]) => {
    if (LOG_LEVEL_PRIORITY[CURRENT_LOG_LEVEL] <= LOG_LEVEL_PRIORITY.error) {
      console.error(`[ERROR] ${message}`, ...args);
    }
  }
}; 