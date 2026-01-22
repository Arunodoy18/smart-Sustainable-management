/**
 * Frontend Logger
 * ===============
 * 
 * Structured logging for frontend with different levels and environments.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: any;
}

class Logger {
  private isDevelopment: boolean;
  private appName: string;

  constructor() {
    this.isDevelopment = import.meta.env.DEV;
    this.appName = import.meta.env.VITE_APP_NAME || 'Smart Waste Platform';
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): void {
    const timestamp = new Date().toISOString();
    const logData = {
      timestamp,
      level,
      app: this.appName,
      message,
      ...context,
    };

    // In development: pretty console output
    if (this.isDevelopment) {
      const emoji = {
        debug: '🔍',
        info: 'ℹ️',
        warn: '⚠️',
        error: '❌',
      }[level];

      console[level === 'debug' ? 'log' : level](
        `${emoji} [${level.toUpperCase()}] ${message}`,
        context || ''
      );
    } else {
      // In production: JSON output (can be sent to logging service)
      console.log(JSON.stringify(logData));
    }
  }

  /**
   * Log debug information (development only)
   */
  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      this.formatMessage('debug', message, context);
    }
  }

  /**
   * Log informational message
   */
  info(message: string, context?: LogContext): void {
    this.formatMessage('info', message, context);
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: LogContext): void {
    this.formatMessage('warn', message, context);
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorContext: LogContext = {
      ...context,
    };

    if (error instanceof Error) {
      errorContext.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    } else if (error) {
      errorContext.error = error;
    }

    this.formatMessage('error', message, errorContext);
  }

  /**
   * Log API request
   */
  apiRequest(method: string, url: string, data?: any): void {
    this.debug(`API Request: ${method} ${url}`, { method, url, data });
  }

  /**
   * Log API response
   */
  apiResponse(method: string, url: string, status: number, duration?: number): void {
    const level = status >= 400 ? 'error' : status >= 300 ? 'warn' : 'info';
    this[level](`API Response: ${method} ${url}`, { 
      method, 
      url, 
      status,
      duration: duration ? `${duration}ms` : undefined,
    });
  }

  /**
   * Log API error
   */
  apiError(method: string, url: string, error: Error | unknown): void {
    this.error(`API Error: ${method} ${url}`, error, { method, url });
  }

  /**
   * Log user action
   */
  userAction(action: string, context?: LogContext): void {
    this.info(`User Action: ${action}`, { action, ...context });
  }

  /**
   * Log navigation
   */
  navigation(from: string, to: string): void {
    this.debug(`Navigation: ${from} → ${to}`, { from, to });
  }

  /**
   * Log performance metric
   */
  performance(metric: string, value: number, unit: string = 'ms'): void {
    this.info(`Performance: ${metric}`, { metric, value, unit });
  }
}

// Export singleton instance
export const logger = new Logger();

// Export type for use in components
export type { LogContext };
