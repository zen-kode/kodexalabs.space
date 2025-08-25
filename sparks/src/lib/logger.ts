import { ErrorType, ErrorSeverity } from './error-handler';

// Log levels
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4
}

// Log entry interface
export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  service: string;
  environment: string;
  requestId?: string;
  userId?: string;
  sessionId?: string;
  clientIp?: string;
  userAgent?: string;
  url?: string;
  method?: string;
  statusCode?: number;
  duration?: number;
  error?: {
    name: string;
    message: string;
    stack?: string;
    type?: ErrorType;
    severity?: ErrorSeverity;
  };
  metadata?: Record<string, any>;
  tags?: string[];
}

// Logger configuration
interface LoggerConfig {
  level: LogLevel;
  service: string;
  environment: string;
  enableConsole: boolean;
  enableFile: boolean;
  enableExternal: boolean;
  externalEndpoint?: string;
  externalApiKey?: string;
  maxRetries: number;
  batchSize: number;
  flushInterval: number;
}

// Default configuration
const defaultConfig: LoggerConfig = {
  level: process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG,
  service: 'sparks-app',
  environment: process.env.NODE_ENV || 'development',
  enableConsole: true,
  enableFile: false,
  enableExternal: process.env.NODE_ENV === 'production',
  externalEndpoint: process.env.LOG_ENDPOINT,
  externalApiKey: process.env.LOG_API_KEY,
  maxRetries: 3,
  batchSize: 10,
  flushInterval: 5000
};

// Logger class
export class Logger {
  private config: LoggerConfig;
  private logBuffer: LogEntry[] = [];
  private flushTimer?: NodeJS.Timeout;
  private retryQueue: LogEntry[] = [];

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    
    // Start flush timer for batched logging
    if (this.config.enableExternal) {
      this.startFlushTimer();
    }

    // Handle process exit to flush remaining logs
    if (typeof process !== 'undefined') {
      process.on('exit', () => this.flush());
      process.on('SIGINT', () => {
        this.flush();
        process.exit(0);
      });
      process.on('SIGTERM', () => {
        this.flush();
        process.exit(0);
      });
    }
  }

  // Core logging method
  private log(level: LogLevel, message: string, metadata?: Record<string, any>): void {
    // Check if log level is enabled
    if (level < this.config.level) {
      return;
    }

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      service: this.config.service,
      environment: this.config.environment,
      metadata
    };

    // Add to buffer for external logging
    if (this.config.enableExternal) {
      this.logBuffer.push(entry);
      
      // Flush if buffer is full
      if (this.logBuffer.length >= this.config.batchSize) {
        this.flush();
      }
    }

    // Console logging
    if (this.config.enableConsole) {
      this.logToConsole(entry);
    }

    // File logging (if enabled)
    if (this.config.enableFile) {
      this.logToFile(entry);
    }
  }

  // Public logging methods
  debug(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, metadata);
  }

  info(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, metadata);
  }

  warn(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, metadata);
  }

  error(message: string, error?: Error | any, metadata?: Record<string, any>): void {
    const logMetadata = { ...metadata };
    
    if (error) {
      logMetadata.error = {
        name: error.name || 'Error',
        message: error.message || String(error),
        stack: error.stack,
        type: error.type,
        severity: error.severity
      };
    }

    this.log(LogLevel.ERROR, message, logMetadata);
  }

  fatal(message: string, error?: Error | any, metadata?: Record<string, any>): void {
    const logMetadata = { ...metadata };
    
    if (error) {
      logMetadata.error = {
        name: error.name || 'FatalError',
        message: error.message || String(error),
        stack: error.stack,
        type: error.type,
        severity: error.severity
      };
    }

    this.log(LogLevel.FATAL, message, logMetadata);
  }

  // Structured logging for HTTP requests
  logRequest({
    method,
    url,
    statusCode,
    duration,
    requestId,
    userId,
    clientIp,
    userAgent,
    metadata
  }: {
    method: string;
    url: string;
    statusCode: number;
    duration: number;
    requestId?: string;
    userId?: string;
    clientIp?: string;
    userAgent?: string;
    metadata?: Record<string, any>;
  }): void {
    const level = statusCode >= 500 ? LogLevel.ERROR : 
                 statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO;

    const entry: LogEntry = {
      level,
      message: `${method} ${url} ${statusCode} - ${duration}ms`,
      timestamp: new Date().toISOString(),
      service: this.config.service,
      environment: this.config.environment,
      requestId,
      userId,
      clientIp,
      userAgent,
      url,
      method,
      statusCode,
      duration,
      metadata,
      tags: ['http-request']
    };

    if (this.config.enableExternal) {
      this.logBuffer.push(entry);
    }

    if (this.config.enableConsole) {
      this.logToConsole(entry);
    }
  }

  // Security event logging
  logSecurityEvent({
    event,
    severity,
    clientIp,
    userAgent,
    userId,
    metadata
  }: {
    event: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    clientIp?: string;
    userAgent?: string;
    userId?: string;
    metadata?: Record<string, any>;
  }): void {
    const level = severity === 'critical' ? LogLevel.FATAL :
                 severity === 'high' ? LogLevel.ERROR :
                 severity === 'medium' ? LogLevel.WARN : LogLevel.INFO;

    this.log(level, `Security Event: ${event}`, {
      ...metadata,
      securityEvent: true,
      severity,
      clientIp,
      userAgent,
      userId,
      tags: ['security', severity]
    });
  }

  // Performance logging
  logPerformance({
    operation,
    duration,
    metadata
  }: {
    operation: string;
    duration: number;
    metadata?: Record<string, any>;
  }): void {
    const level = duration > 5000 ? LogLevel.WARN : LogLevel.INFO;
    
    this.log(level, `Performance: ${operation} took ${duration}ms`, {
      ...metadata,
      performance: true,
      operation,
      duration,
      tags: ['performance']
    });
  }

  // Console logging with colors
  private logToConsole(entry: LogEntry): void {
    const colors = {
      [LogLevel.DEBUG]: '\x1b[36m', // Cyan
      [LogLevel.INFO]: '\x1b[32m',  // Green
      [LogLevel.WARN]: '\x1b[33m',  // Yellow
      [LogLevel.ERROR]: '\x1b[31m', // Red
      [LogLevel.FATAL]: '\x1b[35m'  // Magenta
    };

    const reset = '\x1b[0m';
    const levelName = LogLevel[entry.level];
    const color = colors[entry.level];

    const prefix = `${color}[${levelName}]${reset} ${entry.timestamp}`;
    const message = `${prefix} - ${entry.message}`;

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(message, entry.metadata || '');
        break;
      case LogLevel.INFO:
        console.info(message, entry.metadata || '');
        break;
      case LogLevel.WARN:
        console.warn(message, entry.metadata || '');
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(message, entry.metadata || '');
        if (entry.error?.stack) {
          console.error(entry.error.stack);
        }
        break;
    }
  }

  // File logging (placeholder - would need file system access)
  private logToFile(entry: LogEntry): void {
    // In a real implementation, you would write to a file
    // This is a placeholder for file logging functionality
    if (typeof process !== 'undefined' && process.env.LOG_FILE) {
      // File logging implementation would go here
    }
  }

  // External logging (e.g., to logging service)
  private async logToExternal(entries: LogEntry[]): Promise<void> {
    if (!this.config.externalEndpoint) {
      return;
    }

    try {
      const response = await fetch(this.config.externalEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.externalApiKey && {
            'Authorization': `Bearer ${this.config.externalApiKey}`
          })
        },
        body: JSON.stringify({ logs: entries })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      // Add failed entries to retry queue
      this.retryQueue.push(...entries);
      
      // Log to console as fallback
      console.error('Failed to send logs to external service:', error);
    }
  }

  // Flush logs to external service
  private async flush(): Promise<void> {
    if (this.logBuffer.length === 0 && this.retryQueue.length === 0) {
      return;
    }

    const entriesToSend = [...this.logBuffer, ...this.retryQueue];
    this.logBuffer = [];
    this.retryQueue = [];

    if (this.config.enableExternal && entriesToSend.length > 0) {
      await this.logToExternal(entriesToSend);
    }
  }

  // Start flush timer
  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush().catch(console.error);
    }, this.config.flushInterval);
  }

  // Stop flush timer
  public stop(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = undefined;
    }
    this.flush();
  }

  // Create child logger with additional context
  public child(context: Record<string, any>): Logger {
    const childLogger = new Logger(this.config);
    
    // Override log method to include context
    const originalLog = childLogger.log.bind(childLogger);
    childLogger.log = (level: LogLevel, message: string, metadata?: Record<string, any>) => {
      const mergedMetadata = { ...context, ...metadata };
      originalLog(level, message, mergedMetadata);
    };

    return childLogger;
  }
}

// Create singleton logger instance
export const logger = new Logger();

// Performance measurement utility
export class PerformanceTimer {
  private startTime: number;
  private operation: string;
  private logger: Logger;

  constructor(operation: string, logger: Logger = logger) {
    this.operation = operation;
    this.logger = logger;
    this.startTime = Date.now();
  }

  end(metadata?: Record<string, any>): number {
    const duration = Date.now() - this.startTime;
    this.logger.logPerformance({
      operation: this.operation,
      duration,
      metadata
    });
    return duration;
  }
}

// Utility function to measure async operations
export async function measureAsync<T>(
  operation: string,
  fn: () => Promise<T>,
  logger: Logger = logger
): Promise<T> {
  const timer = new PerformanceTimer(operation, logger);
  try {
    const result = await fn();
    timer.end({ success: true });
    return result;
  } catch (error) {
    timer.end({ success: false, error: error.message });
    throw error;
  }
}

// Export default logger
export default logger;