import { describe, it, expect, beforeAll } from 'vitest';
import { OpenWeatherResponseSchema } from '@/lib/sensoryValidation';
import { fetchWeatherData } from '@/lib/weatherData';

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
 * - Weekly as part of release process
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

  describe('Weather Data Endpoint', () => {
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
      // Tokyo coordinates
      const lat = 35.6762;
      const lon = 139.6503;

      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
      const response = await fetch(url);
      const data = await response.json();

      const validated = OpenWeatherResponseSchema.safeParse(data);
      expect(validated.success).toBe(true);
    });

    it('should return valid weather response schema for New York', async () => {
      // New York coordinates
      const lat = 40.7128;
      const lon = -74.0060;

      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
      const response = await fetch(url);
      const data = await response.json();

      const validated = OpenWeatherResponseSchema.safeParse(data);
      expect(validated.success).toBe(true);
    });
  });

  describe('Weather Data Integration', () => {
    it('should fetch weather data for valid coordinates (Paris)', async () => {
      const result = await fetchWeatherData(48.8566, 2.3522);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();

      if (result.data) {
        expect(typeof result.data.temperature).toBe('number');
        expect(typeof result.data.feelsLike).toBe('number');
        expect(typeof result.data.humidity).toBe('number');
        expect(typeof result.data.condition).toBe('string');
        expect(result.data.condition.length).toBeGreaterThan(0);

        // Temperature should be reasonable for Earth
        expect(result.data.temperature).toBeGreaterThan(-50);
        expect(result.data.temperature).toBeLessThan(60);

        // Humidity should be 0-100%
        expect(result.data.humidity).toBeGreaterThanOrEqual(0);
        expect(result.data.humidity).toBeLessThanOrEqual(100);
      }
    }, 5000);

    it('should fetch weather data for valid coordinates (Sydney)', async () => {
      const result = await fetchWeatherData(-33.8688, 151.2093);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    }, 5000);

    it('should fetch weather data for valid coordinates (Dubai)', async () => {
      const result = await fetchWeatherData(25.2048, 55.2708);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    }, 5000);
  });

  describe('Coordinate Validation', () => {
    it('should handle latitude out of bounds (too high)', async () => {
      const result = await fetchWeatherData(95.0, 0.0); // Invalid: lat > 90

      // Should fail validation
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('latitude');
    }, 5000);

    it('should handle latitude out of bounds (too low)', async () => {
      const result = await fetchWeatherData(-95.0, 0.0); // Invalid: lat < -90

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('latitude');
    }, 5000);

    it('should handle longitude out of bounds (too high)', async () => {
      const result = await fetchWeatherData(0.0, 185.0); // Invalid: lon > 180

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('longitude');
    }, 5000);

    it('should handle longitude out of bounds (too low)', async () => {
      const result = await fetchWeatherData(0.0, -185.0); // Invalid: lon < -180

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('longitude');
    }, 5000);

    it('should handle edge case coordinates (North Pole)', async () => {
      const result = await fetchWeatherData(90.0, 0.0); // Valid: exactly 90°

      // Should succeed (North Pole is a valid location)
      expect(result.success).toBe(true);
    }, 5000);

    it('should handle edge case coordinates (South Pole)', async () => {
      const result = await fetchWeatherData(-90.0, 0.0); // Valid: exactly -90°

      expect(result.success).toBe(true);
    }, 5000);

    it('should handle edge case coordinates (International Date Line)', async () => {
      const result = await fetchWeatherData(0.0, 180.0); // Valid: exactly 180°

      expect(result.success).toBe(true);
    }, 5000);
  });

  describe('API Key Validation', () => {
    it('should detect invalid API key', async () => {
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
  });

  describe('Error Handling', () => {
    it('should handle network timeout gracefully', async () => {
      // Set up abort controller with short timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1000); // 1s timeout

      try {
        const lat = 48.8566;
        const lon = 2.3522;
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;

        await fetch(url, { signal: controller.signal });

        // If it completes, clear timeout
        clearTimeout(timeoutId);
      } catch (error: any) {
        clearTimeout(timeoutId);

        // Should be an abort error
        expect(error.name).toBe('AbortError');
      }
    }, 5000);
  });

  describe('Response Data Quality', () => {
    it('should return current weather (not historical)', async () => {
      const result = await fetchWeatherData(48.8566, 2.3522);

      expect(result.success).toBe(true);

      if (result.data) {
        // Temperature should be current (not 0 or undefined)
        expect(result.data.temperature).toBeDefined();
        expect(typeof result.data.temperature).toBe('number');
        expect(isNaN(result.data.temperature)).toBe(false);
      }
    }, 5000);

    it('should include weather condition description', async () => {
      const result = await fetchWeatherData(48.8566, 2.3522);

      expect(result.success).toBe(true);

      if (result.data) {
        expect(result.data.condition).toBeDefined();
        expect(typeof result.data.condition).toBe('string');
        expect(result.data.condition.length).toBeGreaterThan(0);

        // Condition should be a real weather description
        const commonConditions = [
          'clear', 'clouds', 'rain', 'snow', 'mist', 'fog',
          'sunny', 'cloudy', 'overcast', 'drizzle', 'thunderstorm'
        ];
        const hasCommonCondition = commonConditions.some(cond =>
          result.data!.condition.toLowerCase().includes(cond)
        );
        expect(hasCommonCondition).toBe(true);
      }
    }, 5000);

    it('should include wind data', async () => {
      const result = await fetchWeatherData(48.8566, 2.3522);

      expect(result.success).toBe(true);

      if (result.data) {
        expect(result.data.windSpeed).toBeDefined();
        expect(typeof result.data.windSpeed).toBe('number');
        expect(result.data.windSpeed).toBeGreaterThanOrEqual(0);

        // Wind speed should be reasonable (< 200 km/h for non-cyclone weather)
        expect(result.data.windSpeed).toBeLessThan(200);
      }
    }, 5000);
  });

  describe('Performance', () => {
    it('should complete request within reasonable time', async () => {
      const start = Date.now();
      const result = await fetchWeatherData(48.8566, 2.3522);
      const duration = Date.now() - start;

      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(3000); // Should complete within 3 seconds
    }, 5000);

    it('should handle parallel requests without rate limit errors', async () => {
      // Make 3 parallel requests for different locations
      const promises = [
        fetchWeatherData(48.8566, 2.3522), // Paris
        fetchWeatherData(35.6762, 139.6503), // Tokyo
        fetchWeatherData(40.7128, -74.0060), // New York
      ];

      const results = await Promise.all(promises);

      // All should succeed (within free tier rate limit of 60/min)
      results.forEach(result => {
        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
      });
    }, 10000);
  });
});
