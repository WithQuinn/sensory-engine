/**
 * PostHog Analytics Client
 * Initializes PostHog for client-side event tracking.
 * Gracefully no-ops when NEXT_PUBLIC_POSTHOG_KEY is not configured.
 */
import posthog from 'posthog-js';

let initialized = false;

/**
 * Initialize PostHog client (call once on app load, client-side only)
 */
export function initPostHog(): void {
  if (typeof window === 'undefined') return;
  if (initialized) return;

  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

  if (!apiKey) {
    console.debug('[posthog] No NEXT_PUBLIC_POSTHOG_KEY — analytics disabled');
    return;
  }

  posthog.init(apiKey, {
    api_host: host,
    capture_pageview: false, // We track manually
    capture_pageleave: true,
    persistence: 'localStorage',
    autocapture: false, // Only track explicit events
  });

  initialized = true;
}

/**
 * Capture an event to PostHog (no-ops if not initialized)
 */
export function captureEvent(
  eventName: string,
  properties?: Record<string, any>
): void {
  if (typeof window === 'undefined') return;

  if (!initialized) {
    // Try lazy init
    initPostHog();
  }

  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!apiKey) return; // Silently skip if no key

  posthog.capture(eventName, properties);
}

/**
 * Identify a user (for session tracking)
 */
export function identifyUser(distinctId: string, properties?: Record<string, any>): void {
  if (typeof window === 'undefined') return;
  if (!initialized) return;

  posthog.identify(distinctId, properties);
}
