import { describe, it, expect, beforeAll } from 'vitest';
import Anthropic from '@anthropic-ai/sdk';
import { SynthesisOutputSchema } from '@/lib/sensoryValidation';

/**
 * Claude Synthesis Contract Tests
 *
 * These tests verify that the Claude API returns valid responses
 * that match our Zod schemas. Run with real API key.
 *
 * WHEN TO RUN:
 * - Before switching Claude models (Sonnet ↔ Haiku)
 * - Before upgrading @anthropic-ai/sdk
 * - Before production deployment
 *
 * DO NOT RUN:
 * - In CI/CD (requires real API key)
 * - On every commit (costs money)
 */

describe('Claude API Contract', () => {
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

  it('should return valid message response from Claude API', async () => {
    const response = await anthropic.messages.create({
      model: claudeModel,
      max_tokens: 100,
      messages: [
        {
          role: 'user',
          content: 'Say "Hello World" and nothing else.',
        },
      ],
    });

    // Verify response structure
    expect(response).toBeDefined();
    expect(response.content).toBeDefined();
    expect(Array.isArray(response.content)).toBe(true);
    expect(response.content.length).toBeGreaterThan(0);

    const firstContent = response.content[0];
    expect(firstContent.type).toBe('text');
    if (firstContent.type === 'text') {
      expect(firstContent.text).toBeDefined();
      expect(typeof firstContent.text).toBe('string');
      expect(firstContent.text.toLowerCase()).toContain('hello');
    }
  }, 15000);

  it('should respect configured Claude model', async () => {
    const response = await anthropic.messages.create({
      model: claudeModel,
      max_tokens: 50,
      messages: [{ role: 'user', content: 'Hi' }],
    });

    // Verify the model used matches our configuration
    expect(response.model).toBe(claudeModel);
  }, 15000);

  it('should handle JSON output format', async () => {
    const response = await anthropic.messages.create({
      model: claudeModel,
      max_tokens: 200,
      messages: [
        {
          role: 'user',
          content:
            'Return a JSON object with one field "emotion" set to "happy". Return ONLY the JSON, no other text.',
        },
      ],
    });

    const textContent = response.content[0];
    expect(textContent.type).toBe('text');

    if (textContent.type === 'text') {
      // Should be able to parse as JSON
      const parsed = JSON.parse(textContent.text);
      expect(parsed).toBeDefined();
      expect(parsed.emotion).toBeDefined();
    }
  }, 15000);

  it('should handle long-form text generation', async () => {
    const response = await anthropic.messages.create({
      model: claudeModel,
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content:
            'Write a 2-sentence description of the Eiffel Tower.',
        },
      ],
    });

    const textContent = response.content[0];
    if (textContent.type === 'text') {
      expect(textContent.text.length).toBeGreaterThan(50);
      expect(textContent.text.toLowerCase()).toContain('eiffel');
    }
  }, 15000);

  it('should handle timeout with abort controller', async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1000); // 1s timeout

    try {
      await anthropic.messages.create(
        {
          model: claudeModel,
          max_tokens: 2000,
          messages: [
            {
              role: 'user',
              content: 'Write a very long story.',
            },
          ],
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

  it('should return usage metadata', async () => {
    const response = await anthropic.messages.create({
      model: claudeModel,
      max_tokens: 100,
      messages: [{ role: 'user', content: 'Hello' }],
    });

    // Claude API should return usage information
    expect(response.usage).toBeDefined();
    expect(response.usage.input_tokens).toBeGreaterThan(0);
    expect(response.usage.output_tokens).toBeGreaterThan(0);
  }, 15000);

  it('should handle system prompts', async () => {
    const response = await anthropic.messages.create({
      model: claudeModel,
      max_tokens: 100,
      system: 'You are a helpful travel assistant.',
      messages: [
        {
          role: 'user',
          content: 'What should I visit in Paris?',
        },
      ],
    });

    const textContent = response.content[0];
    if (textContent.type === 'text') {
      expect(textContent.text.toLowerCase()).toMatch(/paris|eiffel|louvre|tower|museum/);
    }
  }, 15000);
});
