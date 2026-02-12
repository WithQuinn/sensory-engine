/**
 * Telemetry & Logging Module
 * Structured logging with sensitive data filtering
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: Record<string, any>;
  error?: {
    message: string;
    stack?: string;
  };
}

// Sensitive patterns to redact
const SENSITIVE_PATTERNS = [
  /api[_-]?key/gi,
  /token/gi,
  /password/gi,
  /secret/gi,
  /anthropic/gi,
  /openweather/gi,
];

/**
 * Redact sensitive data from objects
 */
function redactSensitiveData(obj: any): any {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === 'string') {
    // Don't redact API responses, just log safely
    return typeof obj === 'string' && obj.length > 500
      ? obj.substring(0, 500) + '...[truncated]'
      : obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => redactSensitiveData(item));
  }

  if (typeof obj === 'object') {
    const redacted: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      // Check if key matches sensitive patterns
      const isSensitive = SENSITIVE_PATTERNS.some(pattern => pattern.test(key));
      redacted[key] = isSensitive ? '[REDACTED]' : redactSensitiveData(value);
    }
    return redacted;
  }

  return obj;
}

/**
 * Format log entry as JSON
 */
function formatLogEntry(entry: LogEntry): string {
  const safeEntry = {
    ...entry,
    data: entry.data ? redactSensitiveData(entry.data) : undefined,
  };
  return JSON.stringify(safeEntry);
}

/**
 * Log a server event
 */
export function logServerEvent(
  level: LogLevel,
  message: string,
  data?: Record<string, any>
): void {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    data: data ? redactSensitiveData(data) : undefined,
  };

  const formatted = formatLogEntry(entry);

  // Log to console based on level
  switch (level) {
    case 'debug':
      if (process.env.NODE_ENV === 'development') {
        console.debug(formatted);
      }
      break;
    case 'info':
      console.log(formatted);
      break;
    case 'warn':
      console.warn(formatted);
      break;
    case 'error':
      console.error(formatted);
      break;
  }
}

/**
 * Log an error with stack trace
 */
export function logError(
  message: string,
  error: Error | unknown,
  data?: Record<string, any>
): void {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level: 'error',
    message,
    data: data ? redactSensitiveData(data) : undefined,
    error: error instanceof Error
      ? {
          message: error.message,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        }
      : { message: String(error) },
  };

  const formatted = formatLogEntry(entry);
  console.error(formatted);
}

/**
 * PostHog event tracking (if available)
 * TODO: Integrate with PostHog when dashboard is configured
 */
export function trackEvent(
  eventName: string,
  properties?: Record<string, any>
): void {
  // For now, just log it
  logServerEvent('info', `Event: ${eventName}`, properties);

  // TODO: Send to PostHog
  // if (process.env.POSTHOG_API_KEY) {
  //   posthog.capture({ event: eventName, properties });
  // }
}

/**
 * Track API performance
 */
export function trackApiPerformance(
  endpoint: string,
  method: string,
  status: number,
  durationMs: number
): void {
  trackEvent('api_request', {
    endpoint,
    method,
    status,
    duration_ms: durationMs,
  });
}

/**
 * Track synthesis event
 */
export function trackSynthesis(
  status: 'success' | 'error' | 'fallback',
  durationMs: number,
  details?: Record<string, any>
): void {
  trackEvent('synthesis_attempt', {
    status,
    duration_ms: durationMs,
    ...details,
  });
}
