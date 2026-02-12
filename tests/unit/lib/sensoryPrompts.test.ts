import { describe, it, expect } from 'vitest';
import {
  buildSynthesisPrompt,
  parseSynthesisResponse,
  generateFallbackNarrative,
  SENSORY_SYSTEM_PROMPT,
  type SynthesisInput,
  type SynthesisOutput,
} from '@/lib/sensoryPrompts';

// =============================================================================
// TEST FIXTURES
// =============================================================================

const baseSynthesisInput: SynthesisInput = {
  photoAnalysis: {
    scene: 'temple',
    lighting: 'golden_hour',
    indoorOutdoor: 'outdoor',
    faceCount: 3,
    crowdLevel: 'moderate',
    energyLevel: 'calm',
    emotions: ['happy', 'peaceful'],
  },
  voiceAnalysis: {
    sentimentScore: 0.85,
    detectedTone: 'awe',
    keywords: ['Japan', 'dreamed', 'peaceful'],
    theme: 'fulfillment',
    durationSeconds: 15,
  },
  venue: {
    name: 'Senso-ji Temple',
    category: 'landmark',
    description: 'Ancient Buddhist temple in Asakusa, Tokyo',
    foundedYear: 645,
    historicalSignificance: 'Tokyo\'s oldest temple',
    uniqueClaims: ['Oldest temple in Tokyo'],
    fameScore: 0.85,
  },
  weather: {
    condition: 'Sunny',
    temperatureC: 22,
    comfortScore: 0.9,
  },
  companions: [
    { relationship: 'family', nickname: 'Mom', age_group: 'adult' },
    { relationship: 'family', nickname: 'Max', age_group: 'child' },
  ],
  context: {
    localTime: '2025-04-15T09:30:00Z',
    isGoldenHour: true,
    isWeekend: false,
    durationMinutes: 45,
    tripIntent: 'cultural exploration',
  },
};

const minimalSynthesisInput: SynthesisInput = {
  photoAnalysis: {
    scene: null,
    lighting: null,
    indoorOutdoor: null,
    faceCount: 0,
    crowdLevel: null,
    energyLevel: null,
    emotions: [],
  },
  voiceAnalysis: null,
  venue: null,
  weather: null,
  companions: [],
  context: {
    localTime: '2025-04-15T09:30:00Z',
    isGoldenHour: false,
    isWeekend: false,
    durationMinutes: null,
  },
};

const validSynthesisResponseJson: SynthesisOutput = {
  primaryEmotion: 'awe',
  secondaryEmotions: ['peace', 'joy'],
  emotionConfidence: 0.9,
  narratives: {
    short: 'Golden morning light at the ancient temple.',
    medium: 'Walking through Senso-ji with Mom and Max, the incense curling through golden hour light.',
    full: 'A long narrative about the temple visit with all the details and companions mentioned.',
  },
  excitementHook: 'Tokyo\'s oldest temple, founded in 645 AD',
  memoryAnchors: {
    sensory: 'Incense smoke in golden light',
    emotional: 'Sharing this with family',
    unexpected: 'Max\'s fascination with the dragon fountain',
    shareable: 'The iconic Kaminarimon gate photo',
    companion: 'Mom\'s quiet tears of joy',
  },
  companionExperiences: [
    { nickname: 'Mom', reaction: 'Deeply moved by the spiritual atmosphere', wouldReturn: true },
    { nickname: 'Max', reaction: 'Excited by the dragon water fountain', wouldReturn: true },
  ],
  inferredSensory: {
    scent: 'Incense and morning air',
    tactile: 'Smooth wooden prayer beads',
    sound: 'Temple bells and hushed voices',
  },
};

// =============================================================================
// SENSORY_SYSTEM_PROMPT
// =============================================================================

describe('SENSORY_SYSTEM_PROMPT', () => {
  it('mentions privacy constraints', () => {
    expect(SENSORY_SYSTEM_PROMPT).toContain('PRIVACY');
    expect(SENSORY_SYSTEM_PROMPT).toContain('metadata');
    expect(SENSORY_SYSTEM_PROMPT).toContain('never');
  });

  it('instructs to return JSON only', () => {
    expect(SENSORY_SYSTEM_PROMPT).toContain('JSON');
    expect(SENSORY_SYSTEM_PROMPT).toContain('Return ONLY');
  });

  it('provides inference guidelines', () => {
    expect(SENSORY_SYSTEM_PROMPT).toContain('INFERENCE GUIDELINES');
    expect(SENSORY_SYSTEM_PROMPT).toContain('may infer');
    expect(SENSORY_SYSTEM_PROMPT).toContain('may NOT');
  });
});

// =============================================================================
// buildSynthesisPrompt
// =============================================================================

describe('buildSynthesisPrompt', () => {
  it('includes all sections for full input', () => {
    const prompt = buildSynthesisPrompt(baseSynthesisInput);

    expect(prompt).toContain('## Photo Analysis');
    expect(prompt).toContain('## Voice Analysis');
    expect(prompt).toContain('## Venue Context');
    expect(prompt).toContain('## Weather');
    expect(prompt).toContain('## Companions');
    expect(prompt).toContain('## Context');
    expect(prompt).toContain('## Required Output');
  });

  it('includes photo analysis details', () => {
    const prompt = buildSynthesisPrompt(baseSynthesisInput);

    expect(prompt).toContain('Scene: temple');
    expect(prompt).toContain('Lighting: golden_hour');
    expect(prompt).toContain('Setting: outdoor');
    expect(prompt).toContain('Faces detected: 3');
    expect(prompt).toContain('Crowd level: moderate');
    expect(prompt).toContain('Energy: calm');
    expect(prompt).toContain('happy, peaceful');
  });

  it('includes voice analysis metadata (not transcript)', () => {
    const prompt = buildSynthesisPrompt(baseSynthesisInput);

    expect(prompt).toContain('Sentiment: 0.85');
    expect(prompt).toContain('(highly positive)');
    expect(prompt).toContain('Tone: awe');
    expect(prompt).toContain('Keywords: Japan, dreamed, peaceful');
    expect(prompt).toContain('Theme: fulfillment');
    expect(prompt).toContain('Duration: 15s');
    expect(prompt).toContain('transcript not transmitted');
  });

  it('handles missing voice analysis', () => {
    const prompt = buildSynthesisPrompt(minimalSynthesisInput);

    expect(prompt).toContain('No voice note provided');
  });

  it('includes venue context', () => {
    const prompt = buildSynthesisPrompt(baseSynthesisInput);

    expect(prompt).toContain('Name: Senso-ji Temple');
    expect(prompt).toContain('Category: landmark');
    expect(prompt).toContain('Ancient Buddhist temple');
    expect(prompt).toContain('Founded: 645');
    expect(prompt).toContain('Significance: Tokyo\'s oldest temple');
    expect(prompt).toContain('Oldest temple in Tokyo');
    expect(prompt).toContain('Fame score: 0.85');
  });

  it('handles missing venue', () => {
    const prompt = buildSynthesisPrompt(minimalSynthesisInput);

    expect(prompt).toContain('No venue information available');
  });

  it('includes weather when available', () => {
    const prompt = buildSynthesisPrompt(baseSynthesisInput);

    expect(prompt).toContain('Condition: Sunny');
    expect(prompt).toContain('Temperature: 22°C');
    expect(prompt).toContain('Outdoor comfort: 90%');
  });

  it('excludes weather section when not available', () => {
    const prompt = buildSynthesisPrompt(minimalSynthesisInput);

    expect(prompt).not.toContain('## Weather');
  });

  it('includes companions list', () => {
    const prompt = buildSynthesisPrompt(baseSynthesisInput);

    expect(prompt).toContain('## Companions');
    expect(prompt).toContain('- Mom (adult)');
    expect(prompt).toContain('- Max (child)');
  });

  it('excludes companions section when none', () => {
    const prompt = buildSynthesisPrompt(minimalSynthesisInput);

    expect(prompt).not.toContain('## Companions');
  });

  it('includes context details', () => {
    const prompt = buildSynthesisPrompt(baseSynthesisInput);

    expect(prompt).toContain('Local time:');
    expect(prompt).toContain('Golden hour: yes');
    expect(prompt).toContain('Weekend: no');
    expect(prompt).toContain('Duration: 45 minutes');
    expect(prompt).toContain('Trip intent: cultural exploration');
  });

  it('includes JSON schema in required output', () => {
    const prompt = buildSynthesisPrompt(baseSynthesisInput);

    expect(prompt).toContain('"primaryEmotion"');
    expect(prompt).toContain('"narratives"');
    expect(prompt).toContain('"memoryAnchors"');
    expect(prompt).toContain('"companionExperiences"');
    expect(prompt).toContain('Return ONLY the JSON object');
  });

  it('handles neutral sentiment label', () => {
    const input: SynthesisInput = {
      ...baseSynthesisInput,
      voiceAnalysis: {
        ...baseSynthesisInput.voiceAnalysis!,
        sentimentScore: 0.1, // Slightly positive
      },
    };
    const prompt = buildSynthesisPrompt(input);
    expect(prompt).toContain('(positive)');
  });

  it('handles negative sentiment label', () => {
    const input: SynthesisInput = {
      ...baseSynthesisInput,
      voiceAnalysis: {
        ...baseSynthesisInput.voiceAnalysis!,
        sentimentScore: -0.5,
      },
    };
    const prompt = buildSynthesisPrompt(input);
    expect(prompt).toContain('(negative)');
  });

  it('uses relationship as fallback when no nickname', () => {
    const input: SynthesisInput = {
      ...baseSynthesisInput,
      companions: [{ relationship: 'friend', nickname: null }],
    };
    const prompt = buildSynthesisPrompt(input);
    expect(prompt).toContain('- friend');
  });
});

// =============================================================================
// parseSynthesisResponse
// =============================================================================

describe('parseSynthesisResponse', () => {
  it('parses valid JSON response', () => {
    const response = JSON.stringify(validSynthesisResponseJson);
    const result = parseSynthesisResponse(response);

    expect(result).not.toBeNull();
    expect(result?.primaryEmotion).toBe('awe');
    expect(result?.emotionConfidence).toBe(0.9);
    expect(result?.narratives.short).toBe('Golden morning light at the ancient temple.');
  });

  it('handles markdown-wrapped JSON', () => {
    const response = '```json\n' + JSON.stringify(validSynthesisResponseJson) + '\n```';
    const result = parseSynthesisResponse(response);

    expect(result).not.toBeNull();
    expect(result?.primaryEmotion).toBe('awe');
  });

  it('handles markdown-wrapped JSON without language tag', () => {
    const response = '```\n' + JSON.stringify(validSynthesisResponseJson) + '\n```';
    const result = parseSynthesisResponse(response);

    expect(result).not.toBeNull();
    expect(result?.primaryEmotion).toBe('awe');
  });

  it('returns null for invalid JSON', () => {
    const result = parseSynthesisResponse('not valid json');
    expect(result).toBeNull();
  });

  it('returns null for missing required fields', () => {
    const incomplete = { someField: 'value' };
    const result = parseSynthesisResponse(JSON.stringify(incomplete));
    expect(result).toBeNull();
  });

  it('returns null when primaryEmotion is missing', () => {
    const missingPrimary = { ...validSynthesisResponseJson, primaryEmotion: undefined };
    const result = parseSynthesisResponse(JSON.stringify(missingPrimary));
    expect(result).toBeNull();
  });

  it('returns null when narratives is missing', () => {
    const missingNarratives = { ...validSynthesisResponseJson, narratives: undefined };
    const result = parseSynthesisResponse(JSON.stringify(missingNarratives));
    expect(result).toBeNull();
  });

  it('returns null when memoryAnchors is missing', () => {
    const missingAnchors = { ...validSynthesisResponseJson, memoryAnchors: undefined };
    const result = parseSynthesisResponse(JSON.stringify(missingAnchors));
    expect(result).toBeNull();
  });

  it('provides defaults for optional fields', () => {
    const minimal = {
      primaryEmotion: 'joy',
      narratives: { short: 'test', medium: 'test', full: 'test' },
      memoryAnchors: { sensory: 'test', emotional: 'test' },
    };
    const result = parseSynthesisResponse(JSON.stringify(minimal));

    expect(result).not.toBeNull();
    expect(result?.secondaryEmotions).toEqual([]);
    expect(result?.emotionConfidence).toBe(0.7); // Default
    expect(result?.excitementHook).toBeNull();
    expect(result?.companionExperiences).toEqual([]);
    expect(result?.inferredSensory.scent).toBeNull();
  });

  it('extracts all companion experiences', () => {
    const response = JSON.stringify(validSynthesisResponseJson);
    const result = parseSynthesisResponse(response);

    expect(result?.companionExperiences).toHaveLength(2);
    expect(result?.companionExperiences[0].nickname).toBe('Mom');
    expect(result?.companionExperiences[1].nickname).toBe('Max');
  });

  it('extracts inferred sensory details', () => {
    const response = JSON.stringify(validSynthesisResponseJson);
    const result = parseSynthesisResponse(response);

    expect(result?.inferredSensory.scent).toBe('Incense and morning air');
    expect(result?.inferredSensory.tactile).toBe('Smooth wooden prayer beads');
    expect(result?.inferredSensory.sound).toBe('Temple bells and hushed voices');
  });

  it('trims whitespace from response', () => {
    const response = '  \n' + JSON.stringify(validSynthesisResponseJson) + '\n  ';
    const result = parseSynthesisResponse(response);

    expect(result).not.toBeNull();
    expect(result?.primaryEmotion).toBe('awe');
  });
});

// =============================================================================
// generateFallbackNarrative
// =============================================================================

describe('generateFallbackNarrative', () => {
  it('generates basic narrative with venue and companions', () => {
    const result = generateFallbackNarrative(baseSynthesisInput);

    expect(result.primaryEmotion).toBeDefined();
    expect(result.narratives.short).toContain('Senso-ji Temple');
    expect(result.narratives.medium).toContain('Senso-ji Temple');
    expect(result.narratives.medium).toContain('Mom and Max');
  });

  it('uses sentiment to determine emotion', () => {
    // High positive sentiment -> joy
    const highPositive: SynthesisInput = {
      ...baseSynthesisInput,
      voiceAnalysis: { ...baseSynthesisInput.voiceAnalysis!, sentimentScore: 0.8 },
    };
    expect(generateFallbackNarrative(highPositive).primaryEmotion).toBe('joy');

    // Negative sentiment -> reflection
    const negative: SynthesisInput = {
      ...baseSynthesisInput,
      voiceAnalysis: { ...baseSynthesisInput.voiceAnalysis!, sentimentScore: -0.5 },
    };
    expect(generateFallbackNarrative(negative).primaryEmotion).toBe('reflection');

    // Neutral sentiment -> peace
    const neutral: SynthesisInput = {
      ...baseSynthesisInput,
      voiceAnalysis: { ...baseSynthesisInput.voiceAnalysis!, sentimentScore: 0.2 },
    };
    expect(generateFallbackNarrative(neutral).primaryEmotion).toBe('peace');
  });

  it('uses detected tone when no sentiment score', () => {
    const input: SynthesisInput = {
      ...baseSynthesisInput,
      voiceAnalysis: {
        ...baseSynthesisInput.voiceAnalysis!,
        sentimentScore: null,
        detectedTone: 'excitement',
      },
    };
    expect(generateFallbackNarrative(input).primaryEmotion).toBe('excitement');
  });

  it('defaults to wonder when no voice analysis', () => {
    expect(generateFallbackNarrative(minimalSynthesisInput).primaryEmotion).toBe('wonder');
  });

  it('includes weather in short narrative', () => {
    const result = generateFallbackNarrative(baseSynthesisInput);
    expect(result.narratives.short).toContain('sunny');
  });

  it('includes theme in medium narrative', () => {
    const result = generateFallbackNarrative(baseSynthesisInput);
    expect(result.narratives.medium).toContain('fulfillment');
  });

  it('includes historical significance in full narrative', () => {
    const result = generateFallbackNarrative(baseSynthesisInput);
    expect(result.narratives.full).toContain('Tokyo\'s oldest temple');
  });

  it('uses first unique claim as excitement hook', () => {
    const result = generateFallbackNarrative(baseSynthesisInput);
    expect(result.excitementHook).toBe('Oldest temple in Tokyo');
  });

  it('returns null excitement hook when no claims', () => {
    const result = generateFallbackNarrative(minimalSynthesisInput);
    expect(result.excitementHook).toBeNull();
  });

  it('uses lighting as sensory anchor', () => {
    const result = generateFallbackNarrative(baseSynthesisInput);
    expect(result.memoryAnchors.sensory).toBe('golden_hour');
  });

  it('generates companion experiences', () => {
    const result = generateFallbackNarrative(baseSynthesisInput);

    expect(result.companionExperiences).toHaveLength(2);
    expect(result.companionExperiences[0].nickname).toBe('Mom');
    expect(result.companionExperiences[0].reaction).toBe('Enjoyed the visit');
    expect(result.companionExperiences[0].wouldReturn).toBeNull();
  });

  it('handles venue name fallback to "this place"', () => {
    const result = generateFallbackNarrative(minimalSynthesisInput);
    expect(result.narratives.medium).toContain('this place');
  });

  it('generates companion anchor for first companion', () => {
    const result = generateFallbackNarrative(baseSynthesisInput);
    expect(result.memoryAnchors.companion).toContain('Mom');
  });

  it('returns null companion anchor when solo', () => {
    const result = generateFallbackNarrative(minimalSynthesisInput);
    expect(result.memoryAnchors.companion).toBeNull();
  });

  it('has correct emotionConfidence for fallback', () => {
    const result = generateFallbackNarrative(baseSynthesisInput);
    expect(result.emotionConfidence).toBe(0.5);
  });

  it('returns null for inferred sensory in fallback', () => {
    const result = generateFallbackNarrative(baseSynthesisInput);
    expect(result.inferredSensory.scent).toBeNull();
    expect(result.inferredSensory.tactile).toBeNull();
    expect(result.inferredSensory.sound).toBeNull();
  });

  it('truncates short narrative to 100 characters', () => {
    const input: SynthesisInput = {
      ...baseSynthesisInput,
      venue: {
        ...baseSynthesisInput.venue!,
        name: 'A Very Long Venue Name That Would Make The Short Narrative Exceed One Hundred Characters Easily',
      },
    };
    const result = generateFallbackNarrative(input);
    expect(result.narratives.short.length).toBeLessThanOrEqual(100);
  });

  it('uses relationship as fallback when nickname is null', () => {
    const input: SynthesisInput = {
      ...baseSynthesisInput,
      companions: [{ relationship: 'partner', nickname: null }],
    };
    const result = generateFallbackNarrative(input);
    expect(result.narratives.medium).toContain('partner');
    expect(result.companionExperiences[0].nickname).toBe('partner');
  });
});
