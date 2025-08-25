import { logger } from './logger';
import { securityConfig } from '@/config/security';

// Configuration validation types
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  score: number; // 0-100 configuration health score
}

export interface ValidationError {
  category: 'environment' | 'security' | 'database' | 'external' | 'performance';
  severity: 'critical' | 'high' | 'medium' | 'low';
  field: string;
  message: string;
  suggestion?: string;
}

export interface ValidationWarning {
  category: 'environment' | 'security' | 'database' | 'external' | 'performance';
  field: string;
  message: string;
  suggestion?: string;
}

// Environment variable definitions
const REQUIRED_ENV_VARS = {
  // Core application
  NODE_ENV: {
    required: true,
    values: ['development', 'production', 'test'],
    category: 'environment' as const
  },
  NEXTAUTH_URL: {
    required: true,
    pattern: /^https?:\/\/.+/,
    category: 'environment' as const
  },
  NEXTAUTH_SECRET: {
    required: true,
    minLength: 32,
    category: 'security' as const
  },
  
  // Database
  SUPABASE_URL: {
    required: true,
    pattern: /^https:\/\/[a-z0-9-]+\.supabase\.co$/,
    category: 'database' as const
  },
  SUPABASE_ANON_KEY: {
    required: true,
    minLength: 100,
    category: 'database' as const
  },
  SUPABASE_SERVICE_ROLE_KEY: {
    required: false, // Optional but recommended for admin operations
    minLength: 100,
    category: 'database' as const
  },
  
  // Firebase (fallback)
  FIREBASE_PROJECT_ID: {
    required: false,
    category: 'database' as const
  },
  FIREBASE_CLIENT_EMAIL: {
    required: false,
    pattern: /^[^@]+@[^@]+\.[^@]+$/,
    category: 'database' as const
  },
  FIREBASE_PRIVATE_KEY: {
    required: false,
    category: 'database' as const
  },
  
  // AI Services
  GOOGLE_GENERATIVE_AI_API_KEY: {
    required: true,
    minLength: 30,
    category: 'external' as const
  },
  
  // OAuth Providers
  GOOGLE_CLIENT_ID: {
    required: true,
    pattern: /^\d+-[a-z0-9]+\.apps\.googleusercontent\.com$/,
    category: 'external' as const
  },
  GOOGLE_CLIENT_SECRET: {
    required: true,
    minLength: 20,
    category: 'security' as const
  },
  GITHUB_CLIENT_ID: {
    required: false,
    category: 'external' as const
  },
  GITHUB_CLIENT_SECRET: {
    required: false,
    minLength: 20,
    category: 'security' as const
  },
  DISCORD_CLIENT_ID: {
    required: false,
    category: 'external' as const
  },
  DISCORD_CLIENT_SECRET: {
    required: false,
    minLength: 20,
    category: 'security' as const
  },
  
  // Redis (optional)
  REDIS_URL: {
    required: false,
    pattern: /^redis(s)?:\/\/.+/,
    category: 'performance' as const
  },
  
  // Email (optional)
  SMTP_HOST: {
    required: false,
    category: 'external' as const
  },
  SMTP_PORT: {
    required: false,
    pattern: /^\d+$/,
    category: 'external' as const
  },
  SMTP_USER: {
    required: false,
    category: 'external' as const
  },
  SMTP_PASSWORD: {
    required: false,
    category: 'security' as const
  },
  
  // Analytics (optional)
  GOOGLE_ANALYTICS_ID: {
    required: false,
    pattern: /^G-[A-Z0-9]+$/,
    category: 'external' as const
  },
  
  // Monitoring (optional)
  SENTRY_DSN: {
    required: false,
    pattern: /^https:\/\/[a-f0-9]+@[a-z0-9.-]+\.ingest\.sentry\.io\/\d+$/,
    category: 'external' as const
  }
};

// Security configuration checks
const SECURITY_CHECKS = {
  sessionTimeout: {
    min: 15 * 60 * 1000, // 15 minutes
    max: 24 * 60 * 60 * 1000, // 24 hours
    recommended: 60 * 60 * 1000 // 1 hour
  },
  maxLoginAttempts: {
    min: 3,
    max: 10,
    recommended: 5
  },
  passwordMinLength: {
    min: 8,
    recommended: 12
  },
  rateLimitWindow: {
    min: 60 * 1000, // 1 minute
    recommended: 15 * 60 * 1000 // 15 minutes
  }
};

export class ConfigValidator {
  private errors: ValidationError[] = [];
  private warnings: ValidationWarning[] = [];

  /**
   * Validate all configuration settings
   */
  public validateAll(): ValidationResult {
    this.errors = [];
    this.warnings = [];

    // Validate environment variables
    this.validateEnvironmentVariables();
    
    // Validate security configuration
    this.validateSecurityConfig();
    
    // Validate database configuration
    this.validateDatabaseConfig();
    
    // Validate external services
    this.validateExternalServices();
    
    // Calculate configuration health score
    const score = this.calculateHealthScore();

    return {
      valid: this.errors.filter(e => e.severity === 'critical').length === 0,
      errors: this.errors,
      warnings: this.warnings,
      score
    };
  }

  /**
   * Validate environment variables
   */
  private validateEnvironmentVariables(): void {
    Object.entries(REQUIRED_ENV_VARS).forEach(([key, config]) => {
      const value = process.env[key];

      // Check if required variable is missing
      if (config.required && !value) {
        this.addError({
          category: config.category,
          severity: 'critical',
          field: key,
          message: `Required environment variable ${key} is not set`,
          suggestion: `Set ${key} in your environment variables or .env file`
        });
        return;
      }

      // Skip further validation if value is not set and not required
      if (!value) return;

      // Validate against allowed values
      if (config.values && !config.values.includes(value)) {
        this.addError({
          category: config.category,
          severity: 'high',
          field: key,
          message: `${key} has invalid value: ${value}`,
          suggestion: `Use one of: ${config.values.join(', ')}`
        });
      }

      // Validate against pattern
      if (config.pattern && !config.pattern.test(value)) {
        this.addError({
          category: config.category,
          severity: 'high',
          field: key,
          message: `${key} format is invalid`,
          suggestion: `Ensure ${key} matches the expected format`
        });
      }

      // Validate minimum length
      if (config.minLength && value.length < config.minLength) {
        this.addError({
          category: config.category,
          severity: config.category === 'security' ? 'high' : 'medium',
          field: key,
          message: `${key} is too short (minimum ${config.minLength} characters)`,
          suggestion: `Use a longer value for ${key}`
        });
      }

      // Check for placeholder values
      if (this.isPlaceholderValue(value)) {
        this.addError({
          category: config.category,
          severity: 'critical',
          field: key,
          message: `${key} appears to be a placeholder value`,
          suggestion: `Replace ${key} with a real value`
        });
      }
    });

    // Check for development-only settings in production
    if (process.env.NODE_ENV === 'production') {
      this.validateProductionSettings();
    }
  }

  /**
   * Validate security configuration
   */
  private validateSecurityConfig(): void {
    try {
      // Check session timeout
      const sessionTimeout = securityConfig.session.maxAge;
      if (sessionTimeout < SECURITY_CHECKS.sessionTimeout.min) {
        this.addWarning({
          category: 'security',
          field: 'session.maxAge',
          message: 'Session timeout is very short, may impact user experience',
          suggestion: `Consider increasing to at least ${SECURITY_CHECKS.sessionTimeout.min / 60000} minutes`
        });
      } else if (sessionTimeout > SECURITY_CHECKS.sessionTimeout.max) {
        this.addWarning({
          category: 'security',
          field: 'session.maxAge',
          message: 'Session timeout is very long, may pose security risk',
          suggestion: `Consider reducing to at most ${SECURITY_CHECKS.sessionTimeout.max / 3600000} hours`
        });
      }

      // Check password requirements
      const minLength = securityConfig.password.minLength;
      if (minLength < SECURITY_CHECKS.passwordMinLength.min) {
        this.addError({
          category: 'security',
          severity: 'medium',
          field: 'password.minLength',
          message: 'Password minimum length is too weak',
          suggestion: `Set minimum password length to at least ${SECURITY_CHECKS.passwordMinLength.min}`
        });
      } else if (minLength < SECURITY_CHECKS.passwordMinLength.recommended) {
        this.addWarning({
          category: 'security',
          field: 'password.minLength',
          message: 'Password minimum length could be stronger',
          suggestion: `Consider setting minimum password length to ${SECURITY_CHECKS.passwordMinLength.recommended}`
        });
      }

      // Check if security features are enabled
      if (!securityConfig.password.requireUppercase) {
        this.addWarning({
          category: 'security',
          field: 'password.requireUppercase',
          message: 'Password uppercase requirement is disabled',
          suggestion: 'Enable uppercase requirement for stronger passwords'
        });
      }

      if (!securityConfig.password.requireNumbers) {
        this.addWarning({
          category: 'security',
          field: 'password.requireNumbers',
          message: 'Password number requirement is disabled',
          suggestion: 'Enable number requirement for stronger passwords'
        });
      }

      if (!securityConfig.password.requireSpecialChars) {
        this.addWarning({
          category: 'security',
          field: 'password.requireSpecialChars',
          message: 'Password special character requirement is disabled',
          suggestion: 'Enable special character requirement for stronger passwords'
        });
      }

    } catch (error) {
      this.addError({
        category: 'security',
        severity: 'high',
        field: 'securityConfig',
        message: 'Unable to validate security configuration',
        suggestion: 'Check security configuration file for errors'
      });
    }
  }

  /**
   * Validate database configuration
   */
  private validateDatabaseConfig(): void {
    const hasSupabase = process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY;
    const hasFirebase = process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL;

    if (!hasSupabase && !hasFirebase) {
      this.addError({
        category: 'database',
        severity: 'critical',
        field: 'database',
        message: 'No database configuration found',
        suggestion: 'Configure either Supabase or Firebase database'
      });
    }

    // Warn if using development database in production
    if (process.env.NODE_ENV === 'production' && process.env.SUPABASE_URL?.includes('localhost')) {
      this.addError({
        category: 'database',
        severity: 'critical',
        field: 'SUPABASE_URL',
        message: 'Using localhost database URL in production',
        suggestion: 'Use production database URL'
      });
    }
  }

  /**
   * Validate external services
   */
  private validateExternalServices(): void {
    // Check OAuth providers
    const oauthProviders = [
      { id: 'GOOGLE', secret: 'GOOGLE_CLIENT_SECRET' },
      { id: 'GITHUB', secret: 'GITHUB_CLIENT_SECRET' },
      { id: 'DISCORD', secret: 'DISCORD_CLIENT_SECRET' }
    ];

    let configuredProviders = 0;
    oauthProviders.forEach(provider => {
      const hasId = process.env[`${provider.id}_CLIENT_ID`];
      const hasSecret = process.env[provider.secret];
      
      if (hasId && hasSecret) {
        configuredProviders++;
      } else if (hasId && !hasSecret) {
        this.addError({
          category: 'external',
          severity: 'high',
          field: provider.secret,
          message: `${provider.id} client ID is set but secret is missing`,
          suggestion: `Set ${provider.secret} to enable ${provider.id} OAuth`
        });
      }
    });

    if (configuredProviders === 0) {
      this.addWarning({
        category: 'external',
        field: 'oauth',
        message: 'No OAuth providers configured',
        suggestion: 'Configure at least one OAuth provider for better user experience'
      });
    }

    // Check AI service
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      this.addError({
        category: 'external',
        severity: 'high',
        field: 'GOOGLE_GENERATIVE_AI_API_KEY',
        message: 'AI service not configured',
        suggestion: 'Set Google Generative AI API key to enable AI features'
      });
    }
  }

  /**
   * Validate production-specific settings
   */
  private validateProductionSettings(): void {
    // Check for insecure settings
    if (process.env.NODE_TLS_REJECT_UNAUTHORIZED === '0') {
      this.addError({
        category: 'security',
        severity: 'critical',
        field: 'NODE_TLS_REJECT_UNAUTHORIZED',
        message: 'TLS certificate validation is disabled in production',
        suggestion: 'Remove NODE_TLS_REJECT_UNAUTHORIZED=0 from production environment'
      });
    }

    // Check HTTPS requirement
    if (process.env.NEXTAUTH_URL && !process.env.NEXTAUTH_URL.startsWith('https://')) {
      this.addError({
        category: 'security',
        severity: 'high',
        field: 'NEXTAUTH_URL',
        message: 'NEXTAUTH_URL should use HTTPS in production',
        suggestion: 'Use HTTPS URL for NEXTAUTH_URL in production'
      });
    }

    // Check for development-only values
    const devValues = ['localhost', '127.0.0.1', 'test', 'dev', 'development'];
    Object.entries(process.env).forEach(([key, value]) => {
      if (value && devValues.some(devVal => value.toLowerCase().includes(devVal))) {
        this.addWarning({
          category: 'environment',
          field: key,
          message: `${key} contains development-like value in production`,
          suggestion: `Review ${key} value for production appropriateness`
        });
      }
    });
  }

  /**
   * Check if a value appears to be a placeholder
   */
  private isPlaceholderValue(value: string): boolean {
    const placeholders = [
      'your_', 'your-', 'replace_', 'replace-', 'change_', 'change-',
      'placeholder', 'example', 'test', 'demo', 'sample',
      'xxx', 'yyy', 'zzz', '123', 'abc',
      'todo', 'fixme', 'changeme'
    ];
    
    const lowerValue = value.toLowerCase();
    return placeholders.some(placeholder => lowerValue.includes(placeholder));
  }

  /**
   * Add validation error
   */
  private addError(error: ValidationError): void {
    this.errors.push(error);
  }

  /**
   * Add validation warning
   */
  private addWarning(warning: ValidationWarning): void {
    this.warnings.push(warning);
  }

  /**
   * Calculate configuration health score (0-100)
   */
  private calculateHealthScore(): number {
    let score = 100;
    
    // Deduct points for errors
    this.errors.forEach(error => {
      switch (error.severity) {
        case 'critical':
          score -= 25;
          break;
        case 'high':
          score -= 15;
          break;
        case 'medium':
          score -= 10;
          break;
        case 'low':
          score -= 5;
          break;
      }
    });

    // Deduct points for warnings
    this.warnings.forEach(() => {
      score -= 2;
    });

    return Math.max(0, score);
  }

  /**
   * Get configuration summary
   */
  public getConfigSummary(): any {
    const result = this.validateAll();
    
    return {
      environment: process.env.NODE_ENV,
      valid: result.valid,
      score: result.score,
      issues: {
        critical: result.errors.filter(e => e.severity === 'critical').length,
        high: result.errors.filter(e => e.severity === 'high').length,
        medium: result.errors.filter(e => e.severity === 'medium').length,
        low: result.errors.filter(e => e.severity === 'low').length,
        warnings: result.warnings.length
      },
      categories: {
        environment: result.errors.filter(e => e.category === 'environment').length + 
                    result.warnings.filter(w => w.category === 'environment').length,
        security: result.errors.filter(e => e.category === 'security').length + 
                 result.warnings.filter(w => w.category === 'security').length,
        database: result.errors.filter(e => e.category === 'database').length + 
                 result.warnings.filter(w => w.category === 'database').length,
        external: result.errors.filter(e => e.category === 'external').length + 
                 result.warnings.filter(w => w.category === 'external').length,
        performance: result.errors.filter(e => e.category === 'performance').length + 
                    result.warnings.filter(w => w.category === 'performance').length
      },
      timestamp: new Date().toISOString()
    };
  }
}

// Export singleton instance
export const configValidator = new ConfigValidator();

// Validate configuration on startup
if (typeof window === 'undefined') { // Server-side only
  const result = configValidator.validateAll();
  
  if (result.errors.length > 0 || result.warnings.length > 0) {
    logger.warn('Configuration validation completed', {
      score: result.score,
      errors: result.errors.length,
      warnings: result.warnings.length,
      critical: result.errors.filter(e => e.severity === 'critical').length
    });
    
    // Log critical errors
    result.errors
      .filter(e => e.severity === 'critical')
      .forEach(error => {
        logger.error(`Critical configuration error: ${error.message}`, {
          field: error.field,
          category: error.category,
          suggestion: error.suggestion
        });
      });
  } else {
    logger.info('Configuration validation passed', {
      score: result.score
    });
  }
}

// Export validation functions
export const validateConfig = () => configValidator.validateAll();
export const getConfigSummary = () => configValidator.getConfigSummary();