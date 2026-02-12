import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/synthesize-sense/route';

// =============================================================================
// ERROR PATH TESTING - Comprehensive coverage for failure scenarios
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

function createRequest(body: unknown, origin: string = 'http://localhost:3000'): NextRequest {
  requestCounter++;
  return new NextRequest('http://localhost/api/synthesize-sense', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Forwarded-For': `10.2.${Math.floor(requestCounter / 256)}.${requestCounter % 256}`,
      'Origin': origin,
      'X-CSRF-Token': origin === 'http://localhost:3000' ? 'valid' : undefined,
    },
    body: JSON.stringify(body),
  });
}

// =============================================================================
// CSRF PROTECTION ERROR PATHS
// =============================================================================

describe('CSRF protection errors', () => {
  beforeEach(() => {
    mockCreate.mockClear();
    mockFetch.mockClear();
    vi.stubEnv('ANTHROPIC_API_KEY', 'test-api-key');
    vi.stubEnv('ALLOWED_ORIGINS', 'http://localhost:3000,http://localhost:3001,https://yourdomain.com');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('rejects request from untrusted origin without token', async () => {
    const request = new NextRequest('http://localhost/api/synthesize-sense', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://evil.com', // Untrusted origin
      },
      body: JSON.stringify({
        photos: { count: 1, refs: [] },
        venue: { name: 'Test' },
        companions: [],
        captured_at: new Date().toISOString(),
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.success).toBe(false);
    expect(data.error).toContain('CSRF');
  });

  it('rejects request from untrusted origin', async () => {
    const request = new NextRequest('http://localhost/api/synthesize-sense', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://evil.com',
        'X-CSRF-Token': 'some-token',
      },
      body: JSON.stringify({
        photos: { count: 1, refs: [] },
        venue: { name: 'Test' },
        companions: [],
        captured_at: new Date().toISOString(),
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.error).toContain('CSRF');
  });

  it('allows request from allowed origin', async () => {
    // This will fail at validation stage but pass CSRF check
    const request = new NextRequest('http://localhost/api/synthesize-sense', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:3000',
        'X-CSRF-Token': 'token',
      },
      body: JSON.stringify({
        photos: { count: 1, refs: [] },
        venue: { name: 'Test' },
        companions: [],
        captured_at: new Date().toISOString(),
      }),
    });

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
        query: {
          pages: {
            '123': {
              pageid: 123,
              title: 'Test',
              extract: 'Test',
              categories: [],
            },
          },
        },
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

    const response = await POST(request);
    expect(response.status).toBe(200);
  });
});

// =============================================================================
// WIKIPEDIA API ERROR PATHS
// =============================================================================

describe('Wikipedia API error paths', () => {
  beforeEach(() => {
    mockCreate.mockClear();
    mockFetch.mockClear();
    vi.stubEnv('ANTHROPIC_API_KEY', 'test-api-key');
    vi.stubEnv('OPENWEATHER_API_KEY', 'test-weather-key');
    vi.stubEnv('ALLOWED_ORIGINS', 'http://localhost:3000,http://localhost:3001,https://yourdomain.com');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('handles Wikipedia network error gracefully', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network timeout'));
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
    expect(data.moment).toBeDefined();
  });

  it('handles Wikipedia HTTP error (404) gracefully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      json: async () => ({ error: 'Not found' }),
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
      venue: { name: 'Unknown Venue XYZ' },
      companions: [],
      captured_at: new Date().toISOString(),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
  });

  it('handles Wikipedia malformed JSON response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => {
        throw new Error('Invalid JSON');
      },
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

    const response = await POST(request);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
  });

  it('handles Wikipedia response missing query field', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
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

    const response = await POST(request);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
  });
});

// =============================================================================
// OPENWEATHER API ERROR PATHS
// =============================================================================

describe('OpenWeather API error paths', () => {
  beforeEach(() => {
    mockCreate.mockClear();
    mockFetch.mockClear();
    vi.stubEnv('ANTHROPIC_API_KEY', 'test-api-key');
    vi.stubEnv('OPENWEATHER_API_KEY', 'test-weather-key');
    vi.stubEnv('ALLOWED_ORIGINS', 'http://localhost:3000,http://localhost:3001,https://yourdomain.com');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('handles OpenWeather network error gracefully', async () => {
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
    mockFetch.mockRejectedValueOnce(new Error('Weather API timeout'));
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

  it('handles OpenWeather HTTP 401 (invalid API key)', async () => {
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
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
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

  it('handles OpenWeather malformed response', async () => {
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
      json: async () => ({ temp: 20 }), // Missing required fields
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

  it('handles OpenWeather 5XX server error', async () => {
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
      ok: false,
      status: 503,
      statusText: 'Service Unavailable',
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
      venue: { name: 'Test', coordinates: { lat: 35.0, lon: 139.0 } },
      companions: [],
      captured_at: new Date().toISOString(),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
  });
});

// =============================================================================
// CLAUDE API ERROR PATHS
// =============================================================================

describe('Claude API error paths', () => {
  beforeEach(() => {
    mockCreate.mockClear();
    mockFetch.mockClear();
    vi.stubEnv('ANTHROPIC_API_KEY', 'test-api-key');
    vi.stubEnv('OPENWEATHER_API_KEY', 'test-weather-key');
    vi.stubEnv('ALLOWED_ORIGINS', 'http://localhost:3000,http://localhost:3001,https://yourdomain.com');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('handles Claude API rate limit error (429)', async () => {
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
    const error = new Error('Rate limit exceeded');
    (error as any).status = 429;
    mockCreate.mockRejectedValueOnce(error);

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

  it('handles Claude API authentication error', async () => {
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
    const error = new Error('Invalid API key');
    (error as any).status = 401;
    mockCreate.mockRejectedValueOnce(error);

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

  it('handles Claude API timeout', async () => {
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
    mockCreate.mockRejectedValueOnce(new Error('Request timeout'));

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
});

// =============================================================================
// INPUT VALIDATION ERROR PATHS
// =============================================================================

describe('Input validation error paths', () => {
  beforeEach(() => {
    mockCreate.mockClear();
    mockFetch.mockClear();
    vi.stubEnv('ANTHROPIC_API_KEY', 'test-api-key');
    vi.stubEnv('ALLOWED_ORIGINS', 'http://localhost:3000,http://localhost:3001,https://yourdomain.com');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns 400 for invalid coordinates (lat > 90)', async () => {
    const request = createRequest({
      photos: { count: 1, refs: [] },
      venue: { name: 'Test', coordinates: { lat: 91, lon: 0 } },
      companions: [],
      captured_at: new Date().toISOString(),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.success).toBe(false);
  });

  it('returns 400 for invalid coordinates (lon > 180)', async () => {
    const request = createRequest({
      photos: { count: 1, refs: [] },
      venue: { name: 'Test', coordinates: { lat: 0, lon: 181 } },
      companions: [],
      captured_at: new Date().toISOString(),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.success).toBe(false);
  });

  it('returns 400 for negative audio duration', async () => {
    const request = createRequest({
      photos: { count: 1, refs: [] },
      audio: {
        duration_seconds: -5,
        recorded_at: new Date().toISOString(),
        transcript: null,
        sentiment_score: 0.5,
      },
      venue: { name: 'Test' },
      companions: [],
      captured_at: new Date().toISOString(),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.success).toBe(false);
  });

  it('returns 400 for sentiment score above 1.0', async () => {
    const request = createRequest({
      photos: { count: 1, refs: [] },
      audio: {
        duration_seconds: 10,
        recorded_at: new Date().toISOString(),
        transcript: null,
        sentiment_score: 1.5,
      },
      venue: { name: 'Test' },
      companions: [],
      captured_at: new Date().toISOString(),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.success).toBe(false);
  });

  it('returns 400 for sentiment score below -1.0', async () => {
    const request = createRequest({
      photos: { count: 1, refs: [] },
      audio: {
        duration_seconds: 10,
        recorded_at: new Date().toISOString(),
        transcript: null,
        sentiment_score: -1.5,
      },
      venue: { name: 'Test' },
      companions: [],
      captured_at: new Date().toISOString(),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.success).toBe(false);
  });
});
