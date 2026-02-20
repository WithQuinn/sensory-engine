import { describe, it, expect, beforeAll } from 'vitest';
import Anthropic from '@anthropic-ai/sdk';
import { SynthesisOutputSchema } from '@/lib/sensoryValidation';
import { buildSynthesisPrompt, parseSynthesisResponse } from '@/lib/sensoryPrompts';

/**
 * Claude Synthesis Contract Tests
 *
 * These tests verify that the Claude API returns valid responses
 * that match our Zod schemas. Run with real API key.
 *
 * WHEN TO RUN:
 * - Before switching Claude models (Sonnet ↔ Haiku)
 * - Before upgrading @anthropic-ai/sdk
 * - Before changing prompt structure
 * - Before production deployment
 *
 * DO NOT RUN:
 * - In CI/CD (requires real API key)
 * - On every commit (costs money)
 */

describe('Claude Synthesis API Contract', () => {
  let anthropic: Anthropic;
  let claudeModel: string;

  beforeAll(() => {
    // Verify API key is present
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error(
        'ANTHROPIC_API_KEY not found. Set it in .env.local to run contract tests.'
      );
    }

    claudeModel = process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514';
    anthropic = new Anthropic({ apiKey });
  });

  it('should return valid synthesis output schema with venue only', async () => {
    const prompt = buildSynthesisPrompt({
      venue: {
        name: 'Eiffel Tower',
        destination: 'Paris, France',
        venueEnrichment: {
          description: 'Iconic iron lattice tower on the Champ de Mars, built in 1889 as the entrance to the World\'s Fair.',
          historicalContext: 'Built by Gustave Eiffel for the 1889 World\'s Fair. Named after its designer.',
          culturalSignificance: 'One of the most recognizable structures in the world.',
          famousVisitors: ['Thomas Edison', 'Adolf Hitler'],
          interestingFacts: ['It was the tallest man-made structure for 41 years.'],
        },
      },
      itinerary: 'Visiting the Eiffel Tower with family',
      companions: ['Sarah', 'Max'],
    });

    const response = await anthropic.messages.create({
      model: claudeModel,
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });

    expect(response.content).toBeDefined();
    expect(response.content.length).toBeGreaterThan(0);

    const textContent = response.content[0];
    expect(textContent.type).toBe('text');

    // Parse and validate response
    if (textContent.type === 'text') {
      const parsed = parseSynthesisResponse(textContent.text);
      expect(parsed).not.toBeNull();

      if (parsed) {
        // Validate against schema
        const validated = SynthesisOutputSchema.safeParse(parsed);
        expect(validated.success).toBe(true);

        // Verify required fields
        expect(parsed.narrative).toBeDefined();
        expect(parsed.narrative.short).toBeDefined();
        expect(parsed.narrative.medium).toBeDefined();
        expect(parsed.narrative.full).toBeDefined();
        expect(parsed.primaryEmotion).toBeDefined();
        expect(parsed.emotionalArc).toBeInstanceOf(Array);
        expect(parsed.memoryAnchors).toBeInstanceOf(Array);
        expect(parsed.companions).toBeInstanceOf(Array);
        expect(typeof parsed.transcendenceScore).toBe('number');
        expect(parsed.transcendenceScore).toBeGreaterThanOrEqual(0);
        expect(parsed.transcendenceScore).toBeLessThanOrEqual(1);
      }
    }
  }, 15000); // 15s timeout for API call

  it('should handle emotional tone detection', async () => {
    const prompt = buildSynthesisPrompt({
      venue: {
        name: 'Grand Canyon',
        destination: 'Arizona, USA',
      },
      itinerary: 'Watching the sunrise at the Grand Canyon. Absolutely breathtaking.',
      companions: ['Partner'],
    });

    const response = await anthropic.messages.create({
      model: claudeModel,
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });

    const textContent = response.content[0];
    if (textContent.type === 'text') {
      const parsed = parseSynthesisResponse(textContent.text);
      expect(parsed).not.toBeNull();

      if (parsed) {
        expect(parsed.primaryEmotion).toBeDefined();
        expect(typeof parsed.primaryEmotion).toBe('string');
        expect(parsed.primaryEmotion.length).toBeGreaterThan(0);
      }
    }
  }, 15000);

  it('should extract memory anchors', async () => {
    const prompt = buildSynthesisPrompt({
      venue: {
        name: 'Tokyo DisneySea',
        destination: 'Tokyo, Japan',
      },
      itinerary: 'Riding on the Indiana Jones ride, eating churros, watching the night parade',
      companions: ['Kids'],
    });

    const response = await anthropic.messages.create({
      model: claudeModel,
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });

    const textContent = response.content[0];
    if (textContent.type === 'text') {
      const parsed = parseSynthesisResponse(textContent.text);
      expect(parsed).not.toBeNull();

      if (parsed) {
        expect(parsed.memoryAnchors).toBeInstanceOf(Array);
        expect(parsed.memoryAnchors.length).toBeGreaterThan(0);

        // Memory anchors should be short phrases
        parsed.memoryAnchors.forEach(anchor => {
          expect(typeof anchor).toBe('string');
          expect(anchor.length).toBeGreaterThan(0);
          expect(anchor.length).toBeLessThan(100);
        });
      }
    }
  }, 15000);

  it('should detect companions from context', async () => {
    const prompt = buildSynthesisPrompt({
      venue: {
        name: 'Senso-ji Temple',
        destination: 'Tokyo, Japan',
      },
      itinerary: 'Visiting the temple with Sarah and the kids',
      companions: ['Sarah', 'Kids'],
    });

    const response = await anthropic.messages.create({
      model: claudeModel,
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });

    const textContent = response.content[0];
    if (textContent.type === 'text') {
      const parsed = parseSynthesisResponse(textContent.text);
      expect(parsed).not.toBeNull();

      if (parsed) {
        expect(parsed.companions).toBeInstanceOf(Array);

        // Should include at least one companion
        expect(parsed.companions.length).toBeGreaterThan(0);

        parsed.companions.forEach(companion => {
          expect(typeof companion.name).toBe('string');
          expect(typeof companion.experienceQuality).toBe('string');
          expect(typeof companion.needsMet).toBe('boolean');
        });
      }
    }
  }, 15000);

  it('should respect configured Claude model', async () => {
    const prompt = buildSynthesisPrompt({
      venue: {
        name: 'Test Venue',
        destination: 'Test City',
      },
      itinerary: 'Test itinerary',
    });

    const response = await anthropic.messages.create({
      model: claudeModel,
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });

    // Verify the model used matches our configuration
    expect(response.model).toBe(claudeModel);
  }, 15000);

  it('should handle timeout gracefully', async () => {
    const prompt = buildSynthesisPrompt({
      venue: {
        name: 'Complex Venue',
        destination: 'Complex City',
        venueEnrichment: {
          description: 'Very long description '.repeat(100),
        },
      },
      itinerary: 'Very long itinerary '.repeat(100),
    });

    // Set a short timeout to test timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1000); // 1s timeout

    try {
      await anthropic.messages.create(
        {
          model: claudeModel,
          max_tokens: 2000,
          messages: [{ role: 'user', content: prompt }],
        },
        { signal: controller.signal }
      );

      // If it completes, clear timeout
      clearTimeout(timeoutId);
    } catch (error: any) {
      clearTimeout(timeoutId);

      // Should be an abort error
      expect(error.name).toBe('AbortError');
    }
  }, 5000);

  it('should calculate transcendence score', async () => {
    const prompt = buildSynthesisPrompt({
      venue: {
        name: 'Louvre Museum',
        destination: 'Paris, France',
        venueEnrichment: {
          description: 'The world\'s largest art museum and a historic monument in Paris.',
          culturalSignificance: 'Home to the Mona Lisa and 38,000 other artworks.',
          famousVisitors: ['Napoleon Bonaparte', 'Leonardo da Vinci'],
        },
      },
      itinerary: 'Seeing the Mona Lisa for the first time',
      companions: ['Family'],
    });

    const response = await anthropic.messages.create({
      model: claudeModel,
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });

    const textContent = response.content[0];
    if (textContent.type === 'text') {
      const parsed = parseSynthesisResponse(textContent.text);
      expect(parsed).not.toBeNull();

      if (parsed) {
        expect(typeof parsed.transcendenceScore).toBe('number');
        expect(parsed.transcendenceScore).toBeGreaterThanOrEqual(0);
        expect(parsed.transcendenceScore).toBeLessThanOrEqual(1);

        // Famous venues like the Louvre should have higher transcendence scores
        expect(parsed.transcendenceScore).toBeGreaterThan(0.5);
      }
    }
  }, 15000);
});
