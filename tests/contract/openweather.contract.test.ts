import { describe, it, expect, beforeAll } from 'vitest';
import { OpenWeatherResponseSchema } from '@/lib/sensoryValidation';

/**
 * OpenWeather API Contract Tests
 *
 * These tests verify that the OpenWeather API returns valid responses
 * that match our Zod schemas.
 *
 * WHEN TO RUN:
 * - Before deploying weather integration changes
 * - After OpenWeather API updates
 * - Before production deployment
 *
 * DO NOT RUN:
 * - In CI/CD (requires real API key)
 * - On every commit (rate limits: 60 calls/min on free tier)
 */

describe('OpenWeather API Contract', () => {
  let apiKey: string;

  beforeAll(() => {
    apiKey = process.env.OPENWEATHER_API_KEY || '';
    if (!apiKey) {
      throw new Error(
        'OPENWEATHER_API_KEY not found. Set it in .env.local to run contract tests.'
      );
    }
  });

  it('should return valid weather response schema for Paris', async () => {
    // Paris coordinates
    const lat = 48.8566;
    const lon = 2.3522;

    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
    const response = await fetch(url);
    const data = await response.json();

    // Validate against our schema
    const validated = OpenWeatherResponseSchema.safeParse(data);
    expect(validated.success).toBe(true);

    // Verify key fields
    expect(data.coord).toBeDefined();
    expect(data.coord.lat).toBeCloseTo(lat, 1);
    expect(data.coord.lon).toBeCloseTo(lon, 1);
    expect(data.weather).toBeDefined();
    expect(Array.isArray(data.weather)).toBe(true);
    expect(data.weather.length).toBeGreaterThan(0);
    expect(data.main).toBeDefined();
    expect(typeof data.main.temp).toBe('number');
    expect(data.wind).toBeDefined();
  });

  it('should return valid weather response schema for Tokyo', async () => {
    const lat = 35.6762;
    const lon = 139.6503;

    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
    const response = await fetch(url);
    const data = await response.json();

    const validated = OpenWeatherResponseSchema.safeParse(data);
    expect(validated.success).toBe(true);
  });

  it('should return valid weather response schema for New York', async () => {
    const lat = 40.7128;
    const lon = -74.006;

    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
    const response = await fetch(url);
    const data = await response.json();

    const validated = OpenWeatherResponseSchema.safeParse(data);
    expect(validated.success).toBe(true);
  });

  it('should handle invalid API key correctly', async () => {
    const invalidKey = 'invalid_api_key_12345';
    const lat = 48.8566;
    const lon = 2.3522;

    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${invalidKey}&units=metric`;
    const response = await fetch(url);

    // Should return 401 Unauthorized
    expect(response.status).toBe(401);

    const data = await response.json();
    expect(data.cod).toBe(401);
    expect(data.message).toBeDefined();
  });

  it('should return reasonable temperature ranges', async () => {
    const lat = 48.8566;
    const lon = 2.3522;

    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
    const response = await fetch(url);
    const data = await response.json();

    // Temperature should be reasonable for Earth
    expect(data.main.temp).toBeGreaterThan(-50);
    expect(data.main.temp).toBeLessThan(60);

    // Humidity should be 0-100%
    expect(data.main.humidity).toBeGreaterThanOrEqual(0);
    expect(data.main.humidity).toBeLessThanOrEqual(100);
  });

  it('should include weather condition description', async () => {
    const lat = 48.8566;
    const lon = 2.3522;

    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
    const response = await fetch(url);
    const data = await response.json();

    expect(data.weather[0].description).toBeDefined();
    expect(typeof data.weather[0].description).toBe('string');
    expect(data.weather[0].description.length).toBeGreaterThan(0);
  });

  it('should handle parallel requests without rate limiting', async () => {
    // Make 3 parallel requests
    const promises = [
      fetch(`https://api.openweathermap.org/data/2.5/weather?lat=48.8566&lon=2.3522&appid=${apiKey}&units=metric`),
      fetch(`https://api.openweathermap.org/data/2.5/weather?lat=35.6762&lon=139.6503&appid=${apiKey}&units=metric`),
      fetch(`https://api.openweathermap.org/data/2.5/weather?lat=40.7128&lon=-74.0060&appid=${apiKey}&units=metric`),
    ];

    const responses = await Promise.all(promises);

    // All should succeed (within free tier limit of 60/min)
    responses.forEach((response) => {
      expect(response.ok).toBe(true);
    });
  });

  it('should complete request within reasonable time', async () => {
    const start = Date.now();
    const lat = 48.8566;
    const lon = 2.3522;

    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
    await fetch(url);
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(3000); // Should complete within 3 seconds
  });
});
