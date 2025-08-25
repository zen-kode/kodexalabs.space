'use client';

import { useEffect, useState } from 'react';
import { logger } from '@/lib/logger';

// Global loading component
export default function Loading() {
  const [loadingTime, setLoadingTime] = useState(0);
  const [showSlowWarning, setShowSlowWarning] = useState(false);

  useEffect(() => {
    const startTime = Date.now();
    
    // Track loading time
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      setLoadingTime(elapsed);
      
      // Show warning if loading takes too long
      if (elapsed > 5000 && !showSlowWarning) {
        setShowSlowWarning(true);
        logger.warn('Slow loading detected', {
          loadingTime: elapsed,
          url: typeof window !== 'undefined' ? window.location.href : 'unknown',
          userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
          timestamp: new Date().toISOString()
        });
      }
      
      // Log extremely slow loading
      if (elapsed > 15000) {
        logger.error('Extremely slow loading detected', {
          loadingTime: elapsed,
          url: typeof window !== 'undefined' ? window.location.href : 'unknown',
          userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
          timestamp: new Date().toISOString()
        });
      }
    }, 1000);

    return () => {
      clearInterval(interval);
      
      // Log final loading time
      const finalTime = Date.now() - startTime;
      if (finalTime > 3000) {
        logger.info('Page loading completed', {
          loadingTime: finalTime,
          url: typeof window !== 'undefined' ? window.location.href : 'unknown',
          timestamp: new Date().toISOString()
        });
      }
    };
  }, [showSlowWarning]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            {/* Loading spinner */}
            <div className="mx-auto flex items-center justify-center h-12 w-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
            
            <h2 className="mt-6 text-center text-2xl font-bold text-gray-900">
              Loading...
            </h2>
            
            <p className="mt-2 text-center text-sm text-gray-600">
              Please wait while we prepare your content
            </p>
            
            {/* Loading progress indicator */}
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: `${Math.min((loadingTime / 3000) * 100, 100)}%`
                  }}
                ></div>
              </div>
            </div>
            
            {/* Show loading time */}
            <p className="mt-2 text-xs text-gray-500">
              {(loadingTime / 1000).toFixed(1)}s
            </p>
            
            {/* Slow loading warning */}
            {showSlowWarning && (
              <div className="mt-4 p-4 bg-yellow-50 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-yellow-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      Slow loading detected
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>
                        This is taking longer than usual. Please check your internet connection.
                      </p>
                    </div>
                    <div className="mt-3">
                      <button
                        onClick={() => {
                          if (typeof window !== 'undefined') {
                            window.location.reload();
                          }
                        }}
                        className="text-sm font-medium text-yellow-800 hover:text-yellow-700 underline"
                      >
                        Refresh page
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Loading tips */}
            <div className="mt-6">
              <div className="text-xs text-gray-500 space-y-1">
                <p>💡 Tip: Make sure you have a stable internet connection</p>
                <p>🔄 The page will load automatically when ready</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Background pattern */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <svg
          className="absolute left-[max(50%,25rem)] top-0 h-[64rem] w-[128rem] -translate-x-1/2 stroke-gray-200 [mask-image:radial-gradient(64rem_64rem_at_top,white,transparent)]"
          aria-hidden="true"
        >
          <defs>
            <pattern
              id="e813992c-7d03-4cc4-a2bd-151760b470a0"
              width={200}
              height={200}
              x="50%"
              y={-1}
              patternUnits="userSpaceOnUse"
            >
              <path d="M100 200V.5M.5 .5H200" fill="none" />
            </pattern>
          </defs>
          <rect
            width="100%"
            height="100%"
            strokeWidth={0}
            fill="url(#e813992c-7d03-4cc4-a2bd-151760b470a0)"
          />
        </svg>
      </div>
    </div>
  );
}