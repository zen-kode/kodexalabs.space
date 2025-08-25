import { logger } from './logger';
import { securityMonitor } from './security-monitor';

// Health check status
export enum HealthStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  UNHEALTHY = 'unhealthy',
  CRITICAL = 'critical'
}

// Metric types
export enum MetricType {
  COUNTER = 'counter',
  GAUGE = 'gauge',
  HISTOGRAM = 'histogram',
  TIMER = 'timer'
}

// Health check interface
export interface HealthCheck {
  name: string;
  status: HealthStatus;
  message?: string;
  duration?: number;
  timestamp: string;
  metadata?: Record<string, any>;
}

// Metric interface
export interface Metric {
  name: string;
  type: MetricType;
  value: number;
  timestamp: string;
  tags?: Record<string, string>;
  unit?: string;
}

// System info interface
export interface SystemInfo {
  nodeVersion: string;
  platform: string;
  arch: string;
  uptime: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  cpu: {
    usage: number;
  };
  timestamp: string;
}

// Application metrics interface
export interface AppMetrics {
  requests: {
    total: number;
    success: number;
    errors: number;
    rate: number;
  };
  response: {
    averageTime: number;
    p95Time: number;
    p99Time: number;
  };
  database: {
    connections: number;
    queries: number;
    errors: number;
  };
  cache: {
    hits: number;
    misses: number;
    hitRate: number;
  };
  security: {
    threats: number;
    blocked: number;
    alerts: number;
  };
}

// Health checker function type
type HealthChecker = () => Promise<HealthCheck>;

// Monitoring class
export class Monitor {
  private static instance: Monitor;
  private healthCheckers: Map<string, HealthChecker> = new Map();
  private metrics: Map<string, Metric[]> = new Map();
  private requestMetrics: {
    count: number;
    errors: number;
    responseTimes: number[];
    startTime: number;
  } = {
    count: 0,
    errors: 0,
    responseTimes: [],
    startTime: Date.now()
  };
  private databaseMetrics = {
    queries: 0,
    errors: 0,
    connections: 0
  };
  private cacheMetrics = {
    hits: 0,
    misses: 0
  };

  public static getInstance(): Monitor {
    if (!Monitor.instance) {
      Monitor.instance = new Monitor();
    }
    return Monitor.instance;
  }

  constructor() {
    // Register default health checks
    this.registerHealthCheck('system', this.checkSystemHealth.bind(this));
    this.registerHealthCheck('database', this.checkDatabaseHealth.bind(this));
    this.registerHealthCheck('security', this.checkSecurityHealth.bind(this));

    // Start periodic metric collection
    this.startMetricCollection();
  }

  // Register a health check
  registerHealthCheck(name: string, checker: HealthChecker): void {
    this.healthCheckers.set(name, checker);
    logger.debug(`Registered health check: ${name}`);
  }

  // Remove a health check
  unregisterHealthCheck(name: string): void {
    this.healthCheckers.delete(name);
    logger.debug(`Unregistered health check: ${name}`);
  }

  // Run all health checks
  async runHealthChecks(): Promise<{
    status: HealthStatus;
    checks: HealthCheck[];
    timestamp: string;
  }> {
    const checks: HealthCheck[] = [];
    let overallStatus = HealthStatus.HEALTHY;

    for (const [name, checker] of this.healthCheckers) {
      try {
        const startTime = Date.now();
        const check = await Promise.race([
          checker(),
          new Promise<HealthCheck>((_, reject) => 
            setTimeout(() => reject(new Error('Health check timeout')), 5000)
          )
        ]);
        
        check.duration = Date.now() - startTime;
        checks.push(check);

        // Determine overall status
        if (check.status === HealthStatus.CRITICAL) {
          overallStatus = HealthStatus.CRITICAL;
        } else if (check.status === HealthStatus.UNHEALTHY && overallStatus !== HealthStatus.CRITICAL) {
          overallStatus = HealthStatus.UNHEALTHY;
        } else if (check.status === HealthStatus.DEGRADED && overallStatus === HealthStatus.HEALTHY) {
          overallStatus = HealthStatus.DEGRADED;
        }
      } catch (error) {
        const failedCheck: HealthCheck = {
          name,
          status: HealthStatus.CRITICAL,
          message: `Health check failed: ${error.message}`,
          timestamp: new Date().toISOString()
        };
        checks.push(failedCheck);
        overallStatus = HealthStatus.CRITICAL;

        logger.error(`Health check ${name} failed:`, error);
      }
    }

    const result = {
      status: overallStatus,
      checks,
      timestamp: new Date().toISOString()
    };

    // Log health check results
    if (overallStatus !== HealthStatus.HEALTHY) {
      logger.warn('Health check completed with issues:', result);
    } else {
      logger.info('Health check completed successfully');
    }

    return result;
  }

  // Record a metric
  recordMetric(name: string, type: MetricType, value: number, tags?: Record<string, string>, unit?: string): void {
    const metric: Metric = {
      name,
      type,
      value,
      timestamp: new Date().toISOString(),
      tags,
      unit
    };

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const metricHistory = this.metrics.get(name)!;
    metricHistory.push(metric);

    // Keep only last 1000 metrics per name
    if (metricHistory.length > 1000) {
      metricHistory.shift();
    }

    logger.debug(`Recorded metric: ${name} = ${value}`, { type, tags, unit });
  }

  // Get metrics
  getMetrics(name?: string): Metric[] {
    if (name) {
      return this.metrics.get(name) || [];
    }

    const allMetrics: Metric[] = [];
    for (const metrics of this.metrics.values()) {
      allMetrics.push(...metrics);
    }
    return allMetrics;
  }

  // Record request metrics
  recordRequest(responseTime: number, isError: boolean = false): void {
    this.requestMetrics.count++;
    this.requestMetrics.responseTimes.push(responseTime);
    
    if (isError) {
      this.requestMetrics.errors++;
    }

    // Keep only last 1000 response times
    if (this.requestMetrics.responseTimes.length > 1000) {
      this.requestMetrics.responseTimes.shift();
    }

    // Record as metrics
    this.recordMetric('http_requests_total', MetricType.COUNTER, this.requestMetrics.count);
    this.recordMetric('http_request_duration', MetricType.HISTOGRAM, responseTime, undefined, 'ms');
    
    if (isError) {
      this.recordMetric('http_errors_total', MetricType.COUNTER, this.requestMetrics.errors);
    }
  }

  // Record database metrics
  recordDatabaseQuery(duration: number, isError: boolean = false): void {
    this.databaseMetrics.queries++;
    
    if (isError) {
      this.databaseMetrics.errors++;
    }

    this.recordMetric('db_queries_total', MetricType.COUNTER, this.databaseMetrics.queries);
    this.recordMetric('db_query_duration', MetricType.HISTOGRAM, duration, undefined, 'ms');
    
    if (isError) {
      this.recordMetric('db_errors_total', MetricType.COUNTER, this.databaseMetrics.errors);
    }
  }

  // Record cache metrics
  recordCacheHit(): void {
    this.cacheMetrics.hits++;
    this.recordMetric('cache_hits_total', MetricType.COUNTER, this.cacheMetrics.hits);
  }

  recordCacheMiss(): void {
    this.cacheMetrics.misses++;
    this.recordMetric('cache_misses_total', MetricType.COUNTER, this.cacheMetrics.misses);
  }

  // Get application metrics
  getAppMetrics(): AppMetrics {
    const now = Date.now();
    const uptime = (now - this.requestMetrics.startTime) / 1000; // seconds
    const requestRate = this.requestMetrics.count / uptime;

    // Calculate percentiles
    const sortedTimes = [...this.requestMetrics.responseTimes].sort((a, b) => a - b);
    const p95Index = Math.floor(sortedTimes.length * 0.95);
    const p99Index = Math.floor(sortedTimes.length * 0.99);

    const averageTime = sortedTimes.length > 0 
      ? sortedTimes.reduce((a, b) => a + b, 0) / sortedTimes.length 
      : 0;

    const totalCache = this.cacheMetrics.hits + this.cacheMetrics.misses;
    const hitRate = totalCache > 0 ? this.cacheMetrics.hits / totalCache : 0;

    const securityEvents = securityMonitor.getEvents();
    const securityStats = securityMonitor.getStatistics();

    return {
      requests: {
        total: this.requestMetrics.count,
        success: this.requestMetrics.count - this.requestMetrics.errors,
        errors: this.requestMetrics.errors,
        rate: requestRate
      },
      response: {
        averageTime,
        p95Time: sortedTimes[p95Index] || 0,
        p99Time: sortedTimes[p99Index] || 0
      },
      database: {
        connections: this.databaseMetrics.connections,
        queries: this.databaseMetrics.queries,
        errors: this.databaseMetrics.errors
      },
      cache: {
        hits: this.cacheMetrics.hits,
        misses: this.cacheMetrics.misses,
        hitRate
      },
      security: {
        threats: securityStats.totalEvents,
        blocked: securityStats.blockedRequests,
        alerts: securityEvents.filter(e => e.severity === 'high' || e.severity === 'critical').length
      }
    };
  }

  // Get system information
  getSystemInfo(): SystemInfo {
    const memUsage = process.memoryUsage();
    const totalMem = memUsage.heapTotal + memUsage.external;
    const usedMem = memUsage.heapUsed;

    return {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      uptime: process.uptime(),
      memory: {
        used: usedMem,
        total: totalMem,
        percentage: (usedMem / totalMem) * 100
      },
      cpu: {
        usage: process.cpuUsage().user / 1000000 // Convert to seconds
      },
      timestamp: new Date().toISOString()
    };
  }

  // Default health checks
  private async checkSystemHealth(): Promise<HealthCheck> {
    const systemInfo = this.getSystemInfo();
    const memoryUsage = systemInfo.memory.percentage;
    
    let status = HealthStatus.HEALTHY;
    let message = 'System is healthy';

    if (memoryUsage > 90) {
      status = HealthStatus.CRITICAL;
      message = `Critical memory usage: ${memoryUsage.toFixed(1)}%`;
    } else if (memoryUsage > 80) {
      status = HealthStatus.UNHEALTHY;
      message = `High memory usage: ${memoryUsage.toFixed(1)}%`;
    } else if (memoryUsage > 70) {
      status = HealthStatus.DEGRADED;
      message = `Elevated memory usage: ${memoryUsage.toFixed(1)}%`;
    }

    return {
      name: 'system',
      status,
      message,
      timestamp: new Date().toISOString(),
      metadata: systemInfo
    };
  }

  private async checkDatabaseHealth(): Promise<HealthCheck> {
    try {
      // Simple database connectivity check
      // In a real implementation, you would ping your database
      const errorRate = this.databaseMetrics.queries > 0 
        ? this.databaseMetrics.errors / this.databaseMetrics.queries 
        : 0;

      let status = HealthStatus.HEALTHY;
      let message = 'Database is healthy';

      if (errorRate > 0.1) {
        status = HealthStatus.CRITICAL;
        message = `High database error rate: ${(errorRate * 100).toFixed(1)}%`;
      } else if (errorRate > 0.05) {
        status = HealthStatus.DEGRADED;
        message = `Elevated database error rate: ${(errorRate * 100).toFixed(1)}%`;
      }

      return {
        name: 'database',
        status,
        message,
        timestamp: new Date().toISOString(),
        metadata: {
          queries: this.databaseMetrics.queries,
          errors: this.databaseMetrics.errors,
          errorRate
        }
      };
    } catch (error) {
      return {
        name: 'database',
        status: HealthStatus.CRITICAL,
        message: `Database check failed: ${error.message}`,
        timestamp: new Date().toISOString()
      };
    }
  }

  private async checkSecurityHealth(): Promise<HealthCheck> {
    const stats = securityMonitor.getStatistics();
    const recentEvents = securityMonitor.getEvents()
      .filter(e => Date.now() - new Date(e.timestamp).getTime() < 300000); // Last 5 minutes

    const criticalEvents = recentEvents.filter(e => e.severity === 'critical').length;
    const highEvents = recentEvents.filter(e => e.severity === 'high').length;

    let status = HealthStatus.HEALTHY;
    let message = 'Security is healthy';

    if (criticalEvents > 0) {
      status = HealthStatus.CRITICAL;
      message = `${criticalEvents} critical security events in last 5 minutes`;
    } else if (highEvents > 5) {
      status = HealthStatus.UNHEALTHY;
      message = `${highEvents} high-severity security events in last 5 minutes`;
    } else if (highEvents > 0) {
      status = HealthStatus.DEGRADED;
      message = `${highEvents} high-severity security events in last 5 minutes`;
    }

    return {
      name: 'security',
      status,
      message,
      timestamp: new Date().toISOString(),
      metadata: {
        totalEvents: stats.totalEvents,
        recentEvents: recentEvents.length,
        criticalEvents,
        highEvents,
        blockedRequests: stats.blockedRequests
      }
    };
  }

  // Start periodic metric collection
  private startMetricCollection(): void {
    setInterval(() => {
      const systemInfo = this.getSystemInfo();
      
      // Record system metrics
      this.recordMetric('system_memory_usage', MetricType.GAUGE, systemInfo.memory.percentage, undefined, '%');
      this.recordMetric('system_uptime', MetricType.GAUGE, systemInfo.uptime, undefined, 's');
      this.recordMetric('system_cpu_usage', MetricType.GAUGE, systemInfo.cpu.usage, undefined, 's');
      
      // Record application metrics
      const appMetrics = this.getAppMetrics();
      this.recordMetric('app_request_rate', MetricType.GAUGE, appMetrics.requests.rate, undefined, 'req/s');
      this.recordMetric('app_error_rate', MetricType.GAUGE, 
        appMetrics.requests.total > 0 ? appMetrics.requests.errors / appMetrics.requests.total : 0, 
        undefined, '%'
      );
      this.recordMetric('app_cache_hit_rate', MetricType.GAUGE, appMetrics.cache.hitRate, undefined, '%');
    }, 30000); // Every 30 seconds
  }

  // Reset metrics
  resetMetrics(): void {
    this.metrics.clear();
    this.requestMetrics = {
      count: 0,
      errors: 0,
      responseTimes: [],
      startTime: Date.now()
    };
    this.databaseMetrics = {
      queries: 0,
      errors: 0,
      connections: 0
    };
    this.cacheMetrics = {
      hits: 0,
      misses: 0
    };
    
    logger.info('Metrics reset');
  }
}

// Singleton instance
export const monitor = Monitor.getInstance();

// Utility functions
export function recordRequest(responseTime: number, isError: boolean = false): void {
  monitor.recordRequest(responseTime, isError);
}

export function recordDatabaseQuery(duration: number, isError: boolean = false): void {
  monitor.recordDatabaseQuery(duration, isError);
}

export function recordCacheHit(): void {
  monitor.recordCacheHit();
}

export function recordCacheMiss(): void {
  monitor.recordCacheMiss();
}

export async function getHealthStatus() {
  return await monitor.runHealthChecks();
}

export function getMetrics(name?: string) {
  return monitor.getMetrics(name);
}

export function getAppMetrics() {
  return monitor.getAppMetrics();
}

export function getSystemInfo() {
  return monitor.getSystemInfo();
}

// Export default monitor
export default monitor;