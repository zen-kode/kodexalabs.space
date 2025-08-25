import { AnalyticsEvent, PerformanceMetrics, UserBehavior } from '@/lib/analytics';
import { logger } from '@/lib/logger';

// Types for analytics utilities
interface TimeRange {
  start: Date;
  end: Date;
}

interface EventFilter {
  type?: string;
  category?: string;
  userId?: string;
  sessionId?: string;
  dateRange?: TimeRange;
}

interface AggregatedData {
  totalEvents: number;
  uniqueUsers: number;
  uniqueSessions: number;
  eventsByType: Record<string, number>;
  eventsByCategory: Record<string, number>;
  usersByDay: Record<string, number>;
  averageSessionDuration: number;
  bounceRate: number;
  conversionRate: number;
}

interface FunnelStep {
  name: string;
  eventType: string;
  users: number;
  conversionRate: number;
}

interface CohortData {
  cohort: string;
  period: number;
  users: number;
  retentionRate: number;
}

interface PerformanceInsights {
  averageLCP: number;
  averageFID: number;
  averageCLS: number;
  averageTTFB: number;
  slowPages: Array<{ url: string; avgLoadTime: number; count: number }>;
  performanceScore: number;
  recommendations: string[];
}

// Device and browser detection utilities
export class DeviceDetector {
  static getUserAgent(): string {
    if (typeof window !== 'undefined') {
      return window.navigator.userAgent;
    }
    return 'Unknown';
  }

  static getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    const userAgent = this.getUserAgent();
    
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
      if (/iPad/i.test(userAgent)) {
        return 'tablet';
      }
      return 'mobile';
    }
    
    if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
      return 'tablet';
    }
    
    return 'desktop';
  }

  static getBrowser(): { name: string; version: string } {
    const userAgent = this.getUserAgent();
    
    // Chrome
    if (userAgent.includes('Chrome')) {
      const version = userAgent.match(/Chrome\/(\d+\.\d+)/);
      return { name: 'Chrome', version: version ? version[1] : 'Unknown' };
    }
    
    // Firefox
    if (userAgent.includes('Firefox')) {
      const version = userAgent.match(/Firefox\/(\d+\.\d+)/);
      return { name: 'Firefox', version: version ? version[1] : 'Unknown' };
    }
    
    // Safari
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      const version = userAgent.match(/Version\/(\d+\.\d+)/);
      return { name: 'Safari', version: version ? version[1] : 'Unknown' };
    }
    
    // Edge
    if (userAgent.includes('Edg')) {
      const version = userAgent.match(/Edg\/(\d+\.\d+)/);
      return { name: 'Edge', version: version ? version[1] : 'Unknown' };
    }
    
    return { name: 'Unknown', version: 'Unknown' };
  }

  static getOS(): string {
    const userAgent = this.getUserAgent();
    
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac OS')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS')) return 'iOS';
    
    return 'Unknown';
  }

  static getScreenResolution(): { width: number; height: number } {
    if (typeof window !== 'undefined') {
      return {
        width: window.screen.width,
        height: window.screen.height
      };
    }
    return { width: 0, height: 0 };
  }

  static getViewportSize(): { width: number; height: number } {
    if (typeof window !== 'undefined') {
      return {
        width: window.innerWidth,
        height: window.innerHeight
      };
    }
    return { width: 0, height: 0 };
  }
}

// Session management utilities
export class SessionManager {
  private static readonly SESSION_KEY = 'analytics-session-id';
  private static readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  private static readonly LAST_ACTIVITY_KEY = 'analytics-last-activity';

  static getSessionId(): string {
    if (typeof window === 'undefined') {
      return 'server-session';
    }

    const now = Date.now();
    const lastActivity = parseInt(sessionStorage.getItem(this.LAST_ACTIVITY_KEY) || '0');
    
    // Check if session has expired
    if (now - lastActivity > this.SESSION_TIMEOUT) {
      this.startNewSession();
    }
    
    let sessionId = sessionStorage.getItem(this.SESSION_KEY);
    if (!sessionId) {
      sessionId = this.generateSessionId();
      sessionStorage.setItem(this.SESSION_KEY, sessionId);
    }
    
    // Update last activity
    sessionStorage.setItem(this.LAST_ACTIVITY_KEY, now.toString());
    
    return sessionId;
  }

  static startNewSession(): void {
    if (typeof window === 'undefined') return;
    
    const sessionId = this.generateSessionId();
    sessionStorage.setItem(this.SESSION_KEY, sessionId);
    sessionStorage.setItem(this.LAST_ACTIVITY_KEY, Date.now().toString());
    
    logger.debug('New analytics session started', { sessionId });
  }

  static endSession(): void {
    if (typeof window === 'undefined') return;
    
    sessionStorage.removeItem(this.SESSION_KEY);
    sessionStorage.removeItem(this.LAST_ACTIVITY_KEY);
    
    logger.debug('Analytics session ended');
  }

  static getSessionDuration(): number {
    if (typeof window === 'undefined') return 0;
    
    const sessionStart = parseInt(sessionStorage.getItem('analytics-session-start') || '0');
    if (!sessionStart) return 0;
    
    return Date.now() - sessionStart;
  }

  private static generateSessionId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 9);
    return `${timestamp}-${random}`;
  }
}

// Event processing utilities
export class EventProcessor {
  static filterEvents(events: AnalyticsEvent[], filter: EventFilter): AnalyticsEvent[] {
    return events.filter(event => {
      if (filter.type && event.type !== filter.type) return false;
      if (filter.category && event.category !== filter.category) return false;
      if (filter.userId && event.userId !== filter.userId) return false;
      if (filter.sessionId && event.sessionId !== filter.sessionId) return false;
      
      if (filter.dateRange) {
        const eventDate = new Date(event.timestamp);
        if (eventDate < filter.dateRange.start || eventDate > filter.dateRange.end) {
          return false;
        }
      }
      
      return true;
    });
  }

  static aggregateEvents(events: AnalyticsEvent[]): AggregatedData {
    const uniqueUsers = new Set(events.map(e => e.userId).filter(Boolean)).size;
    const uniqueSessions = new Set(events.map(e => e.sessionId).filter(Boolean)).size;
    
    const eventsByType: Record<string, number> = {};
    const eventsByCategory: Record<string, number> = {};
    const usersByDay: Record<string, number> = {};
    
    events.forEach(event => {
      // Count by type
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
      
      // Count by category
      if (event.category) {
        eventsByCategory[event.category] = (eventsByCategory[event.category] || 0) + 1;
      }
      
      // Count users by day
      const day = new Date(event.timestamp).toISOString().split('T')[0];
      if (event.userId) {
        usersByDay[day] = (usersByDay[day] || 0) + 1;
      }
    });
    
    // Calculate session metrics
    const sessionEvents = events.filter(e => e.sessionId);
    const sessionDurations = this.calculateSessionDurations(sessionEvents);
    const averageSessionDuration = sessionDurations.length > 0 
      ? sessionDurations.reduce((a, b) => a + b, 0) / sessionDurations.length 
      : 0;
    
    // Calculate bounce rate (sessions with only one event)
    const singleEventSessions = this.getSingleEventSessions(sessionEvents);
    const bounceRate = uniqueSessions > 0 ? singleEventSessions / uniqueSessions : 0;
    
    // Calculate conversion rate (placeholder - would need conversion events)
    const conversionEvents = events.filter(e => e.type === 'conversion');
    const conversionRate = uniqueUsers > 0 ? conversionEvents.length / uniqueUsers : 0;
    
    return {
      totalEvents: events.length,
      uniqueUsers,
      uniqueSessions,
      eventsByType,
      eventsByCategory,
      usersByDay,
      averageSessionDuration,
      bounceRate,
      conversionRate
    };
  }

  static calculateFunnel(events: AnalyticsEvent[], steps: string[]): FunnelStep[] {
    const usersByStep: Record<string, Set<string>> = {};
    
    // Initialize sets for each step
    steps.forEach(step => {
      usersByStep[step] = new Set();
    });
    
    // Count users for each step
    events.forEach(event => {
      if (event.userId && steps.includes(event.type)) {
        usersByStep[event.type].add(event.userId);
      }
    });
    
    // Calculate conversion rates
    const funnelSteps: FunnelStep[] = [];
    let previousUsers = 0;
    
    steps.forEach((step, index) => {
      const users = usersByStep[step].size;
      const conversionRate = index === 0 ? 1 : (previousUsers > 0 ? users / previousUsers : 0);
      
      funnelSteps.push({
        name: step,
        eventType: step,
        users,
        conversionRate
      });
      
      previousUsers = users;
    });
    
    return funnelSteps;
  }

  static calculateCohorts(events: AnalyticsEvent[], cohortPeriod: 'daily' | 'weekly' | 'monthly' = 'weekly'): CohortData[] {
    const userFirstSeen: Record<string, Date> = {};
    const userActivity: Record<string, Date[]> = {};
    
    // Track user first seen and activity
    events.forEach(event => {
      if (!event.userId) return;
      
      const eventDate = new Date(event.timestamp);
      
      if (!userFirstSeen[event.userId]) {
        userFirstSeen[event.userId] = eventDate;
      }
      
      if (!userActivity[event.userId]) {
        userActivity[event.userId] = [];
      }
      userActivity[event.userId].push(eventDate);
    });
    
    // Calculate cohort data
    const cohorts: Record<string, CohortData> = {};
    
    Object.entries(userFirstSeen).forEach(([userId, firstSeen]) => {
      const cohortKey = this.getCohortKey(firstSeen, cohortPeriod);
      
      if (!cohorts[cohortKey]) {
        cohorts[cohortKey] = {
          cohort: cohortKey,
          period: 0,
          users: 0,
          retentionRate: 0
        };
      }
      
      cohorts[cohortKey].users++;
    });
    
    return Object.values(cohorts);
  }

  private static calculateSessionDurations(events: AnalyticsEvent[]): number[] {
    const sessionTimes: Record<string, { start: number; end: number }> = {};
    
    events.forEach(event => {
      if (!event.sessionId) return;
      
      if (!sessionTimes[event.sessionId]) {
        sessionTimes[event.sessionId] = {
          start: event.timestamp,
          end: event.timestamp
        };
      } else {
        sessionTimes[event.sessionId].start = Math.min(sessionTimes[event.sessionId].start, event.timestamp);
        sessionTimes[event.sessionId].end = Math.max(sessionTimes[event.sessionId].end, event.timestamp);
      }
    });
    
    return Object.values(sessionTimes).map(session => session.end - session.start);
  }

  private static getSingleEventSessions(events: AnalyticsEvent[]): number {
    const sessionEventCounts: Record<string, number> = {};
    
    events.forEach(event => {
      if (event.sessionId) {
        sessionEventCounts[event.sessionId] = (sessionEventCounts[event.sessionId] || 0) + 1;
      }
    });
    
    return Object.values(sessionEventCounts).filter(count => count === 1).length;
  }

  private static getCohortKey(date: Date, period: 'daily' | 'weekly' | 'monthly'): string {
    switch (period) {
      case 'daily':
        return date.toISOString().split('T')[0];
      case 'weekly':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        return weekStart.toISOString().split('T')[0];
      case 'monthly':
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      default:
        return date.toISOString().split('T')[0];
    }
  }
}

// Performance analysis utilities
export class PerformanceAnalyzer {
  static analyzePerformance(metrics: PerformanceMetrics[]): PerformanceInsights {
    if (metrics.length === 0) {
      return {
        averageLCP: 0,
        averageFID: 0,
        averageCLS: 0,
        averageTTFB: 0,
        slowPages: [],
        performanceScore: 0,
        recommendations: ['No performance data available']
      };
    }

    const averageLCP = this.calculateAverage(metrics.map(m => m.lcp).filter(Boolean));
    const averageFID = this.calculateAverage(metrics.map(m => m.fid).filter(Boolean));
    const averageCLS = this.calculateAverage(metrics.map(m => m.cls).filter(Boolean));
    const averageTTFB = this.calculateAverage(metrics.map(m => m.ttfb).filter(Boolean));

    const slowPages = this.identifySlowPages(metrics);
    const performanceScore = this.calculatePerformanceScore(averageLCP, averageFID, averageCLS);
    const recommendations = this.generateRecommendations(averageLCP, averageFID, averageCLS, averageTTFB);

    return {
      averageLCP,
      averageFID,
      averageCLS,
      averageTTFB,
      slowPages,
      performanceScore,
      recommendations
    };
  }

  private static calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  private static identifySlowPages(metrics: PerformanceMetrics[]): Array<{ url: string; avgLoadTime: number; count: number }> {
    const pageMetrics: Record<string, { totalLoadTime: number; count: number }> = {};

    metrics.forEach(metric => {
      if (metric.url && metric.loadTime) {
        if (!pageMetrics[metric.url]) {
          pageMetrics[metric.url] = { totalLoadTime: 0, count: 0 };
        }
        pageMetrics[metric.url].totalLoadTime += metric.loadTime;
        pageMetrics[metric.url].count++;
      }
    });

    return Object.entries(pageMetrics)
      .map(([url, data]) => ({
        url,
        avgLoadTime: data.totalLoadTime / data.count,
        count: data.count
      }))
      .filter(page => page.avgLoadTime > 3000) // Pages slower than 3 seconds
      .sort((a, b) => b.avgLoadTime - a.avgLoadTime)
      .slice(0, 10); // Top 10 slowest pages
  }

  private static calculatePerformanceScore(lcp: number, fid: number, cls: number): number {
    let score = 100;

    // LCP scoring (good: <2.5s, needs improvement: 2.5-4s, poor: >4s)
    if (lcp > 4000) score -= 40;
    else if (lcp > 2500) score -= 20;

    // FID scoring (good: <100ms, needs improvement: 100-300ms, poor: >300ms)
    if (fid > 300) score -= 30;
    else if (fid > 100) score -= 15;

    // CLS scoring (good: <0.1, needs improvement: 0.1-0.25, poor: >0.25)
    if (cls > 0.25) score -= 30;
    else if (cls > 0.1) score -= 15;

    return Math.max(0, score);
  }

  private static generateRecommendations(lcp: number, fid: number, cls: number, ttfb: number): string[] {
    const recommendations: string[] = [];

    if (lcp > 2500) {
      recommendations.push('Optimize Largest Contentful Paint by reducing server response times and optimizing images');
    }

    if (fid > 100) {
      recommendations.push('Improve First Input Delay by reducing JavaScript execution time and breaking up long tasks');
    }

    if (cls > 0.1) {
      recommendations.push('Reduce Cumulative Layout Shift by setting size attributes on images and avoiding dynamic content insertion');
    }

    if (ttfb > 600) {
      recommendations.push('Improve Time to First Byte by optimizing server configuration and using a CDN');
    }

    if (recommendations.length === 0) {
      recommendations.push('Performance metrics are within acceptable ranges. Continue monitoring.');
    }

    return recommendations;
  }
}

// Data export utilities
export class DataExporter {
  static exportToCSV(data: any[], filename: string = 'analytics-data.csv'): void {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          if (typeof value === 'string' && value.includes(',')) {
            return `"${value}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');

    this.downloadFile(csvContent, filename, 'text/csv');
  }

  static exportToJSON(data: any, filename: string = 'analytics-data.json'): void {
    const jsonContent = JSON.stringify(data, null, 2);
    this.downloadFile(jsonContent, filename, 'application/json');
  }

  private static downloadFile(content: string, filename: string, mimeType: string): void {
    if (typeof window === 'undefined') return;

    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}

// Utility functions
export const analyticsUtils = {
  // Generate unique event ID
  generateEventId: (): string => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 9);
    return `evt_${timestamp}_${random}`;
  },

  // Format timestamp for display
  formatTimestamp: (timestamp: number, format: 'short' | 'long' = 'short'): string => {
    const date = new Date(timestamp);
    
    if (format === 'short') {
      return date.toLocaleDateString();
    }
    
    return date.toLocaleString();
  },

  // Calculate time difference in human-readable format
  getTimeAgo: (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return `${seconds} second${seconds > 1 ? 's' : ''} ago`;
  },

  // Validate event data
  validateEvent: (event: Partial<AnalyticsEvent>): boolean => {
    return !!(event.type && event.timestamp);
  },

  // Sanitize event properties
  sanitizeProperties: (properties: Record<string, any>): Record<string, any> => {
    const sanitized: Record<string, any> = {};
    
    Object.entries(properties).forEach(([key, value]) => {
      // Remove sensitive data
      if (key.toLowerCase().includes('password') || 
          key.toLowerCase().includes('token') || 
          key.toLowerCase().includes('secret')) {
        return;
      }
      
      // Limit string length
      if (typeof value === 'string' && value.length > 1000) {
        sanitized[key] = value.substring(0, 1000) + '...';
      } else {
        sanitized[key] = value;
      }
    });
    
    return sanitized;
  }
};

// Export all utilities
export {
  TimeRange,
  EventFilter,
  AggregatedData,
  FunnelStep,
  CohortData,
  PerformanceInsights
};