// =============================================================================
// ENVIRONMENT VARIABLE VALIDATION
// Validates required environment variables at startup
// Fails fast with clear error messages to catch config issues early
// =============================================================================

/**
 * Environment variable validation result
 */
export interface EnvValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Required environment variables that must be set
 */
const REQUIRED_ENV_VARS = {
  ANTHROPIC_API_KEY: {
    description: 'Claude API key for synthesis generation',
    format: 'sk-ant-...',
    example: 'sk-ant-api03-xxxxxxxxxxxxxxxxxxxx',
  },
  OPENWEATHER_API_KEY: {
    description: 'OpenWeather API key for weather data',
    format: 'alphanumeric string',
    example: 'your_openweather_api_key_here',
  },
} as const;

/**
 * Optional environment variables with defaults
 */
const OPTIONAL_ENV_VARS = {
  CLAUDE_MODEL: {
    description: 'Claude model to use for synthesis',
    default: 'claude-sonnet-4-20250514',
    validValues: [
      'claude-sonnet-4-20250514',
      'claude-opus-4-20250514',
      'claude-haiku-4-20241022',
    ],
  },
  ALLOWED_ORIGINS: {
    description: 'Comma-separated list of allowed CSRF origins',
    default: 'http://localhost:3000',
    format: 'comma-separated URLs',
  },
  NEXT_PUBLIC_POSTHOG_KEY: {
    description: 'PostHog analytics key (optional)',
    default: undefined,
    format: 'phc_...',
  },
  NEXT_PUBLIC_POSTHOG_HOST: {
    description: 'PostHog host URL (optional)',
    default: 'https://us.i.posthog.com',
    format: 'URL',
  },
  RATE_LIMIT_BYPASS_TOKEN: {
    description: 'Token to bypass rate limiting (testing only)',
    default: undefined,
    format: 'any string',
  },
  CSRF_SECRET: {
    description: 'Secret for CSRF token generation (optional)',
    default: undefined,
    format: 'secure random string',
  },
  NODE_ENV: {
    description: 'Node environment',
    default: 'development',
    validValues: ['development', 'production', 'test'],
  },
} as const;

/**
 * Validate all environment variables
 * Returns validation result with errors and warnings
 */
export function validateEnv(): EnvValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required variables
  for (const [key, config] of Object.entries(REQUIRED_ENV_VARS)) {
    const value = process.env[key];

    if (!value) {
      errors.push(
        `❌ Missing required environment variable: ${key}\n` +
        `   Description: ${config.description}\n` +
        `   Format: ${config.format}\n` +
        `   Example: ${config.example}\n` +
        `   Set in: .env.local or Vercel environment variables`
      );
    } else if (value.trim() === '') {
      errors.push(
        `❌ Empty required environment variable: ${key}\n` +
        `   Value cannot be an empty string`
      );
    }
  }

  // Check optional variables for validity
  for (const [key, config] of Object.entries(OPTIONAL_ENV_VARS)) {
    const value = process.env[key];

    // Skip if not set (that's fine for optional vars)
    if (!value) continue;

    // Validate against allowed values if specified
    if ('validValues' in config && config.validValues) {
      if (!config.validValues.includes(value as any)) {
        warnings.push(
          `⚠️  Invalid value for ${key}: "${value}"\n` +
          `   Valid values: ${config.validValues.join(', ')}\n` +
          `   Will use default: ${config.default || 'none'}`
        );
      }
    }

    // Validate URL format for PostHog host
    if (key === 'NEXT_PUBLIC_POSTHOG_HOST') {
      try {
        new URL(value);
      } catch {
        warnings.push(
          `⚠️  Invalid URL for ${key}: "${value}"\n` +
          `   Must be a valid URL (e.g., https://us.i.posthog.com)`
        );
      }
    }

    // Validate ALLOWED_ORIGINS format
    if (key === 'ALLOWED_ORIGINS') {
      const origins = value.split(',');
      for (const origin of origins) {
        try {
          new URL(origin.trim());
        } catch {
          warnings.push(
            `⚠️  Invalid origin in ALLOWED_ORIGINS: "${origin}"\n` +
            `   Each origin must be a valid URL`
          );
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate environment variables and throw if invalid
 * Call this at app startup to fail fast on config errors
 */
export function validateEnvOrThrow(): void {
  const result = validateEnv();

  // Print warnings (non-blocking)
  if (result.warnings.length > 0) {
    console.warn('\n⚠️  ENVIRONMENT VARIABLE WARNINGS:\n');
    result.warnings.forEach((warning) => {
      console.warn(warning);
      console.warn(''); // Empty line for readability
    });
  }

  // Throw on errors (blocking)
  if (!result.valid) {
    console.error('\n❌ ENVIRONMENT VARIABLE VALIDATION FAILED:\n');
    result.errors.forEach((error) => {
      console.error(error);
      console.error(''); // Empty line for readability
    });
    console.error('📚 See .env.example for reference configuration\n');

    throw new Error(
      `Environment validation failed: ${result.errors.length} missing/invalid required variable(s)`
    );
  }

  // Success message
  console.log('✅ Environment variables validated successfully');
}

/**
 * Get a summary of current environment configuration
 * Useful for debugging and deployment verification
 */
export function getEnvSummary(): Record<string, string | undefined> {
  return {
    // Required (show if set)
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ? '***set***' : undefined,
    OPENWEATHER_API_KEY: process.env.OPENWEATHER_API_KEY ? '***set***' : undefined,

    // Optional (show actual values for debugging)
    CLAUDE_MODEL: process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514 (default)',
    ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS || 'localhost:3000 (default)',
    NODE_ENV: process.env.NODE_ENV || 'development (default)',
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY ? '***set***' : 'not set',
    RATE_LIMIT_BYPASS_TOKEN: process.env.RATE_LIMIT_BYPASS_TOKEN ? '***set***' : 'not set',
  };
}
