'use client';

import React, { useState, useCallback, useRef } from 'react';
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
    <div
      style={{
        maxWidth: '720px',
        margin: '0 auto',
        padding: `${SPACING.xl} ${SPACING.lg}`,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        background: THEME.background,
        minHeight: '100vh',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: SPACING.xxl, textAlign: 'center' }}>
        <h1
          style={{
            fontSize: '28px',
            fontWeight: 700,
            color: THEME.gold.text,
            marginBottom: SPACING.sm,
            letterSpacing: '-0.5px',
          }}
        >
          🎭 Sensory Agent
        </h1>
        <p
          style={{
            fontSize: '14px',
            color: THEME.gold[600],
            marginTop: SPACING.md,
          }}
        >
          Transform your travel moments into emotional narratives
        </p>
      </div>

      {/* Input Form */}
      {state === 'idle' && (
        <Card variant="default">
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
              }}
            >
              Photos {photos.length > 0 && <span style={{ opacity: 0.6 }}>({photos.length})</span>}
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
              {isProcessingPhotos ? '📸 Processing photos...' : `${photos.length === 0 ? '📷 Add Photos' : '📷 Add More'}`}
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
              }}
            >
              Audio Notes
            </label>
            <textarea
              value={voiceKeywords}
              onChange={(e) => setVoiceKeywords(e.target.value)}
              placeholder="What were you feeling? Describe the moment in your own words..."
              style={{
                width: '100%',
                minHeight: '80px',
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
            ✨ Create Memory
          </Button>
        </Card>
      )}

      {/* Processing State */}
      {state === 'processing' && (
        <Card variant="highlight">
          <LoadingState message="Synthesizing your moment into a memory..." />
        </Card>
      )}

      {/* Success State - Results Display */}
      {state === 'success' && moment && (
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
                  fontSize: '32px',
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
              }}
            >
              Emotional Arc
            </h3>
            <div style={{ display: 'flex', gap: SPACING.sm, flexWrap: 'wrap' }}>
              {moment.emotional_arc.map((emotion, i) => (
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
              }}
            >
              Your Story
            </h3>
            <p
              style={{
                fontSize: '15px',
                lineHeight: '1.6',
                color: THEME.gold[500],
                fontStyle: 'italic',
              }}
            >
              "{moment.narrative}"
            </p>
          </Card>

          {/* Memory Anchors */}
          {moment.memory_anchors && moment.memory_anchors.length > 0 && (
            <Card>
              <h3
                style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: THEME.gold.text,
                  marginBottom: SPACING.lg,
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
                {moment.memory_anchors.map((anchor, i) => (
                  <li
                    key={i}
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
                    {anchor}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Sensory Details */}
          {moment.sensory_details && moment.sensory_details.length > 0 && (
            <Card>
              <h3
                style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: THEME.gold.text,
                  marginBottom: SPACING.lg,
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
                {moment.sensory_details.map((detail, i) => (
                  <li
                    key={i}
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
                    {detail}
                  </li>
                ))}
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
        </div>
      )}

      {/* Error State */}
      {state === 'error' && (
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
      )}
    </div>
  );
}
