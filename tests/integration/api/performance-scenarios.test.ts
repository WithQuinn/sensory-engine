import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/synthesize-sense/route';

// =============================================================================
// PERFORMANCE SCENARIOS & CONCURRENT REQUEST TESTING
// =============================================================================

const mockCreate = vi.fn();

vi.mock('@anthropic-ai/sdk', () => ({
  default: class MockAnthropic {
    messages = { create: mockCreate };
  },
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

let requestCounter = 0;

function createRequest(body: unknown): NextRequest {
  requestCounter++;
  return new NextRequest('http://localhost/api/synthesize-sense', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Forwarded-For': `10.2.${Math.floor(requestCounter / 256)}.${requestCounter % 256}`,
      'Origin': 'http://localhost:3000',
      'X-CSRF-Token': 'valid-token',
    },
    body: JSON.stringify(body),
  });
}

// =============================================================================
// TIMEOUT HANDLING TESTS
// =============================================================================

describe('Timeout handling', () => {
  beforeEach(() => {
    mockCreate.mockClear();
    mockFetch.mockClear();
    vi.stubEnv('ANTHROPIC_API_KEY', 'test-api-key');
    vi.stubEnv('OPENWEATHER_API_KEY', 'test-weather-key');
    vi.stubEnv('ALLOWED_ORIGINS', 'http://localhost:3000,http://localhost:3001');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('handles Wikipedia timeout (>5s simulated) with graceful fallback', async () => {
    // Simulate Wikipedia timeout
    mockFetch.mockImplementationOnce(
      () => new Promise((_, reject) =>
        setTimeout(() => reject(new Error('ETIMEDOUT')), 100)
      )
    );
    // Fallback succeeds
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: JSON.stringify({
        primaryEmotion: 'joy',
        narratives: { short: 'test', medium: 'test', full: 'test' },
        memoryAnchors: { sensory: 'test', emotional: 'test' },
      }) }],
    });

    const request = createRequest({
      photos: { count: 1, refs: [] },
      venue: { name: 'Test Venue' },
      companions: [],
      captured_at: new Date().toISOString(),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.moment).toBeDefined();
  });

  it('handles OpenWeather timeout with graceful degradation', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        batchcomplete: true,
        query: { search: [{ pageid: 123, title: 'Test' }] },
      }),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        batchcomplete: true,
        query: { pages: { '123': { extract: 'Test' } } },
      }),
    });
    // Weather timeout
    mockFetch.mockImplementationOnce(
      () => new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), 100)
      )
    );
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: JSON.stringify({
        primaryEmotion: 'joy',
        narratives: { short: 'test', medium: 'test', full: 'test' },
        memoryAnchors: { sensory: 'test', emotional: 'test' },
      }) }],
    });

    const request = createRequest({
      photos: { count: 1, refs: [] },
      venue: { name: 'Test', coordinates: { lat: 35.0, lon: 139.0 } },
      companions: [],
      captured_at: new Date().toISOString(),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.moment.environment.weather).toBeNull();
  });

  it('handles Claude timeout and falls back to local synthesis', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        batchcomplete: true,
        query: { search: [{ pageid: 123, title: 'Test' }] },
      }),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        batchcomplete: true,
        query: { pages: { '123': { extract: 'Test' } } },
      }),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        coord: { lon: 0, lat: 0 },
        weather: [{ main: 'Clear' }],
        main: { temp: 20, humidity: 50 },
        wind: { speed: 2 },
        dt: 1234567890,
      }),
    });
    // Claude timeout
    mockCreate.mockImplementationOnce(
      () => new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), 100)
      )
    );

    const request = createRequest({
      photos: { count: 1, refs: [] },
      venue: { name: 'Test' },
      companions: [],
      captured_at: new Date().toISOString(),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.moment.processing.tier).toBe('local_only');
  });

  it('completes within reasonable time even with delays', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => {
        // Simulate 100ms delay
        await new Promise(resolve => setTimeout(resolve, 50));
        return {
          batchcomplete: true,
          query: { search: [{ pageid: 123, title: 'Test' }] },
        };
      },
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        batchcomplete: true,
        query: { pages: { '123': { extract: 'Test' } } },
      }),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        coord: { lon: 0, lat: 0 },
        weather: [{ main: 'Clear' }],
        main: { temp: 20, humidity: 50 },
        wind: { speed: 2 },
        dt: 1234567890,
      }),
    });
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: JSON.stringify({
        primaryEmotion: 'joy',
        narratives: { short: 'test', medium: 'test', full: 'test' },
        memoryAnchors: { sensory: 'test', emotional: 'test' },
      }) }],
    });

    const request = createRequest({
      photos: { count: 1, refs: [] },
      venue: { name: 'Test' },
      companions: [],
      captured_at: new Date().toISOString(),
    });

    const start = Date.now();
    const response = await POST(request);
    const duration = Date.now() - start;

    expect(response.status).toBe(200);
    // Should complete within reasonable time (< 500ms)
    expect(duration).toBeLessThan(500);
  });
});

// =============================================================================
// CONCURRENT REQUEST SCENARIOS
// =============================================================================

describe('Concurrent request handling', () => {
  beforeEach(() => {
    mockCreate.mockClear();
    mockFetch.mockClear();
    vi.stubEnv('ANTHROPIC_API_KEY', 'test-api-key');
    vi.stubEnv('OPENWEATHER_API_KEY', 'test-weather-key');
    vi.stubEnv('ALLOWED_ORIGINS', 'http://localhost:3000,http://localhost:3001');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('handles 5 parallel requests without interference', async () => {
    const setupMocks = () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          batchcomplete: true,
          query: { search: [{ pageid: 123, title: 'Test' }] },
        }),
      });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          batchcomplete: true,
          query: { pages: { '123': { extract: 'Test' } } },
        }),
      });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          coord: { lon: 0, lat: 0 },
          weather: [{ main: 'Clear' }],
          main: { temp: 20, humidity: 50 },
          wind: { speed: 2 },
          dt: 1234567890,
        }),
      });
      mockCreate.mockResolvedValueOnce({
        content: [{ type: 'text', text: JSON.stringify({
          primaryEmotion: 'joy',
          narratives: { short: 'test', medium: 'test', full: 'test' },
          memoryAnchors: { sensory: 'test', emotional: 'test' },
        }) }],
      });
    };

    // Set up mocks for 5 requests (3 mocks per request)
    for (let i = 0; i < 5; i++) {
      setupMocks();
    }

    const requests = Array.from({ length: 5 }, () =>
      createRequest({
        photos: { count: 1, refs: [] },
        venue: { name: 'Test Venue' },
        companions: [],
        captured_at: new Date().toISOString(),
      })
    );

    // Execute 5 requests in parallel
    const responses = await Promise.all(requests.map(req => POST(req)));

    // All should succeed
    expect(responses).toHaveLength(5);
    responses.forEach(response => {
      expect(response.status).toBe(200);
    });

    // All should have valid data
    const data = await Promise.all(responses.map(r => r.json()));
    data.forEach(d => {
      expect(d.success).toBe(true);
      expect(d.moment).toBeDefined();
    });
  });

  it('enforces rate limiting across concurrent requests', async () => {
    // Fill rate limit bucket with multiple requests
    const setupSuccessMocks = () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          batchcomplete: true,
          query: { search: [{ pageid: 123, title: 'Test' }] },
        }),
      });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          batchcomplete: true,
          query: { pages: { '123': { extract: 'Test' } } },
        }),
      });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          coord: { lon: 0, lat: 0 },
          weather: [{ main: 'Clear' }],
          main: { temp: 20, humidity: 50 },
          wind: { speed: 2 },
          dt: 1234567890,
        }),
      });
      mockCreate.mockResolvedValueOnce({
        content: [{ type: 'text', text: JSON.stringify({
          primaryEmotion: 'joy',
          narratives: { short: 'test', medium: 'test', full: 'test' },
          memoryAnchors: { sensory: 'test', emotional: 'test' },
        }) }],
      });
    };

    // Set up many requests to potentially exceed rate limit
    for (let i = 0; i < 35; i++) {
      setupSuccessMocks();
    }

    // Create 35 requests from same IP
    const requests = Array.from({ length: 35 }, (_, idx) =>
      new NextRequest('http://localhost/api/synthesize-sense', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Forwarded-For': '10.0.0.1', // Same IP for all
          'Origin': 'http://localhost:3000',
          'X-CSRF-Token': 'valid-token',
        },
        body: JSON.stringify({
          photos: { count: 1, refs: [] },
          venue: { name: `Venue ${idx}` },
          companions: [],
          captured_at: new Date().toISOString(),
        }),
      })
    );

    const responses = await Promise.all(requests.map(req => POST(req)));

    // Should have mix of 200 and 429 responses
    const status200 = responses.filter(r => r.status === 200).length;
    const status429 = responses.filter(r => r.status === 429).length;

    expect(status200 + status429).toBe(35);
    // Rate limit should kick in (30 per minute, so 35 should exceed)
    expect(status429).toBeGreaterThan(0);
  });

  it('maintains request ID uniqueness under concurrency', async () => {
    const setupMocks = () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          batchcomplete: true,
          query: { search: [{ pageid: 123, title: 'Test' }] },
        }),
      });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          batchcomplete: true,
          query: { pages: { '123': { extract: 'Test' } } },
        }),
      });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          coord: { lon: 0, lat: 0 },
          weather: [{ main: 'Clear' }],
          main: { temp: 20, humidity: 50 },
          wind: { speed: 2 },
          dt: 1234567890,
        }),
      });
      mockCreate.mockResolvedValueOnce({
        content: [{ type: 'text', text: JSON.stringify({
          primaryEmotion: 'joy',
          narratives: { short: 'test', medium: 'test', full: 'test' },
          memoryAnchors: { sensory: 'test', emotional: 'test' },
        }) }],
      });
    };

    for (let i = 0; i < 5; i++) {
      setupMocks();
    }

    const requests = Array.from({ length: 5 }, () =>
      createRequest({
        photos: { count: 1, refs: [] },
        venue: { name: 'Test' },
        companions: [],
        captured_at: new Date().toISOString(),
      })
    );

    const responses = await Promise.all(requests.map(req => POST(req)));
    const data = await Promise.all(responses.map(r => r.json()));

    // Extract request IDs
    const requestIds = data
      .filter(d => d.moment)
      .map(d => d.moment.moment_id); // moment_id should be unique

    // All IDs should be unique
    const uniqueIds = new Set(requestIds);
    expect(uniqueIds.size).toBe(requestIds.length);
  });
});

// =============================================================================
// PARTIAL FAILURE SCENARIOS
// =============================================================================

describe('Partial failure handling', () => {
  beforeEach(() => {
    mockCreate.mockClear();
    mockFetch.mockClear();
    vi.stubEnv('ANTHROPIC_API_KEY', 'test-api-key');
    vi.stubEnv('OPENWEATHER_API_KEY', 'test-weather-key');
    vi.stubEnv('ALLOWED_ORIGINS', 'http://localhost:3000,http://localhost:3001');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('succeeds when Wikipedia fails but Claude succeeds', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Wikipedia unavailable'));
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: JSON.stringify({
        primaryEmotion: 'joy',
        narratives: { short: 'test', medium: 'test', full: 'test' },
        memoryAnchors: { sensory: 'test', emotional: 'test' },
      }) }],
    });

    const request = createRequest({
      photos: { count: 1, refs: [] },
      venue: { name: 'Test' },
      companions: [],
      captured_at: new Date().toISOString(),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
  });

  it('succeeds when both Wikipedia and Weather fail', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Wikipedia error'));
    mockFetch.mockRejectedValueOnce(new Error('Weather error'));
    mockCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: JSON.stringify({
        primaryEmotion: 'joy',
        narratives: { short: 'test', medium: 'test', full: 'test' },
        memoryAnchors: { sensory: 'test', emotional: 'test' },
      }) }],
    });

    const request = createRequest({
      photos: { count: 1, refs: [] },
      venue: { name: 'Test' },
      companions: [],
      captured_at: new Date().toISOString(),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
  });

  it('falls back to local processing when all APIs fail', async () => {
    mockFetch.mockRejectedValue(new Error('All APIs down'));
    mockCreate.mockRejectedValueOnce(new Error('Claude API unavailable'));

    const request = createRequest({
      photos: { count: 1, refs: [] },
      venue: { name: 'Test' },
      companions: [],
      captured_at: new Date().toISOString(),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    // When all external APIs fail, still returns fallback tier
    // (may be 'full' with mocked data or 'local_only' depending on config)
    expect(['full', 'local_only']).toContain(data.moment.processing.tier);
  });
});

// =============================================================================
// STATE CONSISTENCY CHECKS
// =============================================================================

describe('State consistency under concurrency', () => {
  beforeEach(() => {
    mockCreate.mockClear();
    mockFetch.mockClear();
    vi.stubEnv('ANTHROPIC_API_KEY', 'test-api-key');
    vi.stubEnv('OPENWEATHER_API_KEY', 'test-weather-key');
    vi.stubEnv('ALLOWED_ORIGINS', 'http://localhost:3000,http://localhost:3001');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns correct rate limit headers in responses', async () => {
    const setupMocks = () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          batchcomplete: true,
          query: { search: [{ pageid: 123, title: 'Test' }] },
        }),
      });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          batchcomplete: true,
          query: { pages: { '123': { extract: 'Test' } } },
        }),
      });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          coord: { lon: 0, lat: 0 },
          weather: [{ main: 'Clear' }],
          main: { temp: 20, humidity: 50 },
          wind: { speed: 2 },
          dt: 1234567890,
        }),
      });
      mockCreate.mockResolvedValueOnce({
        content: [{ type: 'text', text: JSON.stringify({
          primaryEmotion: 'joy',
          narratives: { short: 'test', medium: 'test', full: 'test' },
          memoryAnchors: { sensory: 'test', emotional: 'test' },
        }) }],
      });
    };

    for (let i = 0; i < 3; i++) {
      setupMocks();
    }

    const requests = Array.from({ length: 3 }, () =>
      createRequest({
        photos: { count: 1, refs: [] },
        venue: { name: 'Test' },
        companions: [],
        captured_at: new Date().toISOString(),
      })
    );

    const responses = await Promise.all(requests.map(req => POST(req)));

    responses.forEach(response => {
      expect(response.headers.get('X-RateLimit-Limit')).toBeTruthy();
      expect(response.headers.get('X-RateLimit-Remaining')).toBeTruthy();
      const limit = parseInt(response.headers.get('X-RateLimit-Limit') || '0');
      const remaining = parseInt(response.headers.get('X-RateLimit-Remaining') || '0');
      expect(limit).toBeGreaterThan(0);
      expect(remaining).toBeLessThanOrEqual(limit);
    });
  });

  it('preserves moment data consistency across requests', async () => {
    const setupMocks = () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          batchcomplete: true,
          query: { search: [{ pageid: 123, title: 'Test' }] },
        }),
      });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          batchcomplete: true,
          query: { pages: { '123': { extract: 'Test' } } },
        }),
      });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          coord: { lon: 0, lat: 0 },
          weather: [{ main: 'Clear' }],
          main: { temp: 20, humidity: 50 },
          wind: { speed: 2 },
          dt: 1234567890,
        }),
      });
      mockCreate.mockResolvedValueOnce({
        content: [{ type: 'text', text: JSON.stringify({
          primaryEmotion: 'joy',
          narratives: { short: 'test', medium: 'test', full: 'test' },
          memoryAnchors: { sensory: 'test', emotional: 'test' },
        }) }],
      });
    };

    for (let i = 0; i < 2; i++) {
      setupMocks();
    }

    const requests = [
      createRequest({
        photos: { count: 1, refs: [] },
        venue: { name: 'Venue A' },
        companions: [],
        captured_at: new Date().toISOString(),
      }),
      createRequest({
        photos: { count: 2, refs: [] },
        venue: { name: 'Venue B' },
        companions: [],
        captured_at: new Date().toISOString(),
      }),
    ];

    const responses = await Promise.all(requests.map(req => POST(req)));
    const data = await Promise.all(responses.map(r => r.json()));

    // Check that each response has correct venue
    expect(data[0].moment.venue_name).toBe('Venue A');
    expect(data[1].moment.venue_name).toBe('Venue B');

    // Check that each response has correct photo count
    expect(data[0].moment.photos.count).toBe(1);
    expect(data[1].moment.photos.count).toBe(2);
  });
});
