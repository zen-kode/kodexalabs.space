import { NextRequest, NextResponse } from 'next/server';
import { asyncHandler } from '@/lib/error-handler';
import { logger } from '@/lib/logger';

// API Documentation endpoint
export const GET = asyncHandler(async (request: NextRequest) => {
  const url = new URL(request.url);
  const format = url.searchParams.get('format') || 'json';
  const category = url.searchParams.get('category');
  const search = url.searchParams.get('search');

  const apiDocs = {
    info: {
      title: 'Sparks API Documentation',
      version: '1.0.0',
      description: 'Comprehensive API documentation for the Sparks application',
      contact: {
        name: 'Sparks Development Team',
        url: 'https://github.com/sparks-team/sparks'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? 'https://sparks.app/api' 
          : 'http://localhost:3000/api',
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server'
      }
    ],
    paths: {
      // Authentication endpoints
      '/api/auth/login': {
        post: {
          tags: ['Authentication'],
          summary: 'User login',
          description: 'Authenticate user with email and password',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: {
                      type: 'string',
                      format: 'email',
                      example: 'user@kodexalabs.space'
                    },
                    password: {
                      type: 'string',
                      minLength: 8,
                      example: 'securePassword123'
                    },
                    rememberMe: {
                      type: 'boolean',
                      default: false
                    }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Login successful',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      user: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          email: { type: 'string' },
                          name: { type: 'string' },
                          avatar: { type: 'string' }
                        }
                      },
                      session: {
                        type: 'object',
                        properties: {
                          accessToken: { type: 'string' },
                          refreshToken: { type: 'string' },
                          expiresAt: { type: 'string', format: 'date-time' }
                        }
                      }
                    }
                  }
                }
              }
            },
            '400': {
              description: 'Invalid request data',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error'
                  }
                }
              }
            },
            '401': {
              description: 'Invalid credentials',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error'
                  }
                }
              }
            },
            '429': {
              description: 'Too many requests',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/RateLimitError'
                  }
                }
              }
            }
          }
        }
      },
      '/api/auth/register': {
        post: {
          tags: ['Authentication'],
          summary: 'User registration',
          description: 'Register a new user account',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password', 'name'],
                  properties: {
                    email: {
                      type: 'string',
                      format: 'email',
                      example: 'newuser@kodexalabs.space'
                    },
                    password: {
                      type: 'string',
                      minLength: 8,
                      pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]',
                      example: 'SecurePass123!'
                    },
                    name: {
                      type: 'string',
                      minLength: 2,
                      maxLength: 50,
                      example: 'John Doe'
                    },
                    acceptTerms: {
                      type: 'boolean',
                      const: true
                    }
                  }
                }
              }
            }
          },
          responses: {
            '201': {
              description: 'Registration successful',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      message: { type: 'string' },
                      user: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          email: { type: 'string' },
                          name: { type: 'string' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/auth/logout': {
        post: {
          tags: ['Authentication'],
          summary: 'User logout',
          description: 'Logout current user and invalidate session',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'Logout successful',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      message: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/auth/reset-password': {
        post: {
          tags: ['Authentication'],
          summary: 'Request password reset',
          description: 'Send password reset email to user',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email'],
                  properties: {
                    email: {
                      type: 'string',
                      format: 'email',
                      example: 'user@kodexalabs.space'
                    }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Reset email sent',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      message: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/auth/profile': {
        get: {
          tags: ['User Profile'],
          summary: 'Get user profile',
          description: 'Retrieve current user profile information',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'Profile retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/UserProfile'
                  }
                }
              }
            }
          }
        },
        put: {
          tags: ['User Profile'],
          summary: 'Update user profile',
          description: 'Update current user profile information',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string', minLength: 2, maxLength: 50 },
                    email: { type: 'string', format: 'email' },
                    avatar: { type: 'string', format: 'uri' },
                    bio: { type: 'string', maxLength: 500 },
                    preferences: {
                      type: 'object',
                      properties: {
                        theme: { type: 'string', enum: ['light', 'dark', 'auto'] },
                        language: { type: 'string' },
                        notifications: { type: 'boolean' }
                      }
                    }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Profile updated successfully',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/UserProfile'
                  }
                }
              }
            }
          }
        }
      },
      '/api/auth/session': {
        get: {
          tags: ['Authentication'],
          summary: 'Check session status',
          description: 'Validate current session and return user info',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'Session is valid',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      valid: { type: 'boolean' },
                      user: { $ref: '#/components/schemas/UserProfile' },
                      expiresAt: { type: 'string', format: 'date-time' }
                    }
                  }
                }
              }
            }
          }
        },
        post: {
          tags: ['Authentication'],
          summary: 'Refresh session',
          description: 'Refresh current session token',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'Session refreshed successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      accessToken: { type: 'string' },
                      expiresAt: { type: 'string', format: 'date-time' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/health': {
        get: {
          tags: ['System'],
          summary: 'Health check',
          description: 'Get application health status and metrics',
          parameters: [
            {
              name: 'detailed',
              in: 'query',
              description: 'Include detailed health information',
              required: false,
              schema: { type: 'boolean', default: false }
            },
            {
              name: 'component',
              in: 'query',
              description: 'Check specific component health',
              required: false,
              schema: { type: 'string', enum: ['database', 'cache', 'security', 'system'] }
            }
          ],
          responses: {
            '200': {
              description: 'Health status retrieved',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/HealthStatus'
                  }
                }
              }
            }
          }
        }
      },
      '/api/metrics': {
        get: {
          tags: ['Monitoring'],
          summary: 'Get application metrics',
          description: 'Retrieve application performance and usage metrics',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'format',
              in: 'query',
              description: 'Response format',
              required: false,
              schema: { type: 'string', enum: ['json', 'prometheus'], default: 'json' }
            },
            {
              name: 'range',
              in: 'query',
              description: 'Time range for metrics',
              required: false,
              schema: { type: 'string', pattern: '^\\d+[smhdw]$', default: '1h' }
            },
            {
              name: 'system',
              in: 'query',
              description: 'Include system metrics',
              required: false,
              schema: { type: 'boolean', default: false }
            }
          ],
          responses: {
            '200': {
              description: 'Metrics retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Metrics'
                  }
                },
                'text/plain': {
                  schema: {
                    type: 'string',
                    description: 'Prometheus format metrics'
                  }
                }
              }
            }
          }
        },
        delete: {
          tags: ['Monitoring'],
          summary: 'Reset metrics',
          description: 'Reset all application metrics (admin only)',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: 'Metrics reset successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string' },
                      timestamp: { type: 'string', format: 'date-time' },
                      resetBy: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/security/dashboard': {
        get: {
          tags: ['Security'],
          summary: 'Get security dashboard data',
          description: 'Retrieve security events, statistics, and recommendations',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'timeRange',
              in: 'query',
              description: 'Time range for security events',
              required: false,
              schema: { type: 'string', enum: ['1h', '24h', '7d', '30d'], default: '24h' }
            },
            {
              name: 'eventType',
              in: 'query',
              description: 'Filter by event type',
              required: false,
              schema: { type: 'string' }
            },
            {
              name: 'severity',
              in: 'query',
              description: 'Filter by severity level',
              required: false,
              schema: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] }
            }
          ],
          responses: {
            '200': {
              description: 'Security dashboard data retrieved',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/SecurityDashboard'
                  }
                }
              }
            }
          }
        }
      }
    },
    components: {
      schemas: {
        Error: {
          type: 'object',
          required: ['error', 'message'],
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
            code: { type: 'string' },
            details: { type: 'object' },
            timestamp: { type: 'string', format: 'date-time' },
            requestId: { type: 'string' }
          }
        },
        RateLimitError: {
          allOf: [
            { $ref: '#/components/schemas/Error' },
            {
              type: 'object',
              properties: {
                retryAfter: { type: 'number' },
                limit: { type: 'number' },
                remaining: { type: 'number' },
                resetTime: { type: 'string', format: 'date-time' }
              }
            }
          ]
        },
        UserProfile: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string', format: 'email' },
            name: { type: 'string' },
            avatar: { type: 'string', format: 'uri' },
            bio: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            preferences: {
              type: 'object',
              properties: {
                theme: { type: 'string', enum: ['light', 'dark', 'auto'] },
                language: { type: 'string' },
                notifications: { type: 'boolean' }
              }
            }
          }
        },
        HealthStatus: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['healthy', 'degraded', 'unhealthy'] },
            timestamp: { type: 'string', format: 'date-time' },
            uptime: { type: 'number' },
            version: { type: 'string' },
            environment: { type: 'string' },
            checks: {
              type: 'object',
              properties: {
                database: { $ref: '#/components/schemas/ComponentHealth' },
                cache: { $ref: '#/components/schemas/ComponentHealth' },
                security: { $ref: '#/components/schemas/ComponentHealth' },
                system: { $ref: '#/components/schemas/ComponentHealth' }
              }
            },
            metrics: {
              type: 'object',
              properties: {
                requests: { type: 'number' },
                errors: { type: 'number' },
                responseTime: { type: 'number' },
                memoryUsage: { type: 'number' },
                cpuUsage: { type: 'number' }
              }
            }
          }
        },
        ComponentHealth: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['healthy', 'degraded', 'unhealthy'] },
            message: { type: 'string' },
            responseTime: { type: 'number' },
            lastCheck: { type: 'string', format: 'date-time' }
          }
        },
        Metrics: {
          type: 'object',
          properties: {
            application: {
              type: 'object',
              properties: {
                requests: {
                  type: 'object',
                  properties: {
                    total: { type: 'number' },
                    success: { type: 'number' },
                    errors: { type: 'number' },
                    rate: { type: 'number' },
                    errorRate: { type: 'number' }
                  }
                },
                response: {
                  type: 'object',
                  properties: {
                    averageTime: { type: 'number' },
                    p95Time: { type: 'number' },
                    p99Time: { type: 'number' }
                  }
                },
                database: {
                  type: 'object',
                  properties: {
                    queries: { type: 'number' },
                    errors: { type: 'number' },
                    connections: { type: 'number' },
                    errorRate: { type: 'number' }
                  }
                }
              }
            },
            system: {
              type: 'object',
              properties: {
                uptime: { type: 'number' },
                memory: {
                  type: 'object',
                  properties: {
                    used: { type: 'number' },
                    total: { type: 'number' },
                    percentage: { type: 'number' }
                  }
                },
                cpu: {
                  type: 'object',
                  properties: {
                    usage: { type: 'number' }
                  }
                }
              }
            },
            metadata: {
              type: 'object',
              properties: {
                timestamp: { type: 'string', format: 'date-time' },
                timeRange: { type: 'string' },
                format: { type: 'string' },
                generatedBy: { type: 'string' },
                version: { type: 'string' }
              }
            }
          }
        },
        SecurityDashboard: {
          type: 'object',
          properties: {
            events: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  type: { type: 'string' },
                  severity: { type: 'string' },
                  message: { type: 'string' },
                  timestamp: { type: 'string', format: 'date-time' },
                  clientIp: { type: 'string' },
                  userAgent: { type: 'string' },
                  blocked: { type: 'boolean' }
                }
              }
            },
            statistics: {
              type: 'object',
              properties: {
                totalEvents: { type: 'number' },
                threatLevel: { type: 'string' },
                blockedRequests: { type: 'number' },
                uniqueIps: { type: 'number' }
              }
            },
            recommendations: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  type: { type: 'string' },
                  priority: { type: 'string' },
                  message: { type: 'string' },
                  action: { type: 'string' }
                }
              }
            }
          }
        }
      },
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and session management'
      },
      {
        name: 'User Profile',
        description: 'User profile management'
      },
      {
        name: 'System',
        description: 'System health and status'
      },
      {
        name: 'Monitoring',
        description: 'Application monitoring and metrics'
      },
      {
        name: 'Security',
        description: 'Security monitoring and management'
      }
    ]
  };

  // Filter by category if specified
  let filteredDocs = apiDocs;
  if (category) {
    const categoryPaths = Object.entries(apiDocs.paths).filter(([path, methods]) => {
      return Object.values(methods as any).some((method: any) => 
        method.tags && method.tags.some((tag: string) => 
          tag.toLowerCase().includes(category.toLowerCase())
        )
      );
    });
    filteredDocs = {
      ...apiDocs,
      paths: Object.fromEntries(categoryPaths)
    };
  }

  // Search functionality
  if (search) {
    const searchTerm = search.toLowerCase();
    const searchPaths = Object.entries(filteredDocs.paths).filter(([path, methods]) => {
      return path.toLowerCase().includes(searchTerm) ||
        Object.values(methods as any).some((method: any) => 
          method.summary?.toLowerCase().includes(searchTerm) ||
          method.description?.toLowerCase().includes(searchTerm) ||
          method.tags?.some((tag: string) => tag.toLowerCase().includes(searchTerm))
        );
    });
    filteredDocs = {
      ...filteredDocs,
      paths: Object.fromEntries(searchPaths)
    };
  }

  // Log documentation access
  logger.info('API documentation accessed', {
    format,
    category,
    search,
    pathCount: Object.keys(filteredDocs.paths).length,
    userAgent: request.headers.get('user-agent'),
    clientIp: request.headers.get('x-forwarded-for')?.split(',')[0] || 
              request.headers.get('x-real-ip') || 'unknown'
  });

  // Return HTML documentation for browser requests
  if (format === 'html' || request.headers.get('accept')?.includes('text/html')) {
    const htmlDoc = generateHtmlDocs(filteredDocs);
    return new NextResponse(htmlDoc, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600'
      }
    });
  }

  return NextResponse.json(filteredDocs, {
    status: 200,
    headers: {
      'Cache-Control': 'public, max-age=3600'
    }
  });
});

// Generate HTML documentation
function generateHtmlDocs(docs: any): string {
  const pathsHtml = Object.entries(docs.paths).map(([path, methods]) => {
    const methodsHtml = Object.entries(methods as any).map(([method, details]: [string, any]) => {
      const methodClass = getMethodClass(method);
      const parametersHtml = details.parameters ? 
        details.parameters.map((param: any) => 
          `<li><strong>${param.name}</strong> (${param.in}): ${param.description || 'No description'}</li>`
        ).join('') : '';
      
      return `
        <div class="endpoint">
          <div class="method-header">
            <span class="method ${methodClass}">${method.toUpperCase()}</span>
            <span class="path">${path}</span>
          </div>
          <div class="endpoint-details">
            <h4>${details.summary || 'No summary'}</h4>
            <p>${details.description || 'No description available'}</p>
            ${details.tags ? `<div class="tags">${details.tags.map((tag: string) => `<span class="tag">${tag}</span>`).join('')}</div>` : ''}
            ${parametersHtml ? `<div class="parameters"><h5>Parameters:</h5><ul>${parametersHtml}</ul></div>` : ''}
          </div>
        </div>
      `;
    }).join('');
    
    return methodsHtml;
  }).join('');

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${docs.info.title}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f8f9fa;
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 2rem;
          border-radius: 10px;
          margin-bottom: 2rem;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 2.5rem;
        }
        .header p {
          margin: 0.5rem 0 0 0;
          opacity: 0.9;
        }
        .endpoint {
          background: white;
          border-radius: 8px;
          margin-bottom: 1rem;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          overflow: hidden;
        }
        .method-header {
          padding: 1rem;
          background-color: #f8f9fa;
          border-bottom: 1px solid #e9ecef;
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .method {
          padding: 0.25rem 0.75rem;
          border-radius: 4px;
          font-weight: bold;
          font-size: 0.875rem;
          text-transform: uppercase;
        }
        .method.get { background-color: #28a745; color: white; }
        .method.post { background-color: #007bff; color: white; }
        .method.put { background-color: #ffc107; color: black; }
        .method.delete { background-color: #dc3545; color: white; }
        .path {
          font-family: 'Monaco', 'Menlo', monospace;
          font-size: 1.1rem;
          font-weight: 500;
        }
        .endpoint-details {
          padding: 1.5rem;
        }
        .endpoint-details h4 {
          margin: 0 0 0.5rem 0;
          color: #495057;
        }
        .endpoint-details p {
          margin: 0 0 1rem 0;
          color: #6c757d;
        }
        .tags {
          margin: 1rem 0;
        }
        .tag {
          display: inline-block;
          background-color: #e9ecef;
          color: #495057;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.875rem;
          margin-right: 0.5rem;
        }
        .parameters {
          margin-top: 1rem;
        }
        .parameters h5 {
          margin: 0 0 0.5rem 0;
          color: #495057;
        }
        .parameters ul {
          margin: 0;
          padding-left: 1.5rem;
        }
        .parameters li {
          margin-bottom: 0.25rem;
        }
        .info {
          background: white;
          padding: 1.5rem;
          border-radius: 8px;
          margin-bottom: 2rem;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .server-info {
          background-color: #e3f2fd;
          padding: 1rem;
          border-radius: 4px;
          margin: 1rem 0;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${docs.info.title}</h1>
        <p>Version ${docs.info.version} - ${docs.info.description}</p>
      </div>
      
      <div class="info">
        <h2>Server Information</h2>
        ${docs.servers.map((server: any) => 
          `<div class="server-info">
            <strong>${server.description}:</strong> <code>${server.url}</code>
          </div>`
        ).join('')}
      </div>
      
      <div class="endpoints">
        <h2>API Endpoints</h2>
        ${pathsHtml}
      </div>
    </body>
    </html>
  `;
}

function getMethodClass(method: string): string {
  switch (method.toLowerCase()) {
    case 'get': return 'get';
    case 'post': return 'post';
    case 'put': return 'put';
    case 'delete': return 'delete';
    default: return 'get';
  }
}