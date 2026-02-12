// =============================================================================
// WEATHER DATA FETCHING
// OpenWeather API integration for Sensory Agent
// PRIVACY: Uses coarse coordinates only (~11km precision)
// =============================================================================

import { z } from 'zod';
import { OpenWeatherResponseSchema } from './sensoryValidation';

// =============================================================================
// TYPES
// =============================================================================

export const WeatherDataSchema = z.object({
  condition: z.string(),
  temperature_c: z.number(),
  humidity_percent: z.number().optional(),
  outdoor_comfort_score: z.number().min(0).max(1),
  wind_speed_mps: z.number().optional(),
  description: z.string().optional(),
});
export type WeatherData = z.infer<typeof WeatherDataSchema>;

export const WeatherFetchResultSchema = z.object({
  success: z.boolean(),
  data: WeatherDataSchema.nullable(),
  error: z.string().optional(),
  coarse_location_used: z.boolean(),
});
export type WeatherFetchResult = z.infer<typeof WeatherFetchResultSchema>;

// Use validated type from sensoryValidation
export type OpenWeatherResponse = z.infer<typeof OpenWeatherResponseSchema>;

// =============================================================================
// PRIVACY: COARSE COORDINATE ROUNDING
// =============================================================================

/**
 * Round coordinates to ~11km precision for privacy
 * Rounds to 0.1 degree (approximately 11km at equator)
 *
 * Example: 35.7148, 139.7967 → 35.7, 139.8
 */
export function coarsenCoordinates(lat: number, lon: number): { lat: number; lon: number } {
  return {
    lat: Math.round(lat * 10) / 10,
    lon: Math.round(lon * 10) / 10,
  };
}

// =============================================================================
// OUTDOOR COMFORT SCORING
// =============================================================================

/**
 * Calculate outdoor comfort score (0-1) based on weather conditions
 *
 * Factors:
 * - Temperature: optimal range 18-24°C
 * - Humidity: optimal range 30-60%
 * - Wind: calm is better for most activities
 * - Condition: clear/partly cloudy preferred
 */
export function calculateOutdoorComfort(
  tempC: number,
  humidity: number,
  windSpeedMps: number,
  condition: string
): number {
  // Temperature score (0-1)
  // Optimal: 18-24°C, drops off linearly outside
  let tempScore: number;
  if (tempC >= 18 && tempC <= 24) {
    tempScore = 1.0;
  } else if (tempC < 18) {
    tempScore = Math.max(0, 1 - (18 - tempC) / 20); // 0 at -2°C
  } else {
    tempScore = Math.max(0, 1 - (tempC - 24) / 16); // 0 at 40°C
  }

  // Humidity score (0-1)
  // Optimal: 30-60%
  let humidityScore: number;
  if (humidity >= 30 && humidity <= 60) {
    humidityScore = 1.0;
  } else if (humidity < 30) {
    humidityScore = Math.max(0, humidity / 30);
  } else {
    humidityScore = Math.max(0, 1 - (humidity - 60) / 40);
  }

  // Wind score (0-1)
  // Light breeze (0-3 m/s) is ideal, drops off with stronger wind
  const windScore = Math.max(0, 1 - windSpeedMps / 15);

  // Condition score (0-1)
  const conditionLower = condition.toLowerCase();
  let conditionScore = 0.7; // default for unknown
  if (conditionLower.includes('clear') || conditionLower.includes('sunny')) {
    conditionScore = 1.0;
  } else if (conditionLower.includes('cloud') || conditionLower.includes('overcast')) {
    conditionScore = 0.8;
  } else if (conditionLower.includes('mist') || conditionLower.includes('fog')) {
    conditionScore = 0.6;
  } else if (conditionLower.includes('rain') || conditionLower.includes('drizzle')) {
    conditionScore = 0.3;
  } else if (conditionLower.includes('snow')) {
    conditionScore = 0.4; // Can be pleasant for some!
  } else if (conditionLower.includes('storm') || conditionLower.includes('thunder')) {
    conditionScore = 0.1;
  }

  // Weighted average
  const comfort =
    tempScore * 0.35 +
    humidityScore * 0.20 +
    windScore * 0.15 +
    conditionScore * 0.30;

  return Math.round(comfort * 100) / 100;
}

// =============================================================================
// MAIN FETCH FUNCTION
// =============================================================================

/**
 * Fetch weather data from OpenWeather API
 *
 * PRIVACY:
 * - Coordinates are rounded to 0.1 degree (~11km) before sending
 * - No user identifiers are transmitted
 *
 * @param lat - Latitude (will be coarsened)
 * @param lon - Longitude (will be coarsened)
 * @param apiKey - OpenWeather API key (optional, uses env var if not provided)
 */
export async function fetchWeather(
  lat: number,
  lon: number,
  apiKey?: string
): Promise<WeatherFetchResult> {
  const key = apiKey || process.env.OPENWEATHER_API_KEY;

  if (!key) {
    return {
      success: false,
      data: null,
      error: 'OPENWEATHER_API_KEY not configured',
      coarse_location_used: false,
    };
  }

  // Privacy: coarsen coordinates before sending
  const coarse = coarsenCoordinates(lat, lon);

  try {
    const url = new URL('https://api.openweathermap.org/data/2.5/weather');
    url.searchParams.set('lat', coarse.lat.toString());
    url.searchParams.set('lon', coarse.lon.toString());
    url.searchParams.set('appid', key);
    url.searchParams.set('units', 'metric'); // Celsius

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      // 10 second timeout
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return {
        success: false,
        data: null,
        error: `OpenWeather API error: ${response.status}`,
        coarse_location_used: true,
      };
    }

    const rawData = await response.json();

    // Validate response against schema
    const validated = OpenWeatherResponseSchema.safeParse(rawData);
    if (!validated.success) {
      console.error('OpenWeather response validation failed:', validated.error.errors);
      return {
        success: false,
        data: null,
        error: 'Invalid OpenWeather API response format',
        coarse_location_used: true,
      };
    }

    const data = validated.data;

    const weatherData: WeatherData = {
      condition: data.weather[0]?.main || 'Unknown',
      description: data.weather[0]?.description,
      temperature_c: Math.round(data.main.temp * 10) / 10,
      humidity_percent: data.main.humidity,
      wind_speed_mps: data.wind?.speed,
      outdoor_comfort_score: calculateOutdoorComfort(
        data.main.temp,
        data.main.humidity,
        data.wind?.speed || 0,
        data.weather[0]?.main || ''
      ),
    };

    return {
      success: true,
      data: WeatherDataSchema.parse(weatherData),
      coarse_location_used: true,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Handle timeout specifically
    if (errorMessage.includes('timeout') || errorMessage.includes('abort')) {
      return {
        success: false,
        data: null,
        error: 'Weather API timeout',
        coarse_location_used: true,
      };
    }

    return {
      success: false,
      data: null,
      error: `Weather fetch failed: ${errorMessage}`,
      coarse_location_used: true,
    };
  }
}

// =============================================================================
// MOCK DATA FOR TESTING
// =============================================================================

/**
 * Generate mock weather data for testing/development
 */
export function getMockWeatherData(scenario: 'perfect' | 'rainy' | 'hot' | 'cold' = 'perfect'): WeatherData {
  const scenarios: Record<string, WeatherData> = {
    perfect: {
      condition: 'Clear',
      description: 'clear sky',
      temperature_c: 21,
      humidity_percent: 45,
      wind_speed_mps: 2,
      outdoor_comfort_score: 0.95,
    },
    rainy: {
      condition: 'Rain',
      description: 'light rain',
      temperature_c: 16,
      humidity_percent: 85,
      wind_speed_mps: 5,
      outdoor_comfort_score: 0.35,
    },
    hot: {
      condition: 'Clear',
      description: 'clear sky',
      temperature_c: 35,
      humidity_percent: 70,
      wind_speed_mps: 1,
      outdoor_comfort_score: 0.45,
    },
    cold: {
      condition: 'Clouds',
      description: 'overcast clouds',
      temperature_c: 5,
      humidity_percent: 60,
      wind_speed_mps: 8,
      outdoor_comfort_score: 0.40,
    },
  };

  return scenarios[scenario] || scenarios.perfect;
}
