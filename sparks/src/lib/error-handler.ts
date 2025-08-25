import { NextRequest, NextResponse } from 'next/server';
import { securityMonitor } from './security-monitor';

// Error types for better categorization
export enum ErrorType {
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  DATABASE = 'DATABASE',
  EXTERNAL_API = 'EXTERNAL_API',
  RATE_LIMIT = 'RATE_LIMIT',
  SECURITY = 'SECURITY',
  INTERNAL = 'INTERNAL',
  NETWORK = 'NETWORK',
  TIMEOUT = 'TIMEOUT'
}

// Error severity levels
export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

// Custom error class with additional context
export class AppError extends Error {
  public readonly type: ErrorType;
  public readonly severity: ErrorSeverity;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly context?: Record<string, any>;
  public readonly timestamp: Date;
  public readonly requestId?: string;

  constructor(
    message: string,
    type: ErrorType,
    severity: ErrorSeverity,
    statusCode: number = 500,
    isOperational: boolean = true,
    context?: Record<string, any>,
    requestId?: string
  ) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.severity = severity;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.context = context;
    this.timestamp = new Date();
    this.requestId = requestId;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Error response interface
interface ErrorResponse {
  error: {
    message: string;
    type: string;
    code: string;
    requestId?: string;
    timestamp: string;
    details?: any;
  };
}

// Logger interface
interface Logger {
  info(message: string, meta?: any): void;
  warn(message: string, meta?: any): void;
  error(message: string, meta?: any): void;
  debug(message: string, meta?: any): void;
}

// Simple console logger for development
class ConsoleLogger implements Logger {
  info(message: string, meta?: any): void {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, meta || '');
  }

  warn(message: string, meta?: any): void {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, meta || '');
  }

  error(message: string, meta?: any): void {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, meta || '');
  }

  debug(message: string, meta?: any): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${new Date().toISOString()} - ${message}`, meta || '');
    }
  }
}

// Production logger (can be extended to use external services)
class ProductionLogger implements Logger {
  info(message: string, meta?: any): void {
    this.log('info', message, meta);
  }

  warn(message: string, meta?: any): void {
    this.log('warn', message, meta);
  }

  error(message: string, meta?: any): void {
    this.log('error', message, meta);
    // In production, you might want to send to external logging service
    // e.g., Sentry, LogRocket, etc.
  }

  debug(message: string, meta?: any): void {
    // Usually disabled in production
    if (process.env.LOG_LEVEL === 'debug') {
      this.log('debug', message, meta);
    }
  }

  private log(level: string, message: string, meta?: any): void {
    const logEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      meta,
      environment: process.env.NODE_ENV,
      service: 'sparks-app'
    };

    console.log(JSON.stringify(logEntry));
  }
}

// Logger factory
export const logger: Logger = process.env.NODE_ENV === 'production' 
  ? new ProductionLogger() 
  : new ConsoleLogger();

// Error handler class
export class ErrorHandler {
  private static instance: ErrorHandler;

  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  // Handle errors and return appropriate response
  public handleError(error: Error, request?: NextRequest): NextResponse {
    const requestId = this.generateRequestId();
    let appError: AppError;

    // Convert regular errors to AppError
    if (error instanceof AppError) {
      appError = error;
    } else {
      appError = this.convertToAppError(error, requestId);
    }

    // Log the error
    this.logError(appError, request);

    // Log security events if applicable
    if (appError.type === ErrorType.SECURITY || appError.severity === ErrorSeverity.CRITICAL) {
      securityMonitor.logEvent({
        type: 'SECURITY_INCIDENT',
        severity: appError.severity.toLowerCase() as any,
        message: appError.message,
        clientIp: this.getClientIp(request),
        userAgent: request?.headers.get('user-agent') || 'unknown',
        metadata: {
          errorType: appError.type,
          statusCode: appError.statusCode,
          context: appError.context
        }
      });
    }

    // Return error response
    return this.createErrorResponse(appError);
  }

  // Convert regular error to AppError
  private convertToAppError(error: Error, requestId: string): AppError {
    // Handle specific error types
    if (error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND')) {
      return new AppError(
        'Service temporarily unavailable',
        ErrorType.NETWORK,
        ErrorSeverity.HIGH,
        503,
        true,
        { originalError: error.message },
        requestId
      );
    }

    if (error.message.includes('timeout')) {
      return new AppError(
        'Request timeout',
        ErrorType.TIMEOUT,
        ErrorSeverity.MEDIUM,
        408,
        true,
        { originalError: error.message },
        requestId
      );
    }

    if (error.message.includes('JWT') || error.message.includes('token')) {
      return new AppError(
        'Authentication failed',
        ErrorType.AUTHENTICATION,
        ErrorSeverity.MEDIUM,
        401,
        true,
        { originalError: error.message },
        requestId
      );
    }

    // Default internal error
    return new AppError(
      process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : error.message,
      ErrorType.INTERNAL,
      ErrorSeverity.HIGH,
      500,
      false,
      { originalError: error.message, stack: error.stack },
      requestId
    );
  }

  // Log error with appropriate level
  private logError(error: AppError, request?: NextRequest): void {
    const logContext = {
      requestId: error.requestId,
      type: error.type,
      severity: error.severity,
      statusCode: error.statusCode,
      url: request?.url,
      method: request?.method,
      userAgent: request?.headers.get('user-agent'),
      clientIp: this.getClientIp(request),
      context: error.context,
      stack: error.stack
    };

    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
        logger.error(`CRITICAL ERROR: ${error.message}`, logContext);
        break;
      case ErrorSeverity.HIGH:
        logger.error(`HIGH SEVERITY: ${error.message}`, logContext);
        break;
      case ErrorSeverity.MEDIUM:
        logger.warn(`MEDIUM SEVERITY: ${error.message}`, logContext);
        break;
      case ErrorSeverity.LOW:
        logger.info(`LOW SEVERITY: ${error.message}`, logContext);
        break;
      default:
        logger.error(`UNKNOWN SEVERITY: ${error.message}`, logContext);
    }
  }

  // Create error response
  private createErrorResponse(error: AppError): NextResponse {
    const errorResponse: ErrorResponse = {
      error: {
        message: error.message,
        type: error.type,
        code: `ERR_${error.type}_${error.statusCode}`,
        requestId: error.requestId,
        timestamp: error.timestamp.toISOString()
      }
    };

    // Include details in development
    if (process.env.NODE_ENV === 'development' && error.context) {
      errorResponse.error.details = error.context;
    }

    return NextResponse.json(errorResponse, { 
      status: error.statusCode,
      headers: {
        'X-Request-ID': error.requestId || 'unknown',
        'X-Error-Type': error.type
      }
    });
  }

  // Generate unique request ID
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get client IP address
  private getClientIp(request?: NextRequest): string {
    if (!request) return 'unknown';
    
    return (
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      request.headers.get('cf-connecting-ip') ||
      'unknown'
    );
  }
}

// Singleton instance
export const errorHandler = ErrorHandler.getInstance();

// Utility functions for common errors
export const createValidationError = (message: string, context?: any) => 
  new AppError(message, ErrorType.VALIDATION, ErrorSeverity.LOW, 400, true, context);

export const createAuthError = (message: string = 'Authentication required') => 
  new AppError(message, ErrorType.AUTHENTICATION, ErrorSeverity.MEDIUM, 401);

export const createAuthorizationError = (message: string = 'Insufficient permissions') => 
  new AppError(message, ErrorType.AUTHORIZATION, ErrorSeverity.MEDIUM, 403);

export const createNotFoundError = (resource: string = 'Resource') => 
  new AppError(`${resource} not found`, ErrorType.VALIDATION, ErrorSeverity.LOW, 404);

export const createRateLimitError = (message: string = 'Rate limit exceeded') => 
  new AppError(message, ErrorType.RATE_LIMIT, ErrorSeverity.MEDIUM, 429);

export const createDatabaseError = (message: string, context?: any) => 
  new AppError(message, ErrorType.DATABASE, ErrorSeverity.HIGH, 500, true, context);

export const createExternalApiError = (service: string, message?: string) => 
  new AppError(
    message || `External service ${service} is unavailable`,
    ErrorType.EXTERNAL_API,
    ErrorSeverity.MEDIUM,
    503
  );

// Async error wrapper for API routes
export const asyncHandler = (fn: Function) => {
  return async (request: NextRequest, context?: any) => {
    try {
      return await fn(request, context);
    } catch (error) {
      return errorHandler.handleError(error as Error, request);
    }
  };
};

// Global error boundary for unhandled errors
if (typeof window === 'undefined') {
  process.on('unhandledRejection', (reason: any) => {
    logger.error('Unhandled Promise Rejection:', {
      reason: reason?.message || reason,
      stack: reason?.stack
    });
  });

  process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught Exception:', {
      message: error.message,
      stack: error.stack
    });
    
    // Graceful shutdown in production
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  });
}