// =============================================================================
// SENSORY DATA FETCHING
// Wikipedia + venue enrichment for Sensory Agent
// Provides historical context, fame scoring, and unique claims
// =============================================================================

import { z } from 'zod';
import { VenueCategoryEnum, WikipediaSearchResponseSchema, WikipediaPageResponseSchema } from './sensoryValidation';

// =============================================================================
// TYPES
// =============================================================================

export const WikipediaDataSchema = z.object({
  title: z.string(),
  extract: z.string(), // First paragraph summary
  description: z.string().nullable(),
  founded_year: z.number().nullable(),
  categories: z.array(z.string()),
  page_url: z.string().nullable(),
});
export type WikipediaData = z.infer<typeof WikipediaDataSchema>;

export const VenueEnrichmentSchema = z.object({
  verified_name: z.string(),
  category: VenueCategoryEnum,
  description: z.string().nullable(),
  founded_year: z.number().nullable(),
  historical_significance: z.string().nullable(),
  unique_claims: z.array(z.string()),
  fame_score: z.number().min(0).max(1).nullable(),
  wikipedia_url: z.string().nullable(),
});
export type VenueEnrichment = z.infer<typeof VenueEnrichmentSchema>;

export const VenueFetchResultSchema = z.object({
  success: z.boolean(),
  data: VenueEnrichmentSchema.nullable(),
  error: z.string().optional(),
  source: z.enum(['wikipedia', 'google_places', 'combined', 'none']),
});
export type VenueFetchResult = z.infer<typeof VenueFetchResultSchema>;

// Wikipedia API response shapes
interface WikiSearchResult {
  pageid: number;
  title: string;
}

interface WikiSearchResponse {
  query?: {
    search: WikiSearchResult[];
  };
}

interface WikiPageResponse {
  query?: {
    pages: Record<string, {
      pageid: number;
      title: string;
      extract?: string;
      description?: string;
      categories?: Array<{ title: string }>;
      fullurl?: string;
    }>;
  };
}

// =============================================================================
// FAME SCORE CALCULATION
// =============================================================================

/**
 * Calculate fame score based on Wikipedia presence and content
 *
 * Factors:
 * - Has Wikipedia article: +0.3 base
 * - Article length: +0.2 for substantial content
 * - Category presence: +0.1 per significant category
 * - Historical age: +0.1 for venues > 100 years old
 * - UNESCO/World Heritage: +0.2
 */
export function calculateFameScore(
  hasWikipedia: boolean,
  extractLength: number,
  categories: string[],
  foundedYear: number | null
): number {
  if (!hasWikipedia) {
    return 0.1; // Base score for any known venue
  }

  let score = 0.3; // Base for having Wikipedia article

  // Article length score (max +0.2)
  if (extractLength > 500) score += 0.1;
  if (extractLength > 1500) score += 0.1;

  // Category analysis
  const significantCategories = [
    'unesco', 'world heritage', 'national treasure', 'landmark',
    'historic', 'monument', 'famous', 'iconic', 'notable',
  ];

  const categoryText = categories.join(' ').toLowerCase();
  for (const sig of significantCategories) {
    if (categoryText.includes(sig)) {
      score += 0.1;
      break; // Cap at +0.1 for categories
    }
  }

  // UNESCO/World Heritage bonus
  if (categoryText.includes('world heritage') || categoryText.includes('unesco')) {
    score += 0.1;
  }

  // Historical age bonus
  if (foundedYear && foundedYear < new Date().getFullYear() - 100) {
    score += 0.1;
  }

  return Math.min(1.0, Math.round(score * 100) / 100);
}

/**
 * Extract founded year from Wikipedia text
 * Looks for patterns like "founded in 628", "built in 1889", "established 1950"
 */
export function extractFoundedYear(text: string): number | null {
  const patterns = [
    /(?:founded|established|built|constructed|created|opened)\s+(?:in\s+)?(\d{3,4})/i,
    /(?:dates?\s+(?:back\s+)?to|since)\s+(\d{3,4})/i,
    /(\d{3,4})\s*(?:CE|AD|BC)?/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const year = parseInt(match[1], 10);
      // Sanity check: year should be reasonable
      if (year > 0 && year <= new Date().getFullYear()) {
        return year;
      }
    }
  }

  return null;
}

/**
 * Extract unique claims from Wikipedia text
 * Looks for superlatives and notable facts
 */
export function extractUniqueClaims(text: string, title: string): string[] {
  const claims: string[] = [];

  const patterns = [
    // Superlatives
    /(?:the\s+)?(oldest|largest|tallest|first|only|most\s+\w+)(?:\s+\w+){1,5}(?:\s+in\s+(?:the\s+)?\w+)?/gi,
    // Notable facts
    /(?:known\s+for|famous\s+for|renowned\s+for)(?:\s+\w+){1,8}/gi,
    // UNESCO/heritage mentions
    /(?:UNESCO|World Heritage|National Treasure)(?:\s+\w+){0,4}/gi,
  ];

  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null) {
      const claim = match[0].trim();
      // Clean up and validate
      if (claim.length > 10 && claim.length < 100) {
        // Capitalize first letter
        const formatted = claim.charAt(0).toUpperCase() + claim.slice(1);
        if (!claims.includes(formatted)) {
          claims.push(formatted);
        }
      }
    }
  }

  // Limit to top 3 claims
  return claims.slice(0, 3);
}

/**
 * Infer venue category from Wikipedia categories and text
 * Maps to VenueCategoryEnum: 'landmark' | 'dining' | 'shopping' | 'nature' | 'event' | 'accommodation' | 'transit' | 'other'
 */
export function inferVenueCategory(
  categories: string[],
  text: string
): z.infer<typeof VenueCategoryEnum> {
  const categoryText = (categories.join(' ') + ' ' + text).toLowerCase();

  const categoryMap: Array<{ keywords: string[]; category: z.infer<typeof VenueCategoryEnum> }> = [
    // landmark: temples, museums, monuments, historic sites
    { keywords: ['temple', 'shrine', 'mosque', 'church', 'cathedral', 'synagogue', 'museum', 'gallery', 'monument', 'memorial', 'statue', 'landmark', 'historic', 'heritage', 'tower', 'castle', 'palace'], category: 'landmark' },
    // dining: restaurants, cafes, bars
    { keywords: ['restaurant', 'dining', 'eatery', 'bistro', 'cafe', 'ramen', 'bar', 'pub', 'tavern', 'izakaya', 'cocktail', 'food', 'cuisine'], category: 'dining' },
    // accommodation: hotels, resorts
    { keywords: ['hotel', 'resort', 'inn', 'ryokan', 'hostel', 'lodging', 'accommodation'], category: 'accommodation' },
    // nature: parks, beaches, mountains, gardens
    { keywords: ['park', 'garden', 'botanical', 'nature reserve', 'beach', 'coast', 'shore', 'bay', 'mountain', 'peak', 'summit', 'hiking', 'trail', 'forest', 'lake', 'river', 'waterfall'], category: 'nature' },
    // shopping: markets, malls
    { keywords: ['market', 'bazaar', 'shopping', 'mall', 'arcade', 'store', 'shop'], category: 'shopping' },
    // event: theaters, arenas, entertainment venues
    { keywords: ['theatre', 'theater', 'cinema', 'concert', 'arena', 'stadium', 'festival'], category: 'event' },
    // transit: stations, airports
    { keywords: ['station', 'airport', 'terminal', 'port', 'hub'], category: 'transit' },
  ];

  for (const { keywords, category } of categoryMap) {
    for (const keyword of keywords) {
      if (categoryText.includes(keyword)) {
        return category;
      }
    }
  }

  return 'other';
}

// =============================================================================
// WIKIPEDIA FETCHING
// =============================================================================

/**
 * Search Wikipedia for a venue
 * Uses the Wikipedia API's search endpoint
 */
async function searchWikipedia(query: string): Promise<WikiSearchResult | null> {
  try {
    const url = new URL('https://en.wikipedia.org/w/api.php');
    url.searchParams.set('action', 'query');
    url.searchParams.set('list', 'search');
    url.searchParams.set('srsearch', query);
    url.searchParams.set('srlimit', '1');
    url.searchParams.set('format', 'json');
    url.searchParams.set('origin', '*');

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) return null;

    const data = await response.json();

    // Validate response against schema
    const validated = WikipediaSearchResponseSchema.safeParse(data);
    if (!validated.success) {
      console.error('Wikipedia search response validation failed:', validated.error.errors);
      return null;
    }

    return validated.data.query?.search[0] || null;
  } catch (error) {
    console.error('Wikipedia search error:', error instanceof Error ? error.message : String(error));
    return null;
  }
}

/**
 * OPTIMIZATION Step 3: Multi-strategy fallback search
 * Tries multiple search patterns in parallel to maximize success rate
 * Strategies: full query → first word → first two words
 */
async function searchWikipediaWithFallbacks(query: string): Promise<WikiSearchResult | null> {
  // Generate search strategies: full → first word → first two words
  const strategies: string[] = [query];

  const words = query.split(' ').filter(w => w.length > 0);
  if (words.length > 1) {
    strategies.push(words[0]); // First word
    strategies.push(words.slice(0, 2).join(' ')); // First two words
  }

  // Remove duplicates
  const uniqueStrategies = [...new Set(strategies)];

  // Try all strategies in parallel
  const results = await Promise.allSettled(
    uniqueStrategies.map(strategy => searchWikipedia(strategy))
  );

  // Return first successful result
  for (const result of results) {
    if (result.status === 'fulfilled' && result.value) {
      return result.value;
    }
  }

  return null;
}

/**
 * Fetch Wikipedia page details by title
 */
async function fetchWikipediaPage(title: string): Promise<WikipediaData | null> {
  try {
    const url = new URL('https://en.wikipedia.org/w/api.php');
    url.searchParams.set('action', 'query');
    url.searchParams.set('titles', title);
    url.searchParams.set('prop', 'extracts|info|categories|description');
    url.searchParams.set('exintro', '1'); // Only first section
    url.searchParams.set('explaintext', '1'); // Plain text, no HTML
    url.searchParams.set('inprop', 'url');
    url.searchParams.set('cllimit', '20');
    url.searchParams.set('format', 'json');
    url.searchParams.set('origin', '*');

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) return null;

    const data = await response.json();

    // Validate response against schema
    const validated = WikipediaPageResponseSchema.safeParse(data);
    if (!validated.success) {
      console.error('Wikipedia page response validation failed:', validated.error.errors);
      return null;
    }

    const pages = validated.data.query?.pages;
    if (!pages) return null;

    const page = Object.values(pages)[0];
    if (!page || page.pageid < 0) return null; // -1 means not found

    const categories = (page.categories || [])
      .map(c => c.title.replace('Category:', ''))
      .filter(c => !c.includes('Articles') && !c.includes('Pages'));

    return {
      title: page.title,
      extract: page.extract || '',
      description: page.description || null,
      founded_year: extractFoundedYear(page.extract || ''),
      categories,
      page_url: page.fullurl || null,
    };
  } catch (error) {
    console.error('Wikipedia page fetch error:', error instanceof Error ? error.message : String(error));
    return null;
  }
}

// =============================================================================
// CACHING LAYER (Step 2: TTL-based cache)
// =============================================================================

interface CacheEntry {
  data: VenueEnrichment;
  timestamp: number;
}

const VENUE_CACHE: Map<string, CacheEntry> = new Map();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24-hour TTL

/**
 * Get cached venue enrichment if exists and not expired
 */
function getCachedVenue(cacheKey: string): VenueEnrichment | null {
  const cached = VENUE_CACHE.get(cacheKey);
  if (!cached) return null;

  const isExpired = Date.now() - cached.timestamp > CACHE_TTL_MS;
  if (isExpired) {
    VENUE_CACHE.delete(cacheKey);
    return null;
  }

  return cached.data;
}

/**
 * Set cached venue enrichment
 */
function setCachedVenue(cacheKey: string, data: VenueEnrichment): void {
  VENUE_CACHE.set(cacheKey, {
    data,
    timestamp: Date.now(),
  });
}

// =============================================================================
// MAIN VENUE ENRICHMENT FUNCTION
// =============================================================================

/**
 * Fetch venue enrichment data from Wikipedia
 *
 * OPTIMIZATION:
 * - Step 1: Check 24-hour TTL cache (saves ~1200ms on cache hit)
 * - Step 2: Parallelize search queries (saves ~400ms)
 * - Step 3: Single page fetch (already sequential after search)
 *
 * PRIVACY: Only venue name is sent to Wikipedia API (no user data)
 *
 * @param venueName - Name of the venue to look up
 * @param destination - Optional destination context for better matching
 */
export async function fetchVenueEnrichment(
  venueName: string,
  destination?: string
): Promise<VenueFetchResult> {
  // Build search query with destination context
  const searchQuery = destination
    ? `${venueName} ${destination}`
    : venueName;

  // Build cache key (lowercase for consistency)
  const cacheKey = searchQuery.toLowerCase();

  // OPTIMIZATION Step 1: Check cache first
  const cached = getCachedVenue(cacheKey);
  if (cached) {
    return {
      success: true,
      data: cached,
      source: 'wikipedia', // Cache hit is still Wikipedia data
    };
  }

  try {
    // OPTIMIZATION Step 2-3: Parallel search with multi-strategy fallback
    // Instead of: search1 (400ms) → fallback search (400ms) → page (400ms) = 1200ms
    // Now:       search1 + fallbacks (parallel, 400ms) → page (400ms) = 600-800ms
    // Tries: full query → first word → first two words (all in parallel)
    const searchResult = await searchWikipediaWithFallbacks(searchQuery);

    if (!searchResult) {
      return {
        success: false,
        data: null,
        error: 'Venue not found on Wikipedia',
        source: 'none',
      };
    }

    const pageTitle = searchResult.title;

    // Step 3: Fetch page details
    const wikiData = await fetchWikipediaPage(pageTitle);

    if (!wikiData) {
      return {
        success: false,
        data: null,
        error: 'Could not fetch Wikipedia page',
        source: 'none',
      };
    }

    // Step 3: Build enrichment
    const category = inferVenueCategory(wikiData.categories, wikiData.extract);
    const uniqueClaims = extractUniqueClaims(wikiData.extract, wikiData.title);
    const fameScore = calculateFameScore(
      true,
      wikiData.extract.length,
      wikiData.categories,
      wikiData.founded_year
    );

    // Extract historical significance (first 1-2 sentences of extract)
    const sentences = wikiData.extract.split(/(?<=[.!?])\s+/);
    const historicalSignificance = sentences.slice(0, 2).join(' ').trim() || null;

    const enrichment: VenueEnrichment = {
      verified_name: wikiData.title,
      category,
      description: wikiData.description,
      founded_year: wikiData.founded_year,
      historical_significance: historicalSignificance,
      unique_claims: uniqueClaims,
      fame_score: fameScore,
      wikipedia_url: wikiData.page_url,
    };

    const parsed = VenueEnrichmentSchema.parse(enrichment);

    // OPTIMIZATION Step 2b: Cache result for future requests
    setCachedVenue(cacheKey, parsed);

    return {
      success: true,
      data: parsed,
      source: 'wikipedia',
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return {
      success: false,
      data: null,
      error: `Venue enrichment failed: ${errorMessage}`,
      source: 'none',
    };
  }
}

// =============================================================================
// MOCK DATA FOR TESTING
// =============================================================================

/**
 * Generate mock venue enrichment data for testing/development
 */
export function getMockVenueEnrichment(venueName: string): VenueEnrichment {
  // Generate deterministic but varied mock data based on venue name
  const hash = venueName.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  const categories = Object.values(VenueCategoryEnum.options);
  const category = categories[hash % categories.length];

  return {
    verified_name: venueName,
    category,
    description: `${venueName} is a notable destination known for its unique character and cultural significance.`,
    founded_year: 1900 + (hash % 125), // 1900-2025
    historical_significance: `${venueName} has been a beloved landmark for generations, offering visitors an authentic experience.`,
    unique_claims: [
      `One of the most visited ${category}s in the region`,
      'Featured in numerous travel guides',
    ],
    fame_score: 0.5 + (hash % 50) / 100, // 0.50-0.99
    wikipedia_url: `https://en.wikipedia.org/wiki/${encodeURIComponent(venueName.replace(/ /g, '_'))}`,
  };
}

/**
 * Mock data for specific well-known venues (for demo purposes)
 */
export const FAMOUS_VENUE_MOCKS: Record<string, VenueEnrichment> = {
  'Senso-ji': {
    verified_name: 'Senso-ji',
    category: 'landmark', // temples are landmarks
    description: 'Ancient Buddhist temple in Asakusa, Tokyo',
    founded_year: 628,
    historical_significance: "Senso-ji is Tokyo's oldest temple, founded in 628 CE. According to legend, two fishermen found a statue of Kannon in the Sumida River.",
    unique_claims: [
      'Oldest temple in Tokyo',
      'Over 30 million visitors annually',
      'Famous Kaminarimon (Thunder Gate) with giant red lantern',
    ],
    fame_score: 0.95,
    wikipedia_url: 'https://en.wikipedia.org/wiki/Sens%C5%8D-ji',
  },
  'Eiffel Tower': {
    verified_name: 'Eiffel Tower',
    category: 'landmark',
    description: 'Wrought-iron lattice tower on the Champ de Mars in Paris',
    founded_year: 1889,
    historical_significance: 'The Eiffel Tower was constructed for the 1889 World Fair and has become a global cultural icon of France.',
    unique_claims: [
      'Most-visited paid monument in the world',
      'Tallest structure in Paris',
      'Named after engineer Gustave Eiffel',
    ],
    fame_score: 0.99,
    wikipedia_url: 'https://en.wikipedia.org/wiki/Eiffel_Tower',
  },
  'Fushimi Inari': {
    verified_name: 'Fushimi Inari-taisha',
    category: 'landmark', // shrines are landmarks
    description: 'Head shrine of the kami Inari in Kyoto',
    founded_year: 711,
    historical_significance: 'Fushimi Inari-taisha is the head shrine of Inari, the god of rice and prosperity. It is famous for its thousands of vermilion torii gates.',
    unique_claims: [
      'Over 10,000 torii gates',
      'One of Kyoto\'s most important Shinto shrines',
      'Open 24 hours',
    ],
    fame_score: 0.92,
    wikipedia_url: 'https://en.wikipedia.org/wiki/Fushimi_Inari-taisha',
  },
};

/**
 * Get mock data with famous venue lookup
 */
export function getMockVenueData(venueName: string): VenueEnrichment {
  // Check for famous venues first
  for (const [key, data] of Object.entries(FAMOUS_VENUE_MOCKS)) {
    if (venueName.toLowerCase().includes(key.toLowerCase())) {
      return data;
    }
  }

  // Fall back to generated mock
  return getMockVenueEnrichment(venueName);
}
