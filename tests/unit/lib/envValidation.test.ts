import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { validateEnv, validateEnvOrThrow, getEnvSummary } from '@/lib/envValidation';

describe('envValidation', () => {
  // Store original env vars
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Clear environment variables before each test
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.OPENWEATHER_API_KEY;
    delete process.env.CLAUDE_MODEL;
    delete process.env.ALLOWED_ORIGINS;
    delete process.env.NODE_ENV;
    delete process.env.NEXT_PUBLIC_POSTHOG_KEY;
    delete process.env.NEXT_PUBLIC_POSTHOG_HOST;
  });

  afterEach(() => {
    // Restore original environment variables
    process.env = { ...originalEnv };
  });

  describe('validateEnv', () => {
    it('returns valid:true when all required vars are set', () => {
      process.env.ANTHROPIC_API_KEY = 'sk-ant-test123';
      process.env.OPENWEATHER_API_KEY = 'test-weather-key';

      const result = validateEnv();

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('returns error when ANTHROPIC_API_KEY is missing', () => {
      process.env.OPENWEATHER_API_KEY = 'test-weather-key';

      const result = validateEnv();

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('ANTHROPIC_API_KEY');
    });

    it('returns error when OPENWEATHER_API_KEY is missing', () => {
      process.env.ANTHROPIC_API_KEY = 'sk-ant-test123';

      const result = validateEnv();

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('OPENWEATHER_API_KEY');
    });

    it('returns multiple errors when multiple required vars are missing', () => {
      const result = validateEnv();

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBe(2); // ANTHROPIC_API_KEY + OPENWEATHER_API_KEY
    });

    it('returns error when required var is empty string', () => {
      process.env.ANTHROPIC_API_KEY = '';
      process.env.OPENWEATHER_API_KEY = 'test-weather-key';

      const result = validateEnv();

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      // Empty strings are treated as missing (which is correct behavior)
      expect(result.errors[0]).toContain('ANTHROPIC_API_KEY');
    });

    it('returns warning for invalid CLAUDE_MODEL value', () => {
      process.env.ANTHROPIC_API_KEY = 'sk-ant-test123';
      process.env.OPENWEATHER_API_KEY = 'test-weather-key';
      process.env.CLAUDE_MODEL = 'invalid-model';

      const result = validateEnv();

      expect(result.valid).toBe(true); // Still valid (optional var)
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('CLAUDE_MODEL');
    });

    it('accepts valid CLAUDE_MODEL values', () => {
      process.env.ANTHROPIC_API_KEY = 'sk-ant-test123';
      process.env.OPENWEATHER_API_KEY = 'test-weather-key';
      process.env.CLAUDE_MODEL = 'claude-sonnet-4-20250514';

      const result = validateEnv();

      expect(result.valid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    it('returns warning for invalid PostHog host URL', () => {
      process.env.ANTHROPIC_API_KEY = 'sk-ant-test123';
      process.env.OPENWEATHER_API_KEY = 'test-weather-key';
      process.env.NEXT_PUBLIC_POSTHOG_HOST = 'not-a-valid-url';

      const result = validateEnv();

      expect(result.valid).toBe(true); // Still valid (optional var)
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('NEXT_PUBLIC_POSTHOG_HOST');
    });

    it('returns warning for invalid ALLOWED_ORIGINS format', () => {
      process.env.ANTHROPIC_API_KEY = 'sk-ant-test123';
      process.env.OPENWEATHER_API_KEY = 'test-weather-key';
      process.env.ALLOWED_ORIGINS = 'not-a-url,also-not-a-url';

      const result = validateEnv();

      expect(result.valid).toBe(true); // Still valid (optional var)
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('ALLOWED_ORIGINS');
    });

    it('accepts valid ALLOWED_ORIGINS format', () => {
      process.env.ANTHROPIC_API_KEY = 'sk-ant-test123';
      process.env.OPENWEATHER_API_KEY = 'test-weather-key';
      process.env.ALLOWED_ORIGINS = 'http://localhost:3000,https://example.com';

      const result = validateEnv();

      expect(result.valid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });
  });

  describe('validateEnvOrThrow', () => {
    it('does not throw when all required vars are set', () => {
      process.env.ANTHROPIC_API_KEY = 'sk-ant-test123';
      process.env.OPENWEATHER_API_KEY = 'test-weather-key';

      expect(() => validateEnvOrThrow()).not.toThrow();
    });

    it('throws when required vars are missing', () => {
      expect(() => validateEnvOrThrow()).toThrow(/Environment validation failed/);
    });

    it('throws with helpful error message', () => {
      try {
        validateEnvOrThrow();
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('missing/invalid');
      }
    });
  });

  describe('getEnvSummary', () => {
    it('returns summary with masked sensitive values', () => {
      process.env.ANTHROPIC_API_KEY = 'sk-ant-test123';
      process.env.OPENWEATHER_API_KEY = 'test-weather-key';

      const summary = getEnvSummary();

      expect(summary.ANTHROPIC_API_KEY).toBe('***set***');
      expect(summary.OPENWEATHER_API_KEY).toBe('***set***');
    });

    it('shows defaults for unset optional variables', () => {
      const summary = getEnvSummary();

      expect(summary.CLAUDE_MODEL).toContain('default');
      expect(summary.NODE_ENV).toContain('default');
    });

    it('shows actual values for set optional variables', () => {
      process.env.CLAUDE_MODEL = 'claude-haiku-4-20241022';
      process.env.NODE_ENV = 'production';

      const summary = getEnvSummary();

      expect(summary.CLAUDE_MODEL).toBe('claude-haiku-4-20241022');
      expect(summary.NODE_ENV).toBe('production');
    });
  });
});
