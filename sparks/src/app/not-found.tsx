import Link from 'next/link';
import { headers } from 'next/headers';
import { logger } from '@/lib/logger';
import { securityMonitor } from '@/lib/security-monitor';

// Custom 404 page with logging
export default async function NotFound() {
  const headersList = headers();
  const pathname = headersList.get('x-pathname') || 'unknown';
  const userAgent = headersList.get('user-agent') || 'unknown';
  const referer = headersList.get('referer');
  const clientIp = headersList.get('x-forwarded-for')?.split(',')[0] || 
                   headersList.get('x-real-ip') || 'unknown';

  // Log 404 error
  logger.warn('404 Page Not Found', {
    pathname,
    userAgent,
    referer,
    clientIp,
    timestamp: new Date().toISOString()
  });

  // Check for suspicious 404 patterns
  const suspiciousPatterns = [
    '/admin',
    '/wp-admin',
    '/phpmyadmin',
    '/.env',
    '/config',
    '/backup',
    '/database',
    '/sql',
    '/shell',
    '/cmd',
    '/eval',
    '/proc/self/environ',
    '/../',
    '/etc/passwd',
    '/var/log'
  ];

  const isSuspicious = suspiciousPatterns.some(pattern => 
    pathname.toLowerCase().includes(pattern.toLowerCase())
  );

  if (isSuspicious) {
    securityMonitor.logEvent({
      type: 'suspicious_request',
      severity: 'medium',
      message: 'Suspicious 404 request detected',
      details: {
        pathname,
        userAgent,
        referer,
        reason: 'Accessing suspicious paths'
      },
      clientIp,
      userAgent,
      timestamp: new Date()
    });
  }

  // Check for potential directory traversal attempts
  if (pathname.includes('../') || pathname.includes('..\\')) {
    securityMonitor.logEvent({
      type: 'directory_traversal',
      severity: 'high',
      message: 'Directory traversal attempt detected in 404',
      details: {
        pathname,
        userAgent,
        referer
      },
      clientIp,
      userAgent,
      timestamp: new Date()
    });
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100">
              <svg
                className="h-6 w-6 text-yellow-600"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
                />
              </svg>
            </div>
            <h1 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              404 - Page Not Found
            </h1>
            <p className="mt-2 text-center text-sm text-gray-600">
              The page you're looking for doesn't exist or has been moved.
            </p>
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-4 p-4 bg-yellow-50 rounded-md">
                <div className="text-left">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Development Info:
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p className="font-mono text-xs break-all">
                      Requested path: {pathname}
                    </p>
                    {referer && (
                      <p className="font-mono text-xs break-all mt-1">
                        Referer: {referer}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-6 space-y-3">
            <Link
              href="/"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              Go to homepage
            </Link>
            
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.history.back();
                }
              }}
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              Go back
            </button>
          </div>
          
          <div className="mt-6">
            <div className="text-center">
              <h3 className="text-sm font-medium text-gray-900 mb-3">
                Popular pages:
              </h3>
              <div className="space-y-2">
                <Link
                  href="/dashboard"
                  className="block text-sm text-indigo-600 hover:text-indigo-500 transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  href="/profile"
                  className="block text-sm text-indigo-600 hover:text-indigo-500 transition-colors"
                >
                  Profile
                </Link>
                <Link
                  href="/settings"
                  className="block text-sm text-indigo-600 hover:text-indigo-500 transition-colors"
                >
                  Settings
                </Link>
              </div>
            </div>
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              If you believe this is an error, please contact support.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}