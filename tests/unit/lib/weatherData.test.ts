import { describe, it, expect } from 'vitest';
import {
  coarsenCoordinates,
  calculateOutdoorComfort,
  getMockWeatherData,
  WeatherDataSchema,
} from '@/lib/weatherData';

// =============================================================================
// coarsenCoordinates
// =============================================================================

describe('coarsenCoordinates', () => {
  it('rounds coordinates to 0.1 degree precision', () => {
    const result = coarsenCoordinates(35.7148, 139.7967);
    expect(result.lat).toBe(35.7);
    expect(result.lon).toBe(139.8);
  });

  it('rounds up when >= 0.05', () => {
    const result = coarsenCoordinates(35.75, 139.75);
    expect(result.lat).toBe(35.8);
    expect(result.lon).toBe(139.8);
  });

  it('rounds down when < 0.05', () => {
    const result = coarsenCoordinates(35.74, 139.74);
    expect(result.lat).toBe(35.7);
    expect(result.lon).toBe(139.7);
  });

  it('handles negative coordinates (Western/Southern hemisphere)', () => {
    const result = coarsenCoordinates(-33.8688, 151.2093);
    expect(result.lat).toBe(-33.9);
    expect(result.lon).toBe(151.2);
  });

  it('handles coordinates at 0', () => {
    const result = coarsenCoordinates(0, 0);
    expect(result.lat).toBe(0);
    expect(result.lon).toBe(0);
  });

  it('handles extreme latitudes', () => {
    const northPole = coarsenCoordinates(89.99, 0);
    expect(northPole.lat).toBe(90);

    const southPole = coarsenCoordinates(-89.99, 0);
    expect(southPole.lat).toBe(-90);
  });

  it('provides ~11km privacy (0.1 degree precision)', () => {
    // 0.1 degree is approximately 11km at equator
    // Different precise coordinates should map to same coarse coordinate
    const precise1 = coarsenCoordinates(35.7148, 139.7967);
    const precise2 = coarsenCoordinates(35.7199, 139.7901);
    expect(precise1.lat).toBe(precise2.lat);
    expect(precise1.lon).toBe(precise2.lon);
  });
});

// =============================================================================
// calculateOutdoorComfort
// =============================================================================

describe('calculateOutdoorComfort', () => {
  it('returns high score (>0.9) for perfect conditions', () => {
    // Optimal: 18-24°C, 30-60% humidity, calm wind, clear sky
    const score = calculateOutdoorComfort(21, 45, 2, 'Clear');
    expect(score).toBeGreaterThanOrEqual(0.9);
  });

  it('returns low score (<0.4) for storm conditions', () => {
    const score = calculateOutdoorComfort(15, 90, 15, 'Thunderstorm');
    expect(score).toBeLessThan(0.4);
  });

  it('optimal temperature range is 18-24°C', () => {
    const optimal18 = calculateOutdoorComfort(18, 45, 2, 'Clear');
    const optimal24 = calculateOutdoorComfort(24, 45, 2, 'Clear');
    const tooHot = calculateOutdoorComfort(35, 45, 2, 'Clear');
    const tooCold = calculateOutdoorComfort(5, 45, 2, 'Clear');

    expect(optimal18).toBeGreaterThan(tooHot);
    expect(optimal24).toBeGreaterThan(tooCold);
  });

  it('temperature score drops linearly outside optimal range', () => {
    const optimal = calculateOutdoorComfort(21, 45, 0, 'Clear');
    const slightlyHot = calculateOutdoorComfort(28, 45, 0, 'Clear');
    const veryHot = calculateOutdoorComfort(38, 45, 0, 'Clear');

    expect(optimal).toBeGreaterThan(slightlyHot);
    expect(slightlyHot).toBeGreaterThan(veryHot);
  });

  it('optimal humidity range is 30-60%', () => {
    const optimal = calculateOutdoorComfort(21, 45, 0, 'Clear');
    const humid = calculateOutdoorComfort(21, 85, 0, 'Clear');
    const dry = calculateOutdoorComfort(21, 15, 0, 'Clear');

    expect(optimal).toBeGreaterThan(humid);
    expect(optimal).toBeGreaterThan(dry);
  });

  it('wind reduces comfort score', () => {
    const calm = calculateOutdoorComfort(21, 45, 0, 'Clear');
    const breezy = calculateOutdoorComfort(21, 45, 5, 'Clear');
    const windy = calculateOutdoorComfort(21, 45, 12, 'Clear');

    expect(calm).toBeGreaterThan(breezy);
    expect(breezy).toBeGreaterThan(windy);
  });

  it('condition affects score appropriately', () => {
    const clear = calculateOutdoorComfort(21, 45, 2, 'Clear');
    const cloudy = calculateOutdoorComfort(21, 45, 2, 'Clouds');
    const rainy = calculateOutdoorComfort(21, 45, 2, 'Rain');

    expect(clear).toBeGreaterThan(cloudy);
    expect(cloudy).toBeGreaterThan(rainy);
  });

  it('handles various condition strings', () => {
    const conditions = [
      { name: 'Clear', expected: 'high' },
      { name: 'Sunny', expected: 'high' },
      { name: 'Partly cloudy', expected: 'medium' },
      { name: 'Overcast', expected: 'medium' },
      { name: 'Light rain', expected: 'low' },
      { name: 'Drizzle', expected: 'low' },
      { name: 'Snow', expected: 'low' },
      { name: 'Mist', expected: 'medium' },
      { name: 'Fog', expected: 'medium' },
      { name: 'Thunderstorm', expected: 'very low' },
    ];

    conditions.forEach(({ name }) => {
      const score = calculateOutdoorComfort(21, 45, 2, name);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });
  });

  it('returns score between 0 and 1', () => {
    // Test extreme conditions
    const extremes = [
      { temp: -10, humidity: 100, wind: 25, condition: 'Thunderstorm' },
      { temp: 45, humidity: 100, wind: 20, condition: 'Storm' },
      { temp: 21, humidity: 45, wind: 0, condition: 'Clear' },
    ];

    extremes.forEach(({ temp, humidity, wind, condition }) => {
      const score = calculateOutdoorComfort(temp, humidity, wind, condition);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });
  });

  it('returns score rounded to 2 decimal places', () => {
    const score = calculateOutdoorComfort(21.5, 47, 3.5, 'Partly cloudy');
    const decimalPlaces = (score.toString().split('.')[1] || '').length;
    expect(decimalPlaces).toBeLessThanOrEqual(2);
  });

  it('snow gets moderate score (can be pleasant)', () => {
    const snow = calculateOutdoorComfort(0, 50, 3, 'Snow');
    const rain = calculateOutdoorComfort(0, 50, 3, 'Rain');
    // Snow should be slightly better than rain (0.4 vs 0.3 condition score)
    expect(snow).toBeGreaterThan(rain);
  });

  it('unknown conditions get default score', () => {
    const unknown = calculateOutdoorComfort(21, 45, 2, 'Unknown Weather');
    // Should still return a reasonable score
    expect(unknown).toBeGreaterThan(0.5);
  });
});

// =============================================================================
// getMockWeatherData
// =============================================================================

describe('getMockWeatherData', () => {
  it('returns valid WeatherData structure', () => {
    const data = getMockWeatherData('perfect');
    const result = WeatherDataSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('returns "perfect" scenario by default', () => {
    const data = getMockWeatherData();
    expect(data.condition).toBe('Clear');
    expect(data.temperature_c).toBe(21);
    expect(data.outdoor_comfort_score).toBe(0.95);
  });

  it('returns "rainy" scenario correctly', () => {
    const data = getMockWeatherData('rainy');
    expect(data.condition).toBe('Rain');
    expect(data.temperature_c).toBe(16);
    expect(data.outdoor_comfort_score).toBe(0.35);
  });

  it('returns "hot" scenario correctly', () => {
    const data = getMockWeatherData('hot');
    expect(data.condition).toBe('Clear');
    expect(data.temperature_c).toBe(35);
    expect(data.outdoor_comfort_score).toBe(0.45);
  });

  it('returns "cold" scenario correctly', () => {
    const data = getMockWeatherData('cold');
    expect(data.condition).toBe('Clouds');
    expect(data.temperature_c).toBe(5);
    expect(data.outdoor_comfort_score).toBe(0.40);
  });

  it('all scenarios have required fields', () => {
    const scenarios: Array<'perfect' | 'rainy' | 'hot' | 'cold'> = ['perfect', 'rainy', 'hot', 'cold'];

    scenarios.forEach(scenario => {
      const data = getMockWeatherData(scenario);
      expect(data.condition).toBeDefined();
      expect(data.temperature_c).toBeDefined();
      expect(data.outdoor_comfort_score).toBeDefined();
      expect(data.humidity_percent).toBeDefined();
      expect(data.wind_speed_mps).toBeDefined();
      expect(data.description).toBeDefined();
    });
  });

  it('perfect scenario has high comfort score', () => {
    const data = getMockWeatherData('perfect');
    expect(data.outdoor_comfort_score).toBeGreaterThanOrEqual(0.9);
  });

  it('rainy scenario has low comfort score', () => {
    const data = getMockWeatherData('rainy');
    expect(data.outdoor_comfort_score).toBeLessThan(0.5);
  });

  it('defaults to perfect for unknown scenario', () => {
    // TypeScript would normally catch this, but testing runtime behavior
    const data = getMockWeatherData('unknown' as 'perfect');
    expect(data.condition).toBe('Clear');
  });
});

// =============================================================================
// WeatherDataSchema
// =============================================================================

describe('WeatherDataSchema', () => {
  it('accepts valid weather data', () => {
    const result = WeatherDataSchema.safeParse({
      condition: 'Clear',
      temperature_c: 21,
      outdoor_comfort_score: 0.85,
    });
    expect(result.success).toBe(true);
  });

  it('accepts optional fields', () => {
    const result = WeatherDataSchema.safeParse({
      condition: 'Clear',
      temperature_c: 21,
      humidity_percent: 45,
      outdoor_comfort_score: 0.85,
      wind_speed_mps: 3,
      description: 'clear sky',
    });
    expect(result.success).toBe(true);
  });

  it('rejects comfort score outside 0-1 range', () => {
    const tooHigh = WeatherDataSchema.safeParse({
      condition: 'Clear',
      temperature_c: 21,
      outdoor_comfort_score: 1.5,
    });
    expect(tooHigh.success).toBe(false);

    const tooLow = WeatherDataSchema.safeParse({
      condition: 'Clear',
      temperature_c: 21,
      outdoor_comfort_score: -0.1,
    });
    expect(tooLow.success).toBe(false);
  });

  it('requires condition field', () => {
    const result = WeatherDataSchema.safeParse({
      temperature_c: 21,
      outdoor_comfort_score: 0.85,
    });
    expect(result.success).toBe(false);
  });

  it('requires temperature_c field', () => {
    const result = WeatherDataSchema.safeParse({
      condition: 'Clear',
      outdoor_comfort_score: 0.85,
    });
    expect(result.success).toBe(false);
  });

  it('requires outdoor_comfort_score field', () => {
    const result = WeatherDataSchema.safeParse({
      condition: 'Clear',
      temperature_c: 21,
    });
    expect(result.success).toBe(false);
  });

  it('accepts negative temperatures', () => {
    const result = WeatherDataSchema.safeParse({
      condition: 'Snow',
      temperature_c: -15,
      outdoor_comfort_score: 0.3,
    });
    expect(result.success).toBe(true);
  });

  it('accepts boundary comfort scores', () => {
    const zero = WeatherDataSchema.safeParse({
      condition: 'Storm',
      temperature_c: 10,
      outdoor_comfort_score: 0,
    });
    expect(zero.success).toBe(true);

    const one = WeatherDataSchema.safeParse({
      condition: 'Clear',
      temperature_c: 21,
      outdoor_comfort_score: 1,
    });
    expect(one.success).toBe(true);
  });
});
