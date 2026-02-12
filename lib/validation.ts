/**
 * Unified Validation & Response Schemas
 * Central place for all response schemas and error handling
 */

import { z } from 'zod';

/**
 * Error Response Schema - Used for all API errors
 */
export const ErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  code: z.enum([
    'VALIDATION_ERROR',
    'RATE_LIMITED',
    'CSRF_INVALID',
    'SYNTHESIS_FAILED',
    'EXTERNAL_API_ERROR',
    'INTERNAL_ERROR',
  ]),
  details: z.record(z.any()).optional(),
  requestId: z.string().optional(),
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

/**
 * Success Response - For when synthesis completes
 */
export const SuccessResponseSchema = z.object({
  success: z.literal(true),
  data: z.any(), // Schema depends on endpoint
  requestId: z.string().optional(),
  metadata: z.object({
    processingTimeMs: z.number(),
    cache: z.boolean().optional(),
  }).optional(),
});

export type SuccessResponse = z.infer<typeof SuccessResponseSchema>;

/**
 * Build an error response
 */
export function buildErrorResponse(
  error: string,
  code: ErrorResponse['code'],
  details?: Record<string, any>,
  requestId?: string
): ErrorResponse {
  return {
    success: false,
    error,
    code,
    details,
    requestId,
  };
}

/**
 * Build a success response
 */
export function buildSuccessResponse(
  data: any,
  processingTimeMs: number,
  cache?: boolean,
  requestId?: string
): SuccessResponse {
  return {
    success: true,
    data,
    requestId,
    metadata: {
      processingTimeMs,
      cache,
    },
  };
}

/**
 * Validate response data against schema
 * Returns null if validation fails, otherwise returns data
 */
export function validateResponse<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): T | null {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Response validation failed:', error.errors);
    }
    return null;
  }
}

/**
 * Extract request identifier for rate limiting
 * Priority: API Key > User ID > IP Address
 */
export function getRequestIdentifier(
  request: Request | { headers: Headers }
): string {
  // Try to get from custom header (API key)
  const apiKey = request.headers.get('x-api-key');
  if (apiKey) return apiKey;

  // Try to get from user ID (if authenticated)
  const userId = request.headers.get('x-user-id');
  if (userId) return userId;

  // Fall back to IP address
  const ip = request.headers.get('x-forwarded-for') ||
    request.headers.get('cf-connecting-ip') ||
    'unknown';

  return ip;
}

/**
 * Generate a unique request ID for tracking
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Validate CSRF token from request
 * Checks both token and origin
 */
export function validateCsrfToken(
  request: Request | { headers: Headers },
  token: string | null
): boolean {
  // Check origin for same-origin requests
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');

  // Get allowed origins from env
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',');

  if (origin && !allowedOrigins.includes(origin)) {
    console.warn(`CSRF: Rejected origin ${origin}`);
    return false;
  }

  // For cross-origin requests, require token
  // This is a simplified check - real implementation may need more
  if (origin && origin !== new URL(referer || '').origin) {
    if (!token) {
      console.warn('CSRF: Missing token for cross-origin request');
      return false;
    }
    // TODO: Validate token against server-side store
  }

  return true;
}
