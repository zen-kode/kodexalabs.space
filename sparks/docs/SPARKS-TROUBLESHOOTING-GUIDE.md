# Sparks Troubleshooting Guide & Best Practices

## Table of Contents
1. [Common Issues & Solutions](#common-issues--solutions)
2. [Development Best Practices](#development-best-practices)
3. [Performance Optimization](#performance-optimization)
4. [Security Guidelines](#security-guidelines)
5. [Debugging Procedures](#debugging-procedures)
6. [Error Handling Patterns](#error-handling-patterns)
7. [Testing Strategies](#testing-strategies)
8. [Deployment Troubleshooting](#deployment-troubleshooting)
9. [Monitoring & Logging](#monitoring--logging)
10. [Support Resources](#support-resources)

---

## Common Issues & Solutions

### Authentication Issues

#### Problem: "Authentication failed" or "Invalid token"
**Symptoms:**
- Users cannot log in
- API requests return 401 errors
- Token refresh fails

**Solutions:**
```typescript
// Check token expiration
const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return Date.now() >= payload.exp * 1000
  } catch {
    return true
  }
}

// Implement token refresh
const refreshToken = async (): Promise<string> => {
  const refreshToken = localStorage.getItem('refreshToken')
  if (!refreshToken) {
    throw new Error('No refresh token available')
  }
  
  const response = await fetch('/api/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  })
  
  if (!response.ok) {
    throw new Error('Token refresh failed')
  }
  
  const { token } = await response.json()
  localStorage.setItem('token', token)
  return token
}
```

**Prevention:**
- Implement automatic token refresh
- Use secure token storage
- Set appropriate token expiration times
- Monitor authentication metrics

#### Problem: Firebase/Supabase connection issues
**Symptoms:**
- Database operations fail
- Authentication provider errors
- Network timeout errors

**Solutions:**
```typescript
// Implement retry logic with exponential backoff
const retryWithBackoff = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      if (attempt === maxRetries) throw error
      
      const delay = baseDelay * Math.pow(2, attempt - 1)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  throw new Error('Max retries exceeded')
}

// Usage example
const fetchUserData = () => retryWithBackoff(async () => {
  const response = await fetch('/api/user')
  if (!response.ok) throw new Error('Failed to fetch user data')
  return response.json()
})
```

### AI Service Issues

#### Problem: Genkit/Gemini API errors
**Symptoms:**
- AI generation fails
- Rate limit exceeded
- Model not available

**Solutions:**
```typescript
// Implement rate limiting
class RateLimiter {
  private requests: number[] = []
  
  constructor(
    private maxRequests: number,
    private windowMs: number
  ) {}
  
  canMakeRequest(): boolean {
    const now = Date.now()
    this.requests = this.requests.filter(time => now - time < this.windowMs)
    return this.requests.length < this.maxRequests
  }
  
  recordRequest(): void {
    this.requests.push(Date.now())
  }
}

const rateLimiter = new RateLimiter(10, 60000) // 10 requests per minute

// AI service with error handling
const generateWithAI = async (prompt: string, options: AIOptions = {}) => {
  if (!rateLimiter.canMakeRequest()) {
    throw new Error('Rate limit exceeded. Please try again later.')
  }
  
  try {
    rateLimiter.recordRequest()
    
    const result = await ai.generate({
      prompt,
      model: options.model || 'gemini-1.5-pro',
      config: {
        temperature: options.temperature || 0.7,
        maxOutputTokens: options.maxTokens || 2048
      }
    })
    
    return {
      response: result.text(),
      usage: result.usage,
      model: options.model || 'gemini-1.5-pro'
    }
  } catch (error) {
    if (error.code === 'RATE_LIMIT_EXCEEDED') {
      throw new Error('AI service rate limit exceeded. Please try again in a few minutes.')
    }
    if (error.code === 'MODEL_NOT_AVAILABLE') {
      throw new Error('The requested AI model is currently unavailable. Please try a different model.')
    }
    throw new Error(`AI generation failed: ${error.message}`)
  }
}
```

### Database Issues

#### Problem: Slow query performance
**Symptoms:**
- Long loading times
- Database timeouts
- High CPU usage

**Solutions:**
```typescript
// Implement query optimization
const optimizedPromptQuery = async (userId: string, filters: PromptFilters) => {
  const query = db.prompts
    .select({
      id: true,
      title: true,
      category: true,
      tags: true,
      createdAt: true,
      // Only select needed fields
    })
    .where({
      userId,
      ...(filters.category && { category: filters.category }),
      ...(filters.tags && { tags: { hasSome: filters.tags } })
    })
    .orderBy({ createdAt: 'desc' })
    .limit(filters.limit || 20)
    .offset((filters.page - 1) * (filters.limit || 20))
  
  return query
}

// Implement caching
const cache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

const getCachedData = <T>(key: string): T | null => {
  const cached = cache.get(key)
  if (!cached) return null
  
  if (Date.now() - cached.timestamp > CACHE_TTL) {
    cache.delete(key)
    return null
  }
  
  return cached.data
}

const setCachedData = <T>(key: string, data: T): void => {
  cache.set(key, { data, timestamp: Date.now() })
}
```

### Frontend Issues

#### Problem: Hydration mismatches
**Symptoms:**
- Console warnings about hydration
- Content flashing
- Client-server rendering differences

**Solutions:**
```typescript
// Use dynamic imports for client-only components
import dynamic from 'next/dynamic'

const ClientOnlyComponent = dynamic(
  () => import('./ClientOnlyComponent'),
  { ssr: false }
)

// Use useEffect for client-side only code
const [mounted, setMounted] = useState(false)

useEffect(() => {
  setMounted(true)
}, [])

if (!mounted) {
  return <div>Loading...</div>
}

// Suppress hydration warnings for known differences
<div suppressHydrationWarning>
  {new Date().toLocaleString()}
</div>
```

#### Problem: Memory leaks
**Symptoms:**
- Increasing memory usage
- Slow performance over time
- Browser crashes

**Solutions:**
```typescript
// Proper cleanup in useEffect
useEffect(() => {
  const subscription = eventEmitter.subscribe('event', handler)
  const timer = setInterval(updateData, 1000)
  
  return () => {
    subscription.unsubscribe()
    clearInterval(timer)
  }
}, [])

// Use AbortController for fetch requests
useEffect(() => {
  const controller = new AbortController()
  
  const fetchData = async () => {
    try {
      const response = await fetch('/api/data', {
        signal: controller.signal
      })
      const data = await response.json()
      setData(data)
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Fetch error:', error)
      }
    }
  }
  
  fetchData()
  
  return () => controller.abort()
}, [])
```

---

## Development Best Practices

### Code Organization

#### File Structure Standards
```
src/
├── components/
│   ├── ui/              # Base UI components (Button, Input, etc.)
│   ├── shared/          # Shared business components
│   ├── features/        # Feature-specific components
│   └── layouts/         # Layout components
├── hooks/               # Custom React hooks
├── lib/                 # Utility libraries
├── stores/              # State management
├── types/               # TypeScript definitions
├── constants/           # Application constants
└── utils/               # Helper functions
```

#### Naming Conventions
```typescript
// Components: PascalCase
const PromptEditor = () => {}

// Hooks: camelCase with 'use' prefix
const usePromptEditor = () => {}

// Constants: SCREAMING_SNAKE_CASE
const MAX_PROMPT_LENGTH = 10000

// Types/Interfaces: PascalCase
interface PromptData {
  id: string
  title: string
}

// Files: kebab-case
// prompt-editor.tsx
// use-prompt-editor.ts
// prompt-types.ts
```

### TypeScript Best Practices

#### Strict Type Definitions
```typescript
// Use strict types instead of 'any'
interface APIResponse<T> {
  data: T
  status: 'success' | 'error'
  message?: string
}

// Use union types for known values
type PromptCategory = 'creative' | 'technical' | 'business' | 'educational'

// Use generic types for reusability
interface Repository<T> {
  findById(id: string): Promise<T | null>
  create(data: Omit<T, 'id'>): Promise<T>
  update(id: string, data: Partial<T>): Promise<T>
  delete(id: string): Promise<void>
}

// Use branded types for IDs
type UserId = string & { __brand: 'UserId' }
type PromptId = string & { __brand: 'PromptId' }

const createUserId = (id: string): UserId => id as UserId
```

#### Error Handling
```typescript
// Create custom error classes
class ValidationError extends Error {
  constructor(
    message: string,
    public field: string,
    public code: string
  ) {
    super(message)
    this.name = 'ValidationError'
  }
}

class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message)
    this.name = 'APIError'
  }
}

// Use Result pattern for error handling
type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E }

const safeAsyncOperation = async <T>(
  operation: () => Promise<T>
): Promise<Result<T>> => {
  try {
    const data = await operation()
    return { success: true, data }
  } catch (error) {
    return { success: false, error: error as Error }
  }
}
```

### Component Best Practices

#### Component Composition
```typescript
// Use composition over inheritance
interface CardProps {
  children: React.ReactNode
  className?: string
}

const Card = ({ children, className }: CardProps) => (
  <div className={cn('card-base', className)}>
    {children}
  </div>
)

const CardHeader = ({ children }: { children: React.ReactNode }) => (
  <div className="card-header">{children}</div>
)

const CardContent = ({ children }: { children: React.ReactNode }) => (
  <div className="card-content">{children}</div>
)

// Export as compound component
Card.Header = CardHeader
Card.Content = CardContent

export { Card }
```

#### Performance Optimization
```typescript
// Use React.memo for expensive components
const ExpensiveComponent = React.memo(({ data }: { data: ComplexData }) => {
  const processedData = useMemo(() => {
    return expensiveCalculation(data)
  }, [data])
  
  return <div>{processedData}</div>
})

// Use useCallback for event handlers
const ParentComponent = () => {
  const [items, setItems] = useState<Item[]>([])
  
  const handleItemClick = useCallback((id: string) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, selected: !item.selected } : item
    ))
  }, [])
  
  return (
    <div>
      {items.map(item => (
        <ItemComponent
          key={item.id}
          item={item}
          onClick={handleItemClick}
        />
      ))}
    </div>
  )
}
```

---

## Performance Optimization

### Frontend Performance

#### Bundle Optimization
```typescript
// next.config.js
const nextConfig = {
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons']
  },
  
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all'
          }
        }
      }
    }
    return config
  }
}
```

#### Image Optimization
```typescript
// Use Next.js Image component
import Image from 'next/image'

const OptimizedImage = ({ src, alt, ...props }) => (
  <Image
    src={src}
    alt={alt}
    width={800}
    height={600}
    placeholder="blur"
    blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
    priority={props.priority}
    {...props}
  />
)

// Lazy load images
const LazyImage = ({ src, alt, ...props }) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isInView, setIsInView] = useState(false)
  const imgRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )
    
    if (imgRef.current) {
      observer.observe(imgRef.current)
    }
    
    return () => observer.disconnect()
  }, [])
  
  return (
    <div ref={imgRef} className="relative">
      {isInView && (
        <Image
          src={src}
          alt={alt}
          onLoad={() => setIsLoaded(true)}
          className={`transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          {...props}
        />
      )}
    </div>
  )
}
```

#### Virtual Scrolling
```typescript
// Implement virtual scrolling for large lists
import { FixedSizeList as List } from 'react-window'

const VirtualizedPromptList = ({ prompts }: { prompts: Prompt[] }) => {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>
      <PromptCard prompt={prompts[index]} />
    </div>
  )
  
  return (
    <List
      height={600}
      itemCount={prompts.length}
      itemSize={120}
      width="100%"
    >
      {Row}
    </List>
  )
}
```

### Backend Performance

#### Database Query Optimization
```typescript
// Use database indexes effectively
const getPromptsWithPagination = async ({
  userId,
  category,
  tags,
  page = 1,
  limit = 20
}: GetPromptsParams) => {
  // Use compound indexes for complex queries
  const query = db.prompts.findMany({
    where: {
      userId, // First in compound index
      ...(category && { category }), // Second in compound index
      ...(tags?.length && { tags: { hasSome: tags } })
    },
    select: {
      id: true,
      title: true,
      category: true,
      tags: true,
      createdAt: true,
      // Don't select large fields like 'content' unless needed
    },
    orderBy: [
      { isPinned: 'desc' }, // Pinned items first
      { createdAt: 'desc' }
    ],
    skip: (page - 1) * limit,
    take: limit
  })
  
  return query
}

// Implement connection pooling
const createDatabasePool = () => {
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20, // Maximum number of connections
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000
  })
}
```

#### Caching Strategies
```typescript
// Redis caching implementation
import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL)

class CacheService {
  private static instance: CacheService
  
  static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService()
    }
    return CacheService.instance
  }
  
  async get<T>(key: string): Promise<T | null> {
    try {
      const cached = await redis.get(key)
      return cached ? JSON.parse(cached) : null
    } catch (error) {
      console.error('Cache get error:', error)
      return null
    }
  }
  
  async set<T>(key: string, value: T, ttlSeconds: number = 3600): Promise<void> {
    try {
      await redis.setex(key, ttlSeconds, JSON.stringify(value))
    } catch (error) {
      console.error('Cache set error:', error)
    }
  }
  
  async invalidate(pattern: string): Promise<void> {
    try {
      const keys = await redis.keys(pattern)
      if (keys.length > 0) {
        await redis.del(...keys)
      }
    } catch (error) {
      console.error('Cache invalidation error:', error)
    }
  }
}

// Usage in API routes
const cache = CacheService.getInstance()

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const cacheKey = `prompts:${searchParams.toString()}`
  
  // Try cache first
  const cached = await cache.get(cacheKey)
  if (cached) {
    return NextResponse.json(cached)
  }
  
  // Fetch from database
  const data = await fetchPromptsFromDB(searchParams)
  
  // Cache the result
  await cache.set(cacheKey, data, 300) // 5 minutes
  
  return NextResponse.json(data)
}
```

---

## Security Guidelines

### Authentication Security

```typescript
// Secure token handling
const generateSecureToken = (): string => {
  return crypto.randomBytes(32).toString('hex')
}

const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12
  return bcrypt.hash(password, saltRounds)
}

const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash)
}

// Rate limiting for authentication
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
})
```

### Input Validation

```typescript
// Comprehensive input validation
import { z } from 'zod'
import DOMPurify from 'isomorphic-dompurify'

const sanitizeHtml = (input: string): string => {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
    ALLOWED_ATTR: []
  })
}

const promptValidationSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(100, 'Title too long')
    .refine(val => !/<script|javascript:/i.test(val), 'Invalid characters'),
  content: z.string()
    .min(10, 'Content too short')
    .max(10000, 'Content too long')
    .transform(sanitizeHtml),
  category: z.enum(['creative', 'technical', 'business', 'educational']),
  tags: z.array(z.string().max(50)).max(10, 'Too many tags')
})

// SQL injection prevention
const safeQuery = async (query: string, params: any[]) => {
  // Always use parameterized queries
  return db.query(query, params)
}
```

### API Security

```typescript
// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://kodexalabs.space']
    : ['http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}

// Request validation middleware
const validateRequest = (schema: z.ZodSchema) => {
  return async (req: NextRequest) => {
    try {
      const body = await req.json()
      const validatedData = schema.parse(body)
      return validatedData
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError('Invalid request data', error.errors)
      }
      throw error
    }
  }
}

// API key validation
const validateApiKey = (req: NextRequest): boolean => {
  const apiKey = req.headers.get('x-api-key')
  if (!apiKey) return false
  
  // Use constant-time comparison to prevent timing attacks
  const expectedKey = process.env.API_KEY
  if (!expectedKey) return false
  
  return crypto.timingSafeEqual(
    Buffer.from(apiKey),
    Buffer.from(expectedKey)
  )
}
```

---

## Debugging Procedures

### Frontend Debugging

```typescript
// Debug logging utility
class Logger {
  private static isDevelopment = process.env.NODE_ENV === 'development'
  
  static debug(message: string, data?: any): void {
    if (Logger.isDevelopment) {
      console.log(`[DEBUG] ${message}`, data)
    }
  }
  
  static error(message: string, error?: Error): void {
    console.error(`[ERROR] ${message}`, error)
    
    // Send to error tracking service in production
    if (!Logger.isDevelopment && typeof window !== 'undefined') {
      // Sentry.captureException(error)
    }
  }
  
  static performance(label: string, fn: () => void): void {
    if (Logger.isDevelopment) {
      console.time(label)
      fn()
      console.timeEnd(label)
    } else {
      fn()
    }
  }
}

// React DevTools integration
const useDebugValue = (value: any, formatter?: (value: any) => any) => {
  React.useDebugValue(value, formatter)
}

// Custom hook debugging
const usePromptEditor = (initialPrompt: string) => {
  const [prompt, setPrompt] = useState(initialPrompt)
  const [isValid, setIsValid] = useState(false)
  
  // Debug information for React DevTools
  useDebugValue({ prompt, isValid, length: prompt.length })
  
  useEffect(() => {
    Logger.debug('Prompt changed', { prompt, length: prompt.length })
    setIsValid(prompt.length >= 10)
  }, [prompt])
  
  return { prompt, setPrompt, isValid }
}
```

### Backend Debugging

```typescript
// Request/Response logging
const requestLogger = (req: NextRequest) => {
  const start = Date.now()
  
  Logger.debug('Incoming request', {
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries()),
    timestamp: new Date().toISOString()
  })
  
  return () => {
    const duration = Date.now() - start
    Logger.debug('Request completed', {
      duration: `${duration}ms`,
      url: req.url
    })
  }
}

// Database query debugging
const debugQuery = async <T>(queryName: string, queryFn: () => Promise<T>): Promise<T> => {
  const start = Date.now()
  
  try {
    Logger.debug(`Executing query: ${queryName}`)
    const result = await queryFn()
    const duration = Date.now() - start
    
    Logger.debug(`Query completed: ${queryName}`, {
      duration: `${duration}ms`,
      resultCount: Array.isArray(result) ? result.length : 1
    })
    
    return result
  } catch (error) {
    const duration = Date.now() - start
    Logger.error(`Query failed: ${queryName}`, {
      duration: `${duration}ms`,
      error: error.message
    })
    throw error
  }
}
```

---

## Error Handling Patterns

### Global Error Boundary

```typescript
// components/error-boundary.tsx
interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

class ErrorBoundary extends Component<
  { children: ReactNode; fallback?: ComponentType<{ error: Error }> },
  ErrorBoundaryState
> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false }
  }
  
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    Logger.error('Error boundary caught error', error)
    
    // Report to error tracking service
    if (typeof window !== 'undefined') {
      // Sentry.captureException(error, { extra: errorInfo })
    }
    
    this.setState({ errorInfo })
  }
  
  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback
      return <FallbackComponent error={this.state.error!} />
    }
    
    return this.props.children
  }
}

const DefaultErrorFallback = ({ error }: { error: Error }) => (
  <div className="error-boundary">
    <h2>Something went wrong</h2>
    <p>{error.message}</p>
    <button onClick={() => window.location.reload()}>
      Reload Page
    </button>
  </div>
)
```

### API Error Handling

```typescript
// lib/api-client.ts
class APIClient {
  private baseURL: string
  private defaultHeaders: Record<string, string>
  
  constructor(baseURL: string) {
    this.baseURL = baseURL
    this.defaultHeaders = {
      'Content-Type': 'application/json'
    }
  }
  
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.defaultHeaders,
          ...options.headers
        }
      })
      
      if (!response.ok) {
        await this.handleErrorResponse(response)
      }
      
      return response.json()
    } catch (error) {
      if (error instanceof APIError) {
        throw error
      }
      
      // Network or other errors
      throw new APIError(
        'Network error occurred',
        0,
        'NETWORK_ERROR'
      )
    }
  }
  
  private async handleErrorResponse(response: Response): Promise<never> {
    let errorData: any
    
    try {
      errorData = await response.json()
    } catch {
      errorData = { message: 'Unknown error occurred' }
    }
    
    const message = errorData.message || `HTTP ${response.status}`
    const code = errorData.code || `HTTP_${response.status}`
    
    throw new APIError(message, response.status, code)
  }
  
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' })
  }
  
  async post<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }
}

// Usage with error handling
const useAPI = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const apiCall = useCallback(async <T>(
    operation: () => Promise<T>
  ): Promise<T | null> => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await operation()
      return result
    } catch (error) {
      if (error instanceof APIError) {
        setError(error.message)
      } else {
        setError('An unexpected error occurred')
      }
      return null
    } finally {
      setLoading(false)
    }
  }, [])
  
  return { apiCall, loading, error }
}
```

---

## Testing Strategies

### Unit Testing

```typescript
// __tests__/utils/prompt-validator.test.ts
import { validatePrompt } from '@/lib/validators'

describe('Prompt Validator', () => {
  describe('validatePrompt', () => {
    it('should validate a correct prompt', () => {
      const validPrompt = {
        title: 'Test Prompt',
        content: 'This is a valid prompt content',
        category: 'creative',
        tags: ['test', 'example']
      }
      
      const result = validatePrompt(validPrompt)
      expect(result.success).toBe(true)
    })
    
    it('should reject prompt with empty title', () => {
      const invalidPrompt = {
        title: '',
        content: 'Valid content',
        category: 'creative',
        tags: []
      }
      
      const result = validatePrompt(invalidPrompt)
      expect(result.success).toBe(false)
      expect(result.error?.issues[0].path).toContain('title')
    })
    
    it('should reject prompt with too many tags', () => {
      const invalidPrompt = {
        title: 'Valid Title',
        content: 'Valid content',
        category: 'creative',
        tags: new Array(15).fill('tag') // More than 10 tags
      }
      
      const result = validatePrompt(invalidPrompt)
      expect(result.success).toBe(false)
    })
  })
})
```

### Integration Testing

```typescript
// __tests__/api/prompts.test.ts
import { createMocks } from 'node-mocks-http'
import handler from '@/app/api/prompts/route'

describe('/api/prompts', () => {
  beforeEach(() => {
    // Setup test database
    jest.clearAllMocks()
  })
  
  describe('GET', () => {
    it('should return prompts for authenticated user', async () => {
      const { req, res } = createMocks({
        method: 'GET',
        headers: {
          authorization: 'Bearer valid-token'
        }
      })
      
      await handler(req, res)
      
      expect(res._getStatusCode()).toBe(200)
      const data = JSON.parse(res._getData())
      expect(data).toHaveProperty('data')
      expect(data).toHaveProperty('pagination')
    })
    
    it('should return 401 for unauthenticated request', async () => {
      const { req, res } = createMocks({
        method: 'GET'
      })
      
      await handler(req, res)
      
      expect(res._getStatusCode()).toBe(401)
    })
  })
  
  describe('POST', () => {
    it('should create a new prompt', async () => {
      const promptData = {
        title: 'Test Prompt',
        content: 'Test content',
        category: 'creative',
        tags: ['test']
      }
      
      const { req, res } = createMocks({
        method: 'POST',
        headers: {
          authorization: 'Bearer valid-token',
          'content-type': 'application/json'
        },
        body: promptData
      })
      
      await handler(req, res)
      
      expect(res._getStatusCode()).toBe(201)
      const data = JSON.parse(res._getData())
      expect(data.title).toBe(promptData.title)
    })
  })
})
```

### E2E Testing

```typescript
// __tests__/e2e/prompt-creation.test.ts
import { test, expect } from '@playwright/test'

test.describe('Prompt Creation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login')
    await page.fill('[data-testid="email"]', 'test@kodexalabs.space')
    await page.fill('[data-testid="password"]', 'password123')
    await page.click('[data-testid="login-button"]')
    await page.waitForURL('/dashboard')
  })
  
  test('should create a new prompt successfully', async ({ page }) => {
    // Navigate to prompt creation
    await page.click('[data-testid="create-prompt-button"]')
    await page.waitForURL('/prompts/new')
    
    // Fill out the form
    await page.fill('[data-testid="prompt-title"]', 'E2E Test Prompt')
    await page.fill('[data-testid="prompt-content"]', 'This is a test prompt created by E2E test')
    await page.selectOption('[data-testid="prompt-category"]', 'creative')
    await page.fill('[data-testid="prompt-tags"]', 'test,e2e')
    
    // Submit the form
    await page.click('[data-testid="save-prompt-button"]')
    
    // Verify success
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
    await page.waitForURL('/prompts')
    
    // Verify the prompt appears in the list
    await expect(page.locator('text=E2E Test Prompt')).toBeVisible()
  })
  
  test('should show validation errors for invalid input', async ({ page }) => {
    await page.click('[data-testid="create-prompt-button"]')
    
    // Try to submit without required fields
    await page.click('[data-testid="save-prompt-button"]')
    
    // Check for validation errors
    await expect(page.locator('[data-testid="title-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="content-error"]')).toBeVisible()
  })
})
```

---

## Deployment Troubleshooting

### Vercel Deployment Issues

```bash
# Check build logs
npx vercel logs [deployment-url]

# Local build testing
npm run build
npm run start

# Environment variables check
npx vercel env ls
npx vercel env add [NAME] [VALUE]
```

### Common Build Errors

```typescript
// Fix TypeScript build errors
// next.config.js
const nextConfig = {
  typescript: {
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors (not recommended)
    ignoreBuildErrors: false
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors (not recommended)
    ignoreDuringBuilds: false
  }
}

// Fix import/export issues
// Use dynamic imports for client-side only code
const DynamicComponent = dynamic(() => import('./ClientComponent'), {
  ssr: false,
  loading: () => <div>Loading...</div>
})

// Fix environment variable issues
const requiredEnvVars = [
  'DATABASE_URL',
  'NEXTAUTH_SECRET',
  'GEMINI_API_KEY'
]

requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`)
  }
})
```

---

## Monitoring & Logging

### Application Monitoring

```typescript
// lib/monitoring.ts
class MonitoringService {
  static trackEvent(eventName: string, properties?: Record<string, any>) {
    if (typeof window !== 'undefined') {
      // Client-side tracking
      gtag('event', eventName, properties)
    } else {
      // Server-side logging
      console.log(`Event: ${eventName}`, properties)
    }
  }
  
  static trackError(error: Error, context?: Record<string, any>) {
    console.error('Application error:', error, context)
    
    if (typeof window !== 'undefined') {
      // Send to error tracking service
      // Sentry.captureException(error, { extra: context })
    }
  }
  
  static trackPerformance(metric: string, value: number) {
    if (typeof window !== 'undefined') {
      // Track performance metrics
      gtag('event', 'timing_complete', {
        name: metric,
        value: Math.round(value)
      })
    }
  }
}

// Usage in components
const PromptEditor = () => {
  useEffect(() => {
    MonitoringService.trackEvent('prompt_editor_opened')
  }, [])
  
  const handleSave = async (prompt: Prompt) => {
    const startTime = performance.now()
    
    try {
      await savePrompt(prompt)
      
      const duration = performance.now() - startTime
      MonitoringService.trackPerformance('prompt_save_duration', duration)
      MonitoringService.trackEvent('prompt_saved', {
        category: prompt.category,
        length: prompt.content.length
      })
    } catch (error) {
      MonitoringService.trackError(error, {
        action: 'save_prompt',
        promptId: prompt.id
      })
    }
  }
}
```

### Health Checks

```typescript
// app/api/health/route.ts
export async function GET() {
  const checks = {
    database: false,
    redis: false,
    ai_service: false,
    timestamp: new Date().toISOString()
  }
  
  try {
    // Database health check
    await db.$queryRaw`SELECT 1`
    checks.database = true
  } catch (error) {
    console.error('Database health check failed:', error)
  }
  
  try {
    // Redis health check
    await redis.ping()
    checks.redis = true
  } catch (error) {
    console.error('Redis health check failed:', error)
  }
  
  try {
    // AI service health check
    await ai.generate({
      prompt: 'Health check',
      model: 'gemini-1.5-flash',
      config: { maxOutputTokens: 10 }
    })
    checks.ai_service = true
  } catch (error) {
    console.error('AI service health check failed:', error)
  }
  
  const isHealthy = Object.values(checks).every(check => 
    typeof check === 'boolean' ? check : true
  )
  
  return NextResponse.json(checks, {
    status: isHealthy ? 200 : 503
  })
}
```

---

## Support Resources

### Documentation Links
- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Google Genkit Documentation](https://firebase.google.com/docs/genkit)

### Community Resources
- [Sparks GitHub Repository](https://github.com/your-org/sparks)
- [Discord Community](https://discord.gg/sparks)
- [Stack Overflow Tag: sparks-ai](https://stackoverflow.com/questions/tagged/sparks-ai)

### Getting Help

1. **Check this troubleshooting guide first**
2. **Search existing GitHub issues**
3. **Create a detailed bug report with:**
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details
   - Error messages and stack traces
   - Screenshots if applicable

### Emergency Contacts
- **Technical Lead:** tech-lead@sparks.ai
- **DevOps Team:** devops@sparks.ai
- **Security Issues:** security@sparks.ai

---

**Document Version:** 1.0  
**Last Updated:** December 2024  
**Review Cycle:** Monthly  
**Owner:** Engineering Team