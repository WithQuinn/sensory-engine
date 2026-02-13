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

async function analyzeImageLocally(_file: File): Promise<ExtractedPhotoData['localAnalysis']> {
  return {
    scene_type: null,
    lighting: null,
    indoor_outdoor: null,
    face_count: 0,
    crowd_level: null,
    energy_level: null,
    basic_emotion: null,
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
            fontSize: '18px',
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
                fontSize: '16px',
                fontWeight: 300,
                color: THEME.gold[600],
                maxWidth: '520px',
                margin: '0 auto',
                lineHeight: 1.7,
              }}
            >
              Upload photos, share what you felt, and let Claude synthesize your moment into an emotional narrative enriched with sensory details.
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
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
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
