import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/synthesize-sense/route';

// =============================================================================
// MOCK SETUP
// =============================================================================

const mockCreate = vi.fn();

vi.mock('@anthropic-ai/sdk', () => ({
  default: class MockAnthropic {
    messages = { create: mockCreate };
  },
}));

// Mock fetch for Wikipedia and OpenWeather
const mockFetch = vi.fn();
global.fetch = mockFetch;

function setClaudeResponse(response: object) {
  mockCreate.mockResolvedValueOnce({
    content: [{ type: 'text', text: JSON.stringify(response) }],
  });
}

function setClaudeError(error: Error) {
  mockCreate.mockRejectedValueOnce(error);
}

// Mock Wikipedia search response
function setWikipediaSearchResponse(title: string) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({
      query: {
        search: [{ pageid: 123, title }],
      },
    }),
  });
}

// Mock Wikipedia page response
function setWikipediaPageResponse(data: {
  title: string;
  extract: string;
  description?: string;
  categories?: string[];
}) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({
      query: {
        pages: {
          '123': {
            pageid: 123,
            title: data.title,
            extract: data.extract,
            description: data.description || null,
            categories: (data.categories || []).map(c => ({ title: `Category:${c}` })),
            fullurl: `https://en.wikipedia.org/wiki/${encodeURIComponent(data.title)}`,
          },
        },
      },
    }),
  });
}

// Mock OpenWeather response
function setWeatherResponse(data: {
  condition: string;
  temp: number;
  humidity: number;
  windSpeed?: number;
}) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({
      weather: [{ main: data.condition, description: data.condition.toLowerCase() }],
      main: {
        temp: data.temp,
        humidity: data.humidity,
        feels_like: data.temp,
      },
      wind: { speed: data.windSpeed || 2 },
    }),
  });
}

// Counter to generate unique IPs per request to avoid rate limiting
let requestCounter = 0;

function createRequest(body: unknown): NextRequest {
  requestCounter++;
  return new NextRequest('http://localhost/api/synthesize-sense', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Forwarded-For': `10.2.${Math.floor(requestCounter / 256)}.${requestCounter % 256}`,
      'X-Session-ID': `test-session-${requestCounter}`,
    },
    body: JSON.stringify(body),
  });
}

// Valid synthesis response from Claude
const validClaudeResponse = {
  primaryEmotion: 'awe',
  secondaryEmotions: ['peace', 'joy'],
  emotionConfidence: 0.85,
  narratives: {
    short: 'A peaceful morning at the ancient temple.',
    medium: 'Walking through the temple grounds, the morning light filtered through ancient trees.',
    full: 'The temple visit was a moment of profound peace. As we walked through the grounds, centuries of history seemed to whisper from every stone.',
  },
  excitementHook: 'Tokyo\'s oldest temple, founded in 628 CE',
  memoryAnchors: {
    sensory: 'Incense smoke curling through golden morning light',
    emotional: 'The shared silence with family',
    unexpected: null,
    shareable: 'The iconic red gate photograph',
    companion: null,
  },
  companionExperiences: [],
  inferredSensory: {
    scent: 'Incense and morning dew',
    tactile: 'Smooth wooden prayer beads',
    sound: 'Distant temple bells',
  },
};

// =============================================================================
// INTEGRATION TESTS
// =============================================================================

describe('POST /api/synthesize-sense', () => {
  beforeEach(() => {
    vi.stubEnv('ANTHROPIC_API_KEY', 'test-api-key');
    vi.stubEnv('OPENWEATHER_API_KEY', 'test-weather-key');
    mockCreate.mockClear();
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  // ===========================================================================
  // SUCCESSFUL REQUESTS
  // ===========================================================================

  describe('successful requests', () => {
    it('returns 200 with synthesized moment for valid input', async () => {
      // Setup mocks: Wikipedia search, Wikipedia page, Weather, Claude
      setWikipediaSearchResponse('Senso-ji');
      setWikipediaPageResponse({
        title: 'Senso-ji',
        extract: 'Senso-ji is an ancient Buddhist temple located in Asakusa, Tokyo. Founded in 628 CE, it is Tokyo\'s oldest temple.',
        description: 'Buddhist temple in Tokyo',
        categories: ['Buddhist temples in Tokyo', 'Historic sites'],
      });
      setWeatherResponse({ condition: 'Clear', temp: 21, humidity: 45 });
      setClaudeResponse(validClaudeResponse);

      const request = createRequest({
        photos: { count: 5, refs: [] },
        audio: {
          duration_seconds: 15,
          recorded_at: new Date().toISOString(),
          transcript: null,
          sentiment_score: 0.85,
          sentiment_keywords: ['peaceful', 'beautiful'],
        },
        venue: {
          name: 'Senso-ji Temple',
          coordinates: { lat: 35.7148, lon: 139.7967 },
        },
        companions: [],
        captured_at: new Date().toISOString(),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.moment).toBeDefined();
      expect(data.moment.venue_name).toBe('Senso-ji Temple');
      expect(data.moment.primary_emotion).toBe('awe');
      expect(data.moment.narratives.short).toBeTruthy();
    });

    it('returns moment with transcendence score', async () => {
      setWikipediaSearchResponse('Eiffel Tower');
      setWikipediaPageResponse({
        title: 'Eiffel Tower',
        extract: 'The Eiffel Tower is a wrought-iron lattice tower on the Champ de Mars in Paris. Built in 1889.',
        categories: ['Landmarks in Paris', 'World Heritage Sites'],
      });
      setWeatherResponse({ condition: 'Clear', temp: 22, humidity: 40 });
      setClaudeResponse(validClaudeResponse);

      const request = createRequest({
        photos: { count: 10, refs: [] },
        venue: { name: 'Eiffel Tower', coordinates: { lat: 48.8584, lon: 2.2945 } },
        companions: [],
        captured_at: new Date().toISOString(),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.moment.transcendence_score).toBeGreaterThanOrEqual(0);
      expect(data.moment.transcendence_score).toBeLessThanOrEqual(1);
      expect(data.moment.transcendence_factors).toBeInstanceOf(Array);
    });

    it('includes processing metadata in response', async () => {
      setWikipediaSearchResponse('Test Venue');
      setWikipediaPageResponse({
        title: 'Test Venue',
        extract: 'A test venue for integration testing.',
      });
      setWeatherResponse({ condition: 'Clouds', temp: 18, humidity: 60 });
      setClaudeResponse(validClaudeResponse);

      const request = createRequest({
        photos: { count: 3, refs: [] },
        venue: { name: 'Test Venue', coordinates: { lat: 35.0, lon: 139.0 } },
        companions: [],
        captured_at: new Date().toISOString(),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.moment.processing).toBeDefined();
      expect(data.moment.processing.tier).toBe('full');
      // cloud_calls includes services that were called (wikipedia or mock_venue, openweather, claude_text)
      expect(data.moment.processing.cloud_calls.length).toBeGreaterThan(0);
      expect(data.moment.processing.cloud_calls).toContain('claude_text');
      expect(data.moment.processing.processing_time_ms).toBeGreaterThanOrEqual(0);
    });

    it('handles request without audio', async () => {
      setWikipediaSearchResponse('Grand Canyon');
      setWikipediaPageResponse({
        title: 'Grand Canyon',
        extract: 'The Grand Canyon is a steep-sided canyon carved by the Colorado River.',
        categories: ['Natural wonders'],
      });
      setWeatherResponse({ condition: 'Clear', temp: 25, humidity: 30 });
      setClaudeResponse(validClaudeResponse);

      const request = createRequest({
        photos: { count: 8, refs: [] },
        audio: null,
        venue: { name: 'Grand Canyon', coordinates: { lat: 36.0544, lon: -112.1401 } },
        companions: [],
        captured_at: new Date().toISOString(),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.moment.user_reflection.voice_note_transcript).toBeNull();
    });

    it('handles request with companions', async () => {
      setWikipediaSearchResponse('Tokyo Disneyland');
      setWikipediaPageResponse({
        title: 'Tokyo Disneyland',
        extract: 'Tokyo Disneyland is a theme park in Urayasu, Chiba, Japan.',
        categories: ['Amusement parks'],
      });
      setWeatherResponse({ condition: 'Clear', temp: 20, humidity: 50 });
      setClaudeResponse({
        ...validClaudeResponse,
        companionExperiences: [
          { nickname: 'Max', reaction: 'Loved the rides', wouldReturn: true },
        ],
      });

      const request = createRequest({
        photos: { count: 15, refs: [] },
        venue: { name: 'Tokyo Disneyland' },
        companions: [
          { name: 'Max', relationship: 'family', age_group: 'child' },
        ],
        captured_at: new Date().toISOString(),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.moment.companion_experiences).toHaveLength(1);
      expect(data.moment.companion_experiences[0].name).toBe('Max');
    });

    it('includes rate limit headers', async () => {
      setWikipediaSearchResponse('Test');
      setWikipediaPageResponse({ title: 'Test', extract: 'Test' });
      setWeatherResponse({ condition: 'Clear', temp: 20, humidity: 50 });
      setClaudeResponse(validClaudeResponse);

      const request = createRequest({
        photos: { count: 1, refs: [] },
        venue: { name: 'Test' },
        companions: [],
        captured_at: new Date().toISOString(),
      });

      const response = await POST(request);

      expect(response.headers.get('X-RateLimit-Limit')).toBeTruthy();
      expect(response.headers.get('X-RateLimit-Remaining')).toBeTruthy();
    });
  });

  // ===========================================================================
  // VALIDATION ERRORS
  // ===========================================================================

  describe('validation errors', () => {
    it('returns 400 for invalid JSON', async () => {
      const request = new NextRequest('http://localhost/api/synthesize-sense', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Forwarded-For': '10.3.0.1',
        },
        body: 'not valid json',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Invalid JSON');
    });

    it('returns 400 for missing photos', async () => {
      const request = createRequest({
        venue: { name: 'Test' },
        companions: [],
        captured_at: new Date().toISOString(),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('returns 400 for zero photo count', async () => {
      const request = createRequest({
        photos: { count: 0, refs: [] },
        venue: { name: 'Test' },
        companions: [],
        captured_at: new Date().toISOString(),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('returns 400 for missing captured_at', async () => {
      const request = createRequest({
        photos: { count: 1, refs: [] },
        venue: { name: 'Test' },
        companions: [],
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('returns 400 for invalid datetime format', async () => {
      const request = createRequest({
        photos: { count: 1, refs: [] },
        venue: { name: 'Test' },
        companions: [],
        captured_at: 'not-a-valid-datetime',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('returns 400 for empty venue name', async () => {
      const request = createRequest({
        photos: { count: 1, refs: [] },
        venue: { name: '' },
        companions: [],
        captured_at: new Date().toISOString(),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('returns 400 for invalid audio duration (over 300s)', async () => {
      const request = createRequest({
        photos: { count: 1, refs: [] },
        audio: {
          duration_seconds: 400,
          recorded_at: new Date().toISOString(),
          transcript: null,
          sentiment_score: 0.5,
        },
        venue: { name: 'Test' },
        companions: [],
        captured_at: new Date().toISOString(),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('returns 400 for invalid sentiment score (out of range)', async () => {
      const request = createRequest({
        photos: { count: 1, refs: [] },
        audio: {
          duration_seconds: 10,
          recorded_at: new Date().toISOString(),
          transcript: null,
          sentiment_score: 2.0, // Invalid: should be -1 to 1
        },
        venue: { name: 'Test' },
        companions: [],
        captured_at: new Date().toISOString(),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });
  });

  // ===========================================================================
  // GRACEFUL DEGRADATION
  // ===========================================================================

  describe('graceful degradation', () => {
    it('falls back to local processing when Claude fails', async () => {
      setWikipediaSearchResponse('Test Venue');
      setWikipediaPageResponse({
        title: 'Test Venue',
        extract: 'A wonderful test venue.',
      });
      setWeatherResponse({ condition: 'Clear', temp: 20, humidity: 50 });
      setClaudeError(new Error('API rate limit exceeded'));

      const request = createRequest({
        photos: { count: 5, refs: [] },
        venue: { name: 'Test Venue', coordinates: { lat: 35.0, lon: 139.0 } },
        companions: [],
        captured_at: new Date().toISOString(),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.moment.processing.tier).toBe('local_only');
      expect(data.moment.narratives).toBeDefined();
    });

    it('works without weather API key', async () => {
      vi.stubEnv('OPENWEATHER_API_KEY', '');

      setWikipediaSearchResponse('Test');
      setWikipediaPageResponse({ title: 'Test', extract: 'Test venue' });
      setClaudeResponse(validClaudeResponse);

      const request = createRequest({
        photos: { count: 3, refs: [] },
        venue: { name: 'Test', coordinates: { lat: 35.0, lon: 139.0 } },
        companions: [],
        captured_at: new Date().toISOString(),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.moment.environment.weather).toBeNull();
    });

    it('works when Wikipedia returns no results', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ query: { search: [] } }),
      });
      // Second call for fallback search
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ query: { search: [] } }),
      });
      setWeatherResponse({ condition: 'Clear', temp: 20, humidity: 50 });
      setClaudeResponse(validClaudeResponse);

      const request = createRequest({
        photos: { count: 3, refs: [] },
        venue: { name: 'Some Unknown Local Cafe XYZ123', coordinates: { lat: 35.0, lon: 139.0 } },
        companions: [],
        captured_at: new Date().toISOString(),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      // Should still work with mock/fallback venue data
    });

    it('works without venue coordinates (no weather fetch)', async () => {
      setWikipediaSearchResponse('Local Cafe');
      setWikipediaPageResponse({ title: 'Local Cafe', extract: 'A cozy cafe' });
      setClaudeResponse(validClaudeResponse);

      const request = createRequest({
        photos: { count: 2, refs: [] },
        venue: { name: 'Local Cafe' }, // No coordinates
        companions: [],
        captured_at: new Date().toISOString(),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.moment.environment.weather).toBeNull();
    });
  });

  // ===========================================================================
  // PRIVACY
  // ===========================================================================

  describe('privacy', () => {
    it('never includes transcript in response (always null)', async () => {
      setWikipediaSearchResponse('Test');
      setWikipediaPageResponse({ title: 'Test', extract: 'Test' });
      setWeatherResponse({ condition: 'Clear', temp: 20, humidity: 50 });
      setClaudeResponse(validClaudeResponse);

      const request = createRequest({
        photos: { count: 1, refs: [] },
        audio: {
          duration_seconds: 10,
          recorded_at: new Date().toISOString(),
          transcript: 'This should not appear in response',
          sentiment_score: 0.8,
          sentiment_keywords: ['test'],
        },
        venue: { name: 'Test', coordinates: { lat: 35.0, lon: 139.0 } },
        companions: [],
        captured_at: new Date().toISOString(),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.moment.user_reflection.voice_note_transcript).toBeNull();
    });

    it('uses coarse coordinates for weather (privacy)', async () => {
      setWikipediaSearchResponse('Test');
      setWikipediaPageResponse({ title: 'Test', extract: 'Test' });
      setWeatherResponse({ condition: 'Clear', temp: 20, humidity: 50 });
      setClaudeResponse(validClaudeResponse);

      const preciseCoords = { lat: 35.7148, lon: 139.7967 };

      const request = createRequest({
        photos: { count: 1, refs: [] },
        venue: { name: 'Test', coordinates: preciseCoords },
        companions: [],
        captured_at: new Date().toISOString(),
      });

      await POST(request);

      // Check that fetch was called with coarsened coordinates
      const weatherCall = mockFetch.mock.calls.find(
        call => call[0]?.toString().includes('openweathermap')
      );
      expect(weatherCall).toBeDefined();
      const url = new URL(weatherCall![0] as string);
      // Coarsened: 35.7148 → 35.7, 139.7967 → 139.8
      expect(url.searchParams.get('lat')).toBe('35.7');
      expect(url.searchParams.get('lon')).toBe('139.8');
    });
  });

  // ===========================================================================
  // CLAUDE RESPONSE HANDLING
  // ===========================================================================

  describe('Claude response handling', () => {
    it('falls back gracefully when Claude returns malformed JSON', async () => {
      setWikipediaSearchResponse('Test');
      setWikipediaPageResponse({ title: 'Test', extract: 'Test' });
      setWeatherResponse({ condition: 'Clear', temp: 20, humidity: 50 });
      mockCreate.mockResolvedValueOnce({
        content: [{ type: 'text', text: 'This is not valid JSON response {broken' }],
      });

      const request = createRequest({
        photos: { count: 1, refs: [] },
        venue: { name: 'Test', coordinates: { lat: 35.0, lon: 139.0 } },
        companions: [],
        captured_at: new Date().toISOString(),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.moment.processing.tier).toBe('local_only');
    });

    it('falls back gracefully when Claude returns missing required fields', async () => {
      setWikipediaSearchResponse('Test');
      setWikipediaPageResponse({ title: 'Test', extract: 'Test' });
      setWeatherResponse({ condition: 'Clear', temp: 20, humidity: 50 });
      mockCreate.mockResolvedValueOnce({
        content: [{ type: 'text', text: JSON.stringify({ primaryEmotion: 'joy' }) }], // Missing required fields
      });

      const request = createRequest({
        photos: { count: 1, refs: [] },
        venue: { name: 'Test', coordinates: { lat: 35.0, lon: 139.0 } },
        companions: [],
        captured_at: new Date().toISOString(),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.moment.processing.tier).toBe('local_only');
    });

    it('handles API key not configured gracefully', async () => {
      vi.stubEnv('ANTHROPIC_API_KEY', '');
      setWikipediaSearchResponse('Test');
      setWikipediaPageResponse({ title: 'Test', extract: 'Test' });
      setWeatherResponse({ condition: 'Clear', temp: 20, humidity: 50 });

      const request = createRequest({
        photos: { count: 1, refs: [] },
        venue: { name: 'Test', coordinates: { lat: 35.0, lon: 139.0 } },
        companions: [],
        captured_at: new Date().toISOString(),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.moment.processing.tier).toBe('local_only');
      expect(data.moment.processing.cloud_calls).not.toContain('claude_text');
    });
  });

  // ===========================================================================
  // PHOTO AND AUDIO DATA
  // ===========================================================================

  describe('photo and audio data', () => {
    it('handles photo refs with local_analysis data', async () => {
      setWikipediaSearchResponse('Temple');
      setWikipediaPageResponse({ title: 'Temple', extract: 'A beautiful temple' });
      setWeatherResponse({ condition: 'Clear', temp: 20, humidity: 50 });
      setClaudeResponse(validClaudeResponse);

      const request = createRequest({
        photos: {
          count: 2, // Match actual refs length
          refs: [
            {
              local_id: 'photo-1',
              captured_at: new Date().toISOString(),
              location_extracted: true,
              local_analysis: {
                scene_type: 'temple',
                lighting: 'golden_hour', // Valid LightingEnum
                indoor_outdoor: 'outdoor',
                face_count: 2,
                crowd_level: 'sparse', // Valid CrowdFeelEnum
                energy_level: 'calm', // Valid EnergyEnum
                basic_emotion: 'joy',
              },
            },
            {
              local_id: 'photo-2',
              captured_at: new Date().toISOString(),
              location_extracted: false,
              local_analysis: {
                scene_type: 'landscape',
                lighting: 'bright', // Valid LightingEnum
                indoor_outdoor: 'outdoor',
                face_count: 0,
                crowd_level: 'empty', // Valid CrowdFeelEnum
                energy_level: 'tranquil', // Valid EnergyEnum (not 'serene')
                basic_emotion: null,
              },
            },
          ],
        },
        venue: { name: 'Temple', coordinates: { lat: 35.0, lon: 139.0 } },
        companions: [],
        captured_at: new Date().toISOString(),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.moment.photos.count).toBe(2);
    });

    it('handles audio with negative sentiment', async () => {
      setWikipediaSearchResponse('Test');
      setWikipediaPageResponse({ title: 'Test', extract: 'Test' });
      setWeatherResponse({ condition: 'Rain', temp: 15, humidity: 80 });
      setClaudeResponse({
        ...validClaudeResponse,
        primaryEmotion: 'melancholy',
        secondaryEmotions: ['reflective'],
      });

      const request = createRequest({
        photos: { count: 2, refs: [] },
        audio: {
          duration_seconds: 30,
          recorded_at: new Date().toISOString(),
          transcript: null,
          sentiment_score: -0.5,
          sentiment_keywords: ['disappointed', 'crowded', 'tired'],
        },
        venue: { name: 'Test', coordinates: { lat: 35.0, lon: 139.0 } },
        companions: [],
        captured_at: new Date().toISOString(),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.moment.user_reflection.sentiment).toBe(-0.5);
      expect(data.moment.user_reflection.keywords).toContain('disappointed');
    });
  });

  // ===========================================================================
  // COMPANIONS
  // ===========================================================================

  describe('companion handling', () => {
    it('preserves companion relationship from input', async () => {
      // This test validates that when Claude returns companion experiences,
      // the relationship is correctly looked up from the original input
      setWikipediaSearchResponse('Theme Park');
      setWikipediaPageResponse({ title: 'Theme Park', extract: 'A fun place' });
      setWeatherResponse({ condition: 'Clear', temp: 22, humidity: 45 });
      setClaudeResponse({
        ...validClaudeResponse,
        companionExperiences: [
          { nickname: 'Emma', reaction: 'Loved it', wouldReturn: true },
        ],
      });

      const request = createRequest({
        photos: { count: 10, refs: [] },
        venue: { name: 'Theme Park' },
        companions: [
          { name: 'Emma', relationship: 'family', age_group: 'child' },
        ],
        captured_at: new Date().toISOString(),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.moment.companion_experiences).toHaveLength(1);
      expect(data.moment.companion_experiences[0].name).toBe('Emma');
      expect(data.moment.companion_experiences[0].relationship).toBe('family');
    });

    it('defaults to "other" for unknown companion', async () => {
      // When Claude returns a companion experience for someone not in our input,
      // we should default to 'other' relationship
      setWikipediaSearchResponse('Test');
      setWikipediaPageResponse({ title: 'Test', extract: 'Test' });
      setWeatherResponse({ condition: 'Clear', temp: 20, humidity: 50 });
      setClaudeResponse({
        ...validClaudeResponse,
        companionExperiences: [
          { nickname: 'UnknownPerson', reaction: 'Had fun', wouldReturn: true },
        ],
      });

      const request = createRequest({
        photos: { count: 5, refs: [] },
        venue: { name: 'Test' },
        companions: [
          { name: 'John', relationship: 'friend' },
        ],
        captured_at: new Date().toISOString(),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.moment.companion_experiences[0].relationship).toBe('other');
    });
  });

  // ===========================================================================
  // TIMING AND CONTEXT
  // ===========================================================================

  describe('timing and context', () => {
    it('detects golden hour timing (morning)', async () => {
      setWikipediaSearchResponse('Beach');
      setWikipediaPageResponse({ title: 'Beach', extract: 'Sandy beach' });
      setWeatherResponse({ condition: 'Clear', temp: 18, humidity: 60 });
      setClaudeResponse(validClaudeResponse);

      // Create a date at 7 AM (golden hour)
      const goldenHourDate = new Date();
      goldenHourDate.setHours(7, 30, 0, 0);

      const request = createRequest({
        photos: { count: 5, refs: [] },
        venue: { name: 'Beach', coordinates: { lat: 35.0, lon: 139.0 } },
        companions: [],
        captured_at: goldenHourDate.toISOString(),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.moment.environment.timing.is_golden_hour).toBe(true);
    });

    it('detects golden hour timing (evening)', async () => {
      setWikipediaSearchResponse('Sunset Point');
      setWikipediaPageResponse({ title: 'Sunset Point', extract: 'Viewpoint' });
      setWeatherResponse({ condition: 'Clear', temp: 22, humidity: 40 });
      setClaudeResponse(validClaudeResponse);

      // Create a date at 6 PM (golden hour)
      const goldenHourDate = new Date();
      goldenHourDate.setHours(18, 0, 0, 0);

      const request = createRequest({
        photos: { count: 8, refs: [] },
        venue: { name: 'Sunset Point', coordinates: { lat: 35.0, lon: 139.0 } },
        companions: [],
        captured_at: goldenHourDate.toISOString(),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.moment.environment.timing.is_golden_hour).toBe(true);
    });

    it('correctly formats local time in response', async () => {
      setWikipediaSearchResponse('Test');
      setWikipediaPageResponse({ title: 'Test', extract: 'Test' });
      setWeatherResponse({ condition: 'Clear', temp: 20, humidity: 50 });
      setClaudeResponse(validClaudeResponse);

      const testDate = new Date('2026-02-11T14:30:00Z');

      const request = createRequest({
        photos: { count: 1, refs: [] },
        venue: { name: 'Test', coordinates: { lat: 35.0, lon: 139.0 } },
        companions: [],
        captured_at: testDate.toISOString(),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.moment.environment.timing.local_time).toMatch(/\d{1,2}:\d{2}\s*(AM|PM)/);
    });
  });

  // ===========================================================================
  // OUTPUT STRUCTURE
  // ===========================================================================

  describe('output structure', () => {
    it('returns valid MomentSense structure', async () => {
      setWikipediaSearchResponse('Test');
      setWikipediaPageResponse({ title: 'Test', extract: 'Test venue description' });
      setWeatherResponse({ condition: 'Clear', temp: 20, humidity: 50 });
      setClaudeResponse(validClaudeResponse);

      const request = createRequest({
        photos: { count: 5, refs: [] },
        venue: { name: 'Test', coordinates: { lat: 35.0, lon: 139.0 } },
        companions: [],
        captured_at: new Date().toISOString(),
      });

      const response = await POST(request);
      const data = await response.json();
      const moment = data.moment;

      // Check required fields
      expect(moment.moment_id).toMatch(/^[0-9a-f-]{36}$/); // UUID format
      expect(moment.timestamp).toBeTruthy();
      expect(moment.venue_name).toBe('Test');
      expect(moment.primary_emotion).toBeTruthy();
      expect(moment.emotion_confidence).toBeGreaterThanOrEqual(0);
      expect(moment.emotion_confidence).toBeLessThanOrEqual(1);
      expect(moment.atmosphere).toBeDefined();
      expect(moment.atmosphere.lighting).toBeTruthy();
      expect(moment.atmosphere.energy).toBeTruthy();
      expect(moment.transcendence_score).toBeGreaterThanOrEqual(0);
      expect(moment.transcendence_score).toBeLessThanOrEqual(1);
      expect(moment.narratives).toBeDefined();
      expect(moment.narratives.short).toBeTruthy();
      expect(moment.narratives.medium).toBeTruthy();
      expect(moment.narratives.full).toBeTruthy();
      expect(moment.memory_anchors).toBeDefined();
      expect(moment.memory_anchors.sensory_anchor).toBeTruthy();
      expect(moment.memory_anchors.emotional_anchor).toBeTruthy();
      expect(moment.status).toBe('active');
      expect(moment.created_at).toBeTruthy();
      expect(moment.updated_at).toBeTruthy();
    });

    it('includes detection metadata', async () => {
      setWikipediaSearchResponse('Test');
      setWikipediaPageResponse({ title: 'Test', extract: 'Test' });
      setWeatherResponse({ condition: 'Clear', temp: 20, humidity: 50 });
      setClaudeResponse(validClaudeResponse);

      const request = createRequest({
        photos: { count: 1, refs: [] },
        venue: { name: 'Test', coordinates: { lat: 35.0, lon: 139.0 } },
        companions: [],
        captured_at: new Date().toISOString(),
        detection: {
          trigger: 'photos',
          confidence: 0.9,
          signals: ['burst_detected'],
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.moment.detection.trigger).toBe('photos');
      expect(data.moment.detection.confidence).toBe(0.9);
    });

    it('includes emotion tags array', async () => {
      setWikipediaSearchResponse('Test');
      setWikipediaPageResponse({ title: 'Test', extract: 'Test' });
      setWeatherResponse({ condition: 'Clear', temp: 20, humidity: 50 });
      setClaudeResponse(validClaudeResponse);

      const request = createRequest({
        photos: { count: 1, refs: [] },
        venue: { name: 'Test', coordinates: { lat: 35.0, lon: 139.0 } },
        companions: [],
        captured_at: new Date().toISOString(),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(Array.isArray(data.moment.emotion_tags)).toBe(true);
      expect(data.moment.emotion_tags.length).toBeGreaterThan(0);
      expect(data.moment.emotion_tags).toContain(data.moment.primary_emotion);
    });
  });
});
