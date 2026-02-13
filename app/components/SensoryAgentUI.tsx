'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { trackEvent, getOrCreateSessionId } from '@/lib/telemetry';
import { THEME, SPACING, BORDER_RADIUS } from '@/lib/uiTheme';
import { Button, Card, Pill, Input, LoadingState, Divider, EmotionTag } from '@/lib/uiComponents';
import type { MomentSense, SensoryInput, PhotoReference } from '@/lib/sensoryValidation';

// =============================================================================
// Types
// =============================================================================

interface ExtractedPhotoData {
  file: File;
  previewUrl: string;
  timestamp: string | null;
  coordinates: { lat: number; lon: number } | null;
  localAnalysis: {
    scene_type: string | null;
    lighting: string | null;
    indoor_outdoor: string | null;
    face_count: number;
    crowd_level: string | null;
    energy_level: string | null;
    basic_emotion: string | null;
  };
}

type ProcessingState = 'idle' | 'processing' | 'success' | 'error';

// =============================================================================
// Particle Component (ambient floating effect)
// =============================================================================

function Particles() {
  const [particles, setParticles] = useState<Array<{
    id: number;
    left: number;
    top: number;
    size: number;
    duration: number;
    delay: number;
  }>>([]);

  useEffect(() => {
    const newParticles = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 20 + 10,
      delay: Math.random() * 5,
    }));
    setParticles(newParticles);
  }, []);

  return (
    <>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.3; }
          25% { transform: translateY(-20px) translateX(10px); opacity: 0.6; }
          50% { transform: translateY(-10px) translateX(-5px); opacity: 0.4; }
          75% { transform: translateY(-25px) translateX(5px); opacity: 0.5; }
        }
      `}</style>
      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            position: 'fixed',
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            background: 'rgba(200, 180, 160, 0.15)',
            animation: `float ${p.duration}s ease-in-out infinite`,
            animationDelay: `${p.delay}s`,
            pointerEvents: 'none',
            zIndex: 1,
          }}
        />
      ))}
    </>
  );
}

// =============================================================================
// EXIF Extraction (client-side only - photos never leave device)
// =============================================================================

async function extractExifData(file: File): Promise<{
  timestamp: string | null;
  coordinates: { lat: number; lon: number } | null;
}> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const view = new DataView(e.target?.result as ArrayBuffer);
      if (view.getUint16(0) !== 0xFFD8) {
        resolve({ timestamp: null, coordinates: null });
        return;
      }
      let timestamp: string | null = null;
      const coordinates: { lat: number; lon: number } | null = null;
      if (file.lastModified) {
        timestamp = new Date(file.lastModified).toISOString();
      }
      resolve({ timestamp, coordinates });
    };
    reader.onerror = () => resolve({ timestamp: null, coordinates: null });
    reader.readAsArrayBuffer(file.slice(0, 65536));
  });
}

// =============================================================================
// Helper: Calculate dominant hue (0-360)
// =============================================================================
function calculateDominantHue(pixels: Uint8ClampedArray): number {
  const hueCounts: Record<number, number> = {};

  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i] / 255;
    const g = pixels[i + 1] / 255;
    const b = pixels[i + 2] / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;

    if (delta === 0) continue;

    let hue = 0;
    if (max === r) {
      hue = ((g - b) / delta) % 6;
    } else if (max === g) {
      hue = (b - r) / delta + 2;
    } else {
      hue = (r - g) / delta + 4;
    }

    hue = Math.round(hue * 60);
    if (hue < 0) hue += 360;

    const hueBucket = Math.floor(hue / 30) * 30;
    hueCounts[hueBucket] = (hueCounts[hueBucket] || 0) + 1;
  }

  let maxCount = 0;
  let dominantHue = 0;
  for (const [hue, count] of Object.entries(hueCounts)) {
    if (count > maxCount) {
      maxCount = count;
      dominantHue = parseInt(hue);
    }
  }

  return dominantHue;
}

// =============================================================================
// Helper: Classify lighting from brightness
// =============================================================================
function classifyLighting(brightness: number): 'golden_hour' | 'bright' | 'overcast' | 'night' | null {
  if (brightness > 200) return 'bright';
  if (brightness > 150) return 'golden_hour';
  if (brightness > 100) return 'overcast';
  if (brightness <= 100) return 'night';
  return null;
}

// =============================================================================
// Helper: Classify energy from saturation and brightness
// =============================================================================
function classifyEnergy(saturation: number, brightness: number): 'tranquil' | 'calm' | 'lively' | 'energetic' | 'chaotic' | null {
  const energyScore = (saturation * 255 + brightness) / 2;

  if (energyScore > 200) return 'energetic';
  if (energyScore > 160) return 'lively';
  if (energyScore > 120) return 'calm';
  return 'tranquil';
}

// =============================================================================
// Helper: Infer basic emotion from visual characteristics
// =============================================================================
function inferEmotionFromVisuals({ brightness, saturation, hue }: {
  brightness: number;
  saturation: number;
  hue: number;
}): 'joy' | 'serenity' | 'awe' | 'nostalgia' | null {
  // Bright + saturated + warm hues (red/orange/yellow) → joy
  if (brightness > 180 && saturation > 0.5 && hue >= 0 && hue <= 60) {
    return 'joy';
  }

  // Moderate brightness + blue/green hues → serenity
  if (brightness > 120 && brightness < 180 && hue >= 180 && hue <= 270) {
    return 'serenity';
  }

  // High brightness + vivid colors → awe
  if (brightness > 200 && saturation > 0.6) {
    return 'awe';
  }

  // Desaturated + warm tones → nostalgia
  if (saturation < 0.3 && hue >= 0 && hue <= 60) {
    return 'nostalgia';
  }

  return null;
}

// =============================================================================
// Photo Emotion Detection
// =============================================================================
async function analyzeImageLocally(file: File): Promise<ExtractedPhotoData['localAnalysis']> {
  return new Promise((resolve) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;

      // 1. Brightness analysis
      let totalBrightness = 0;
      for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        const brightness = (r + g + b) / 3;
        totalBrightness += brightness;
      }
      const avgBrightness = totalBrightness / (pixels.length / 4);

      // 2. Color saturation analysis
      let totalSaturation = 0;
      for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const saturation = max === 0 ? 0 : (max - min) / max;
        totalSaturation += saturation;
      }
      const avgSaturation = totalSaturation / (pixels.length / 4);

      // 3. Dominant color hue
      const dominantHue = calculateDominantHue(pixels);

      // 4. Infer emotion from visual cues
      const emotion = inferEmotionFromVisuals({
        brightness: avgBrightness,
        saturation: avgSaturation,
        hue: dominantHue,
      });

      resolve({
        scene_type: null,
        lighting: classifyLighting(avgBrightness),
        indoor_outdoor: null,
        face_count: 0,
        crowd_level: null,
        energy_level: classifyEnergy(avgSaturation, avgBrightness),
        basic_emotion: emotion,
      });
    };

    img.src = URL.createObjectURL(file);
  });
}

// =============================================================================
// Keyword Sentiment Analysis
// =============================================================================
function analyzeKeywordSentiment(keywords: string): number {
  const words = keywords.toLowerCase().split(/[,\s]+/).filter(Boolean);

  // Very Positive: Strong emotional intensity
  const veryPositiveWords = new Set([
    'ecstatic', 'euphoric', 'blissful', 'extraordinary', 'unforgettable',
    'once-in-a-lifetime', 'mind-blowing', 'phenomenal', 'transcendent',
    'divine', 'heavenly', 'sublime', 'magnificent', 'glorious', 'awe-inspiring',
    'mind-expanding', 'life-changing', 'life-altering', 'surreal', 'magical',
    'enchanting', 'mesmerizing', 'spellbinding', 'breathtaking',
  ]);

  // Positive: Strong positive emotions
  const positiveWords = new Set([
    'amazing', 'beautiful', 'wonderful', 'joy', 'happy', 'excited', 'love',
    'dream', 'perfect', 'awesome', 'incredible', 'fantastic', 'peaceful',
    'serene', 'stunning', 'delightful', 'wonderful', 'lovely', 'charming',
    'exquisite', 'marvelous', 'splendid', 'excellent', 'superb', 'outstanding',
    'remarkable', 'unforgettable', 'memorable', 'captivating', 'enchanted',
    'enamored', 'elated', 'thrilled', 'overjoyed', 'blessed', 'grateful',
    'content', 'blissful', 'joyful', 'radiant', 'vibrant', 'alive', 'energy',
    'inspired', 'uplifted', 'enlightened', 'awakened', 'connected', 'united',
    'grateful', 'abundant', 'rich', 'full', 'complete', 'whole',
  ]);

  // Moderate: Mild positive
  const moderateWords = new Set([
    'nice', 'good', 'pleasant', 'okay', 'fine', 'decent', 'alright',
    'enjoyable', 'comfortable', 'relaxing', 'calming', 'soothing', 'gentle',
    'soft', 'quiet', 'still', 'peaceful', 'restful', 'restorative',
    'interesting', 'intriguing', 'curious', 'engaging', 'inviting',
  ]);

  // Negative: Mild to moderate negative
  const negativeWords = new Set([
    'sad', 'disappointed', 'boring', 'crowded', 'rushed', 'stressful',
    'tired', 'frustrated', 'difficult', 'overwhelming', 'anxious',
    'uncomfortable', 'unsettling', 'strange', 'odd', 'awkward', 'tense',
    'hectic', 'chaotic', 'messy', 'ugly', 'draining', 'exhausting',
    'annoyed', 'irritated', 'upset', 'confused', 'lost', 'alone',
    'empty', 'hollow', 'numb', 'blank', 'gray', 'dull', 'flat',
  ]);

  // Very Negative: Strong negative emotions
  const veryNegativeWords = new Set([
    'terrible', 'horrible', 'awful', 'dreadful', 'miserable', 'depressing',
    'agonizing', 'heartbreaking', 'devastating', 'traumatic', 'painful',
    'torturous', 'nightmarish', 'hellish', 'dark', 'grim', 'bleak',
  ]);

  let sentimentScore = 0.5;

  for (const word of words) {
    if (veryPositiveWords.has(word)) {
      sentimentScore += 0.15;
    } else if (positiveWords.has(word)) {
      sentimentScore += 0.1;
    } else if (moderateWords.has(word)) {
      sentimentScore += 0.05;
    } else if (negativeWords.has(word)) {
      sentimentScore -= 0.1;
    } else if (veryNegativeWords.has(word)) {
      sentimentScore -= 0.15;
    }
  }

  return Math.max(0, Math.min(1, sentimentScore));
}

// =============================================================================
// Combined Sentiment Recommendation
// =============================================================================
function calculateRecommendedSentiment(
  photos: ExtractedPhotoData[],
  keywords: string
): { value: number; confidence: 'high' | 'medium' | 'low'; sources: string[] } {
  const sources: string[] = [];
  let totalSentiment = 0;
  let componentCount = 0;

  if (photos.length > 0) {
    const photoEmotions = photos
      .map(p => p.localAnalysis.basic_emotion)
      .filter(Boolean);

    if (photoEmotions.length > 0) {
      const emotionScores = photoEmotions.map(emotion => {
        switch (emotion) {
          case 'joy': return 0.85;
          case 'awe': return 0.75;
          case 'serenity': return 0.55;
          case 'nostalgia': return 0.45;
          default: return 0.5;
        }
      });

      const avgPhotoSentiment = emotionScores.reduce((a, b) => a + b, 0) / emotionScores.length;
      totalSentiment += avgPhotoSentiment;
      componentCount++;
      sources.push('photos');
    }
  }

  if (keywords.trim()) {
    const keywordSentiment = analyzeKeywordSentiment(keywords);
    totalSentiment += keywordSentiment;
    componentCount++;
    sources.push('keywords');
  }

  const recommendedValue = componentCount > 0
    ? totalSentiment / componentCount
    : 0.5;

  const confidence = componentCount >= 2
    ? 'high'
    : componentCount === 1
    ? 'medium'
    : 'low';

  return {
    value: Math.max(0, Math.min(1, recommendedValue)),
    confidence,
    sources,
  };
}

// =============================================================================
// Impact Preview - Shows how emotional intensity affects transcendence score
// =============================================================================
function getTranscendenceImpact(emotionalIntensity: number): {
  score: number;
  level: string;
  description: string;
} {
  // Transcendence score calculation (simplified):
  // emotion_intensity: 25% weight (0.25)
  // atmosphere_quality: 15% (0.15)
  // novelty_factor: 15% (0.15)
  // fame_score: 10% (0.10)
  // weather_match: 10% (0.10)
  // companion_engagement: 10% (0.10)
  // intent_match: 10% (0.10)
  // surprise_factor: 5% (0.05)

  // Assume average scores for other factors
  const otherFactorsAverage = 0.5; // Conservative estimate (50%)
  const emotionContribution = emotionalIntensity * 0.25; // 25% weight
  const otherFactorsContribution = otherFactorsAverage * 0.75; // 75% combined weight
  const totalScore = (emotionContribution + otherFactorsContribution) * 10; // Scale to 0-10

  let level = '';
  let description = '';

  if (totalScore >= 8.5) {
    level = 'Transcendent';
    description = 'A once-in-a-lifetime memory that will be cherished forever';
  } else if (totalScore >= 7.5) {
    level = 'Exceptional';
    description = 'An extraordinary experience worth reliving again and again';
  } else if (totalScore >= 6.5) {
    level = 'Memorable';
    description = 'A wonderful moment that stands out from everyday experiences';
  } else if (totalScore >= 5.5) {
    level = 'Meaningful';
    description = 'A pleasant experience with emotional depth and significance';
  } else if (totalScore >= 4.5) {
    level = 'Notable';
    description = 'A worthy moment that adds value to your journey';
  } else if (totalScore >= 3.5) {
    level = 'Interesting';
    description = 'A nice experience that captures a moment in time';
  } else {
    level = 'Reflective';
    description = 'A quiet moment worth preserving for later reflection';
  }

  return {
    score: Math.round(totalScore * 10) / 10,
    level,
    description,
  };
}

// =============================================================================
// Intensity Guidance
// =============================================================================
function getIntensityGuidance(intensity: number): {
  label: string;
  example: string;
  tone: string;
} {
  if (intensity >= 0.8) {
    return {
      label: 'Very High Intensity',
      example: 'Perfect for: Skydiving, proposal, dream destination, once-in-a-lifetime moment',
      tone: 'Your story will be told in an exhilarating, vivid voice with dramatic language',
    };
  }

  if (intensity >= 0.6) {
    return {
      label: 'High Intensity',
      example: 'Great for: Exciting discovery, amazing meal, breathtaking view',
      tone: 'Your story will be enthusiastic and expressive',
    };
  }

  if (intensity >= 0.4) {
    return {
      label: 'Moderate Intensity',
      example: 'Ideal for: Pleasant experience, nice walk, enjoyable sightseeing',
      tone: 'Your story will be warm and appreciative',
    };
  }

  if (intensity >= 0.2) {
    return {
      label: 'Low Intensity',
      example: 'Good for: Quiet reflection, peaceful moment, gentle observation',
      tone: 'Your story will be calm and contemplative',
    };
  }

  return {
    label: 'Very Low Intensity',
    example: 'Appropriate for: Somber memorial, quiet contemplation, subtle moment',
    tone: 'Your story will be gentle and reflective',
  };
}

// =============================================================================
// Component
// =============================================================================

interface SensoryAgentUIProps {
  onMomentCreated?: (moment: MomentSense) => void;
}

export default function SensoryAgentUI({ onMomentCreated }: SensoryAgentUIProps) {
  const [state, setState] = useState<ProcessingState>('idle');
  const [moment, setMoment] = useState<MomentSense | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [photos, setPhotos] = useState<ExtractedPhotoData[]>([]);
  const [isProcessingPhotos, setIsProcessingPhotos] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [venueName, setVenueName] = useState('');
  const [voiceSentiment, setVoiceSentiment] = useState(0.5);
  const [voiceKeywords, setVoiceKeywords] = useState('');
  const [extractedCoordinates, setExtractedCoordinates] = useState<{ lat: number; lon: number } | null>(null);
  const [recommendedSentiment, setRecommendedSentiment] = useState<{
    value: number;
    confidence: 'high' | 'medium' | 'low';
    sources: string[];
  } | null>(null);

  // Recalculate sentiment recommendation when photos or keywords change
  useEffect(() => {
    const recommendation = calculateRecommendedSentiment(photos, voiceKeywords);
    setRecommendedSentiment(recommendation);

    // Auto-populate slider only if high/medium confidence
    if (recommendation.confidence !== 'low') {
      setVoiceSentiment(recommendation.value);
    }
  }, [photos, voiceKeywords]);

  // Handle photo selection
  const handlePhotoSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessingPhotos(true);
    trackEvent('photos_selected', { count: files.length });

    const newPhotos: ExtractedPhotoData[] = [];
    let firstCoordinates: { lat: number; lon: number } | null = null;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;

      const previewUrl = URL.createObjectURL(file);
      const exifData = await extractExifData(file);
      const localAnalysis = await analyzeImageLocally(file);

      if (!firstCoordinates && exifData.coordinates) {
        firstCoordinates = exifData.coordinates;
      }

      newPhotos.push({
        file,
        previewUrl,
        timestamp: exifData.timestamp,
        coordinates: exifData.coordinates,
        localAnalysis,
      });
    }

    setPhotos((prev) => [...prev, ...newPhotos]);
    if (firstCoordinates && !extractedCoordinates) {
      setExtractedCoordinates(firstCoordinates);
    }
    setIsProcessingPhotos(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [extractedCoordinates]);

  // Remove a photo
  const handleRemovePhoto = useCallback((index: number) => {
    setPhotos((prev) => {
      const newPhotos = [...prev];
      URL.revokeObjectURL(newPhotos[index].previewUrl);
      newPhotos.splice(index, 1);
      return newPhotos;
    });
  }, []);

  const handleSynthesize = useCallback(async () => {
    if (!venueName.trim()) {
      setError('Please enter a venue name');
      return;
    }

    if (photos.length === 0) {
      setError('Please add at least one photo');
      return;
    }

    setState('processing');
    setError(null);
    setMoment(null);

    const sessionId = getOrCreateSessionId();
    trackEvent('sensory_synthesis_started', { venue: venueName, photoCount: photos.length });

    try {
      const photoRefs: PhotoReference[] = photos.map((photo, index) => ({
        local_id: `web-${index}`,
        captured_at: photo.timestamp,
        location_extracted: !!photo.coordinates,
        local_analysis: {
          scene_type: photo.localAnalysis.scene_type,
          lighting: null,
          indoor_outdoor: null,
          face_count: photo.localAnalysis.face_count,
          crowd_level: null,
          energy_level: null,
          basic_emotion: photo.localAnalysis.basic_emotion,
        },
      }));

      const venueCoords = extractedCoordinates || undefined;

      const input: SensoryInput = {
        photos: {
          count: photos.length,
          refs: photoRefs,
        },
        audio: voiceKeywords.trim()
          ? {
              duration_seconds: 15,
              recorded_at: new Date().toISOString(),
              transcript: null,
              sentiment_score: voiceSentiment,
              sentiment_keywords: voiceKeywords.split(',').map(k => k.trim()).filter(Boolean),
            }
          : null,
        venue: {
          name: venueName,
          coordinates: venueCoords,
        },
        companions: [],
        captured_at: photos[0]?.timestamp || new Date().toISOString(),
        detection: {
          trigger: 'manual',
          confidence: 1.0,
          signals: ['user_initiated'],
        },
        preferences: {
          enable_cloud_synthesis: true,
          include_companion_insights: true,
        },
      };

      const response = await fetch('/api/synthesize-sense', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-ID': sessionId,
        },
        body: JSON.stringify(input),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Synthesis failed');
      }

      setMoment(data.moment);
      setState('success');
      trackEvent('sensory_synthesis_success', {
        venue: venueName,
        transcendence_score: data.moment.transcendence_score,
      });

      if (onMomentCreated) {
        onMomentCreated(data.moment);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      setState('error');
      trackEvent('sensory_synthesis_error', { error: message });
    }
  }, [venueName, photos, extractedCoordinates, voiceSentiment, voiceKeywords, onMomentCreated]);

  const handleReset = useCallback(() => {
    setState('idle');
    setMoment(null);
    setError(null);
    setVenueName('');
    photos.forEach((photo) => URL.revokeObjectURL(photo.previewUrl));
    setPhotos([]);
    setExtractedCoordinates(null);
    setVoiceSentiment(0.5);
    setVoiceKeywords('');
  }, [photos]);

  // =============================================================================
  // Render
  // =============================================================================

  return (
    <div style={{ position: 'relative', minHeight: '100vh', background: THEME.background }}>
      {/* Radial overlay glow (atmospheric depth) */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(ellipse at 30% 20%, rgba(139, 115, 85, 0.08) 0%, transparent 50%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Ambient particles */}
      <Particles />

      {/* Header with Quinn branding */}
      <header
        style={{
          padding: `${SPACING.lg} ${SPACING.xl}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'relative',
          zIndex: 10,
        }}
      >
        <div
          style={{
            fontSize: '20px',
            fontWeight: 300,
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color: '#c4b8a8',
          }}
        >
          Quinn
        </div>
        <div style={{ fontSize: '12px', color: THEME.gold[600], letterSpacing: '0.1em' }}>
          Sensory Engine
        </div>
      </header>

      {/* Main Content */}
      {state === 'idle' ? (
        <main className="input-container" style={{ position: 'relative', zIndex: 10 }}>
          {/* Hero Section */}
          <div style={{ marginBottom: '60px', textAlign: 'center' }}>
            <h1
              style={{
                fontSize: '48px',
                fontWeight: 300,
                lineHeight: 1.2,
                marginBottom: '24px',
                letterSpacing: '-0.02em',
                color: THEME.gold.text,
              }}
            >
              Capture moments.
              <br />
              <span style={{ color: THEME.gold[600] }}>We'll transform them into memories.</span>
            </h1>
            <p
              style={{
                fontSize: '18px',
                fontWeight: 300,
                color: THEME.gold[600],
                maxWidth: '520px',
                margin: '0 auto',
                lineHeight: 1.7,
              }}
            >
              Upload photos, share what you felt, and let Quinn synthesize your moment into an emotional narrative enriched with sensory details.
            </p>
          </div>

          {/* Input Card */}
          <Card variant="default" style={{ maxWidth: '640px', margin: '0 auto' }}>
            {/* Venue Name */}
            <div style={{ marginBottom: SPACING.lg }}>
              <Input
                label="Venue Name"
                placeholder="e.g., Senso-ji Temple, Eiffel Tower"
                value={venueName}
                onChange={(e) => setVenueName(e.target.value)}
                error={error && !venueName.trim() ? error : undefined}
              />
            </div>

            {/* Photo Upload */}
            <div style={{ marginBottom: SPACING.lg }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: THEME.gold.text,
                  marginBottom: SPACING.sm,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                }}
              >
                Moment {photos.length > 0 && <span style={{ opacity: 0.6 }}>({photos.length})</span>}
              </label>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoSelect}
                style={{ display: 'none' }}
              />

              <Button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessingPhotos}
                variant="secondary"
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  border: `2px dashed ${THEME.gold[300]}`,
                  paddingTop: SPACING.xl,
                  paddingBottom: SPACING.xl,
                }}
              >
                {isProcessingPhotos ? '📸 Processing...' : `${photos.length === 0 ? '📷 Add Photos' : '📷 Add More'}`}
              </Button>

              {/* Photo Thumbnails */}
              {photos.length > 0 && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
                    gap: SPACING.md,
                    marginTop: SPACING.lg,
                  }}
                >
                  {photos.map((photo, index) => (
                    <div
                      key={index}
                      style={{
                        position: 'relative',
                        aspectRatio: '1',
                        borderRadius: BORDER_RADIUS.md,
                        overflow: 'hidden',
                        border: `1px solid ${THEME.gold[200]}`,
                        backgroundColor: THEME.gold[50],
                      }}
                    >
                      <img
                        src={photo.previewUrl}
                        alt={`Photo ${index + 1}`}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                      <button
                        onClick={() => handleRemovePhoto(index)}
                        style={{
                          position: 'absolute',
                          top: SPACING.xs,
                          right: SPACING.xs,
                          background: 'rgba(220, 38, 38, 0.8)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '50%',
                          width: '24px',
                          height: '24px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          fontWeight: 'bold',
                        }}
                        title="Remove photo"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Divider />

            {/* Voice Notes */}
            <div style={{ marginBottom: SPACING.lg }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: THEME.gold.text,
                  marginBottom: SPACING.sm,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                }}
              >
                What You Felt
              </label>
              <textarea
                value={voiceKeywords}
                onChange={(e) => setVoiceKeywords(e.target.value)}
                placeholder="Describe the moment, emotions, sensations in your own words..."
                style={{
                  width: '100%',
                  minHeight: '100px',
                  padding: SPACING.md,
                  fontSize: '14px',
                  border: `1px solid ${THEME.gold[300]}`,
                  borderRadius: BORDER_RADIUS.md,
                  background: 'transparent',
                  color: THEME.gold.text,
                  outline: 'none',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                }}
              />
              <p
                style={{
                  fontSize: '12px',
                  color: THEME.gold[600],
                  marginTop: SPACING.sm,
                }}
              >
                💭 Your notes stay on device. Used to enhance emotional synthesis.
              </p>
            </div>

            {/* Sentiment */}
            <div style={{ marginBottom: SPACING.lg }}>
              {/* Recommendation Badge */}
              {recommendedSentiment && recommendedSentiment.confidence !== 'low' && (
                <div style={{ marginBottom: SPACING.md, display: 'flex', alignItems: 'center', gap: SPACING.sm }}>
                  <Pill color="green" icon="✨">
                    Recommended: {Math.round(recommendedSentiment.value * 100)}%
                  </Pill>
                  <span style={{ fontSize: '11px', color: THEME.gold[600] }}>
                    Based on {recommendedSentiment.sources.join(' + ')}
                    {recommendedSentiment.confidence === 'high' && ' (high confidence)'}
                  </span>
                </div>
              )}

              {/* Slider Label */}
              <label
                style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: THEME.gold.text,
                  marginBottom: SPACING.sm,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                }}
              >
                Emotional Intensity: {Math.round(voiceSentiment * 100)}%
              </label>

              {/* Slider */}
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={voiceSentiment}
                onChange={(e) => setVoiceSentiment(parseFloat(e.target.value))}
                style={{
                  width: '100%',
                  height: '6px',
                  borderRadius: BORDER_RADIUS.lg,
                  background: `linear-gradient(to right, ${THEME.gold[200]}, ${THEME.green[500]})`,
                  outline: 'none',
                  WebkitAppearance: 'none',
                }}
              />

              {/* Guidance Card */}
              <div
                style={{
                  marginTop: SPACING.md,
                  padding: SPACING.md,
                  background: THEME.gold[50],
                  borderRadius: BORDER_RADIUS.md,
                  border: `1px solid ${THEME.gold[200]}`,
                }}
              >
                <p
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: THEME.gold.text,
                    marginBottom: SPACING.xs,
                    margin: 0,
                  }}
                >
                  {getIntensityGuidance(voiceSentiment).label}
                </p>
                <p
                  style={{
                    fontSize: '11px',
                    color: THEME.gold[600],
                    marginBottom: SPACING.xs,
                    lineHeight: 1.5,
                    margin: `${SPACING.xs} 0`,
                  }}
                >
                  <strong>Best for:</strong> {getIntensityGuidance(voiceSentiment).example}
                </p>
                <p
                  style={{
                    fontSize: '11px',
                    color: THEME.gold[500],
                    fontStyle: 'italic',
                    lineHeight: 1.5,
                    margin: `${SPACING.xs} 0 0 0`,
                  }}
                >
                  {getIntensityGuidance(voiceSentiment).tone}
                </p>
              </div>

              {/* Impact Preview - Shows transcendence score effect */}
              <div
                style={{
                  marginTop: SPACING.md,
                  padding: SPACING.md,
                  background: `linear-gradient(135deg, ${THEME.green[100]} 0%, rgba(90, 138, 106, 0.05) 100%)`,
                  borderRadius: BORDER_RADIUS.md,
                  border: `1px solid ${THEME.green[300]}`,
                }}
              >
                <p
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: THEME.green.text,
                    marginBottom: SPACING.xs,
                    margin: 0,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  💫 Transcendence Impact
                </p>

                <div style={{ marginTop: SPACING.sm }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: SPACING.xs }}>
                    <span style={{ fontSize: '16px', fontWeight: 600, color: THEME.green.text }}>
                      {getTranscendenceImpact(voiceSentiment).score}/10
                    </span>
                    <span style={{ fontSize: '11px', color: THEME.green.text }}>
                      {getTranscendenceImpact(voiceSentiment).level}
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: '10px',
                      color: THEME.green.text,
                      lineHeight: 1.4,
                      margin: `${SPACING.xs} 0 0 0`,
                    }}
                  >
                    {getTranscendenceImpact(voiceSentiment).description}
                  </p>
                </div>

                <div style={{ marginTop: SPACING.sm, fontSize: '10px', color: 'rgba(90, 138, 106, 0.6)' }}>
                  <strong>Note:</strong> Score assumes average quality for photos, atmosphere, and venue. Actual score increases with better photos and more unique venues.
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div
                style={{
                  padding: SPACING.lg,
                  background: 'rgba(220, 38, 38, 0.1)',
                  border: `1px solid rgba(220, 38, 38, 0.5)`,
                  borderRadius: BORDER_RADIUS.md,
                  color: '#fca5a5',
                  fontSize: '14px',
                  marginBottom: SPACING.lg,
                }}
              >
                {error}
              </div>
            )}

            {/* Submit Button */}
            <Button
              onClick={handleSynthesize}
              variant="primary"
              size="lg"
              style={{ width: '100%', marginTop: SPACING.lg }}
            >
              ✨ Synthesize Memory
            </Button>
          </Card>

          {/* Footer text */}
          <div
            style={{
              textAlign: 'center',
              marginTop: '80px',
              paddingBottom: '40px',
              fontSize: '12px',
              color: THEME.gold[600],
              letterSpacing: '0.1em',
            }}
          >
            Part of the Quinn Travel Platform
          </div>
        </main>
      ) : null}

      {/* Processing State */}
      {state === 'processing' && (
        <main className="results-container" style={{ position: 'relative', zIndex: 10 }}>
          <Card variant="highlight">
            <LoadingState message="Synthesizing your moment into a memory..." />
          </Card>
        </main>
      )}

      {/* Success State */}
      {state === 'success' && moment && (
        <main className="results-container" style={{ position: 'relative', zIndex: 10 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.lg }}>
            {/* Primary Emotion */}
            <Card variant="success">
              <div
                style={{
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: SPACING.md,
                }}
              >
                <h2
                  style={{
                    fontSize: '40px',
                    fontWeight: 700,
                    color: THEME.green.text,
                    marginBottom: SPACING.sm,
                  }}
                >
                  {moment.primary_emotion}
                </h2>
                <div style={{ display: 'flex', gap: SPACING.sm, flexWrap: 'wrap', justifyContent: 'center' }}>
                  <Pill color="green">Transcendence Score: {moment.transcendence_score.toFixed(1)}/10</Pill>
                </div>
              </div>
            </Card>

            {/* Emotional Arc */}
            <Card>
              <h3
                style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: THEME.gold.text,
                  marginBottom: SPACING.lg,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                }}
              >
                Emotional Arc
              </h3>
              <div style={{ display: 'flex', gap: SPACING.sm, flexWrap: 'wrap' }}>
                {moment.emotion_tags.map((emotion, i) => (
                  <EmotionTag key={i} emotion={emotion} />
                ))}
              </div>
            </Card>

            {/* Narrative */}
            <Card>
              <h3
                style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: THEME.gold.text,
                  marginBottom: SPACING.lg,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                }}
              >
                Your Story
              </h3>
              <p
                style={{
                  fontSize: '15px',
                  lineHeight: '1.7',
                  color: THEME.gold[500],
                  fontStyle: 'italic',
                }}
              >
                "{moment.narratives.full}"
              </p>
            </Card>

            {/* Memory Anchors */}
            {moment.memory_anchors && (
              <Card>
                <h3
                  style={{
                    fontSize: '16px',
                    fontWeight: 600,
                    color: THEME.gold.text,
                    marginBottom: SPACING.lg,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                  }}
                >
                  Memory Anchors
                </h3>
                <ul
                  style={{
                    listStyle: 'none',
                    padding: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: SPACING.md,
                  }}
                >
                  {moment.memory_anchors.sensory_anchor && (
                    <li
                      style={{
                        paddingLeft: SPACING.lg,
                        position: 'relative',
                        color: THEME.gold[500],
                        fontSize: '14px',
                      }}
                    >
                      <span
                        style={{
                          position: 'absolute',
                          left: 0,
                          color: THEME.green[500],
                          fontWeight: 'bold',
                        }}
                      >
                        •
                      </span>
                      {moment.memory_anchors.sensory_anchor}
                    </li>
                  )}
                  {moment.memory_anchors.emotional_anchor && (
                    <li
                      style={{
                        paddingLeft: SPACING.lg,
                        position: 'relative',
                        color: THEME.gold[500],
                        fontSize: '14px',
                      }}
                    >
                      <span
                        style={{
                          position: 'absolute',
                          left: 0,
                          color: THEME.green[500],
                          fontWeight: 'bold',
                        }}
                      >
                        •
                      </span>
                      {moment.memory_anchors.emotional_anchor}
                    </li>
                  )}
                  {moment.memory_anchors.unexpected_anchor && (
                    <li
                      style={{
                        paddingLeft: SPACING.lg,
                        position: 'relative',
                        color: THEME.gold[500],
                        fontSize: '14px',
                      }}
                    >
                      <span
                        style={{
                          position: 'absolute',
                          left: 0,
                          color: THEME.green[500],
                          fontWeight: 'bold',
                        }}
                      >
                        •
                      </span>
                      {moment.memory_anchors.unexpected_anchor}
                    </li>
                  )}
                </ul>
              </Card>
            )}

            {/* Sensory Details */}
            {moment.sensory_details && (
              <Card>
                <h3
                  style={{
                    fontSize: '16px',
                    fontWeight: 600,
                    color: THEME.gold.text,
                    marginBottom: SPACING.lg,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                  }}
                >
                  Sensory Details
                </h3>
                <ul
                  style={{
                    listStyle: 'none',
                    padding: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: SPACING.md,
                  }}
                >
                  {moment.sensory_details.visual && (
                    <li
                      style={{
                        paddingLeft: SPACING.lg,
                        position: 'relative',
                        color: THEME.gold[500],
                        fontSize: '14px',
                      }}
                    >
                      <span
                        style={{
                          position: 'absolute',
                          left: 0,
                          color: THEME.green[500],
                          fontWeight: 'bold',
                        }}
                      >
                        ◆
                      </span>
                      {moment.sensory_details.visual}
                    </li>
                  )}
                  {moment.sensory_details.audio && (
                    <li
                      style={{
                        paddingLeft: SPACING.lg,
                        position: 'relative',
                        color: THEME.gold[500],
                        fontSize: '14px',
                      }}
                    >
                      <span
                        style={{
                          position: 'absolute',
                          left: 0,
                          color: THEME.green[500],
                          fontWeight: 'bold',
                        }}
                      >
                        ◆
                      </span>
                      {moment.sensory_details.audio}
                    </li>
                  )}
                  {moment.sensory_details.scent && (
                    <li
                      style={{
                        paddingLeft: SPACING.lg,
                        position: 'relative',
                        color: THEME.gold[500],
                        fontSize: '14px',
                      }}
                    >
                      <span
                        style={{
                          position: 'absolute',
                          left: 0,
                          color: THEME.green[500],
                          fontWeight: 'bold',
                        }}
                      >
                        ◆
                      </span>
                      {moment.sensory_details.scent}
                    </li>
                  )}
                  {moment.sensory_details.tactile && (
                    <li
                      style={{
                        paddingLeft: SPACING.lg,
                        position: 'relative',
                        color: THEME.gold[500],
                        fontSize: '14px',
                      }}
                    >
                      <span
                        style={{
                          position: 'absolute',
                          left: 0,
                          color: THEME.green[500],
                          fontWeight: 'bold',
                        }}
                      >
                        ◆
                      </span>
                      {moment.sensory_details.tactile}
                    </li>
                  )}
                </ul>
              </Card>
            )}

            {/* Actions */}
            <div
              style={{
                display: 'flex',
                gap: SPACING.lg,
                marginTop: SPACING.xl,
              }}
            >
              <Button onClick={handleReset} variant="secondary" style={{ flex: 1 }}>
                Create Another Memory
              </Button>
            </div>

            {/* Footer */}
            <div
              style={{
                textAlign: 'center',
                marginTop: SPACING.xxl,
                paddingBottom: SPACING.xl,
                fontSize: '12px',
                color: THEME.gold[600],
                letterSpacing: '0.1em',
              }}
            >
              Part of the Quinn Travel Platform
            </div>
          </div>
        </main>
      )}

      {/* Error State */}
      {state === 'error' && (
        <main className="results-container" style={{ position: 'relative', zIndex: 10 }}>
          <Card variant="default">
            <div style={{ textAlign: 'center' }}>
              <h2
                style={{
                  fontSize: '20px',
                  fontWeight: 600,
                  color: '#fca5a5',
                  marginBottom: SPACING.lg,
                }}
              >
                Something went wrong
              </h2>
              <p
                style={{
                  color: THEME.gold[600],
                  marginBottom: SPACING.lg,
                  fontSize: '14px',
                }}
              >
                {error}
              </p>
              <Button onClick={handleReset} variant="primary">
                Try Again
              </Button>
            </div>
          </Card>
        </main>
      )}
    </div>
  );
}
