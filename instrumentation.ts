// =============================================================================
// NEXT.JS INSTRUMENTATION
// Runs once at server startup (before any requests are handled)
// Used for environment validation and other startup tasks
// =============================================================================

import { validateEnvOrThrow } from './lib/envValidation';

/**
 * Register function called once when Next.js server starts
 * Perfect for environment validation and startup checks
 */
export async function register() {
  // Only run on server side
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('🚀 Sensory Engine starting up...\n');

    // Validate environment variables (throws on error)
    validateEnvOrThrow();

    console.log('✅ Startup checks complete\n');
  }
}
