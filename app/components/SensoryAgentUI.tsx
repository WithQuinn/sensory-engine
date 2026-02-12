'use client';

import React, { useState, useCallback, useRef } from 'react';
import { trackEvent, getOrCreateSessionId } from '@/lib/telemetry';
import type { MomentSense, SensoryInput, PhotoReference } from '@/lib/sensoryValidation';

// =============================================================================
// EXIF Extraction (client-side only - photos never leave device)
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

async function extractExifData(file: File): Promise<{
  timestamp: string | null;
  coordinates: { lat: number; lon: number } | null;
}> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const view = new DataView(e.target?.result as ArrayBuffer);

      // Quick check for JPEG with EXIF
      if (view.getUint16(0) !== 0xFFD8) {
        resolve({ timestamp: null, coordinates: null });
        return;
      }

      // Simple EXIF parser - look for date and GPS tags
      // For production, use a library like exif-js
      // This is a minimal implementation for demo purposes
      let timestamp: string | null = null;
      const coordinates: { lat: number; lon: number } | null = null;

      // Use file's lastModified as fallback timestamp
      if (file.lastModified) {
        timestamp = new Date(file.lastModified).toISOString();
      }

      resolve({ timestamp, coordinates });
    };
    reader.onerror = () => resolve({ timestamp: null, coordinates: null });
    reader.readAsArrayBuffer(file.slice(0, 65536)); // Only read first 64KB for EXIF
  });
}

// Simple client-side image analysis (simulated - in production, use CoreML/TensorFlow.js)
async function analyzeImageLocally(_file: File): Promise<ExtractedPhotoData['localAnalysis']> {
  // In production iOS app, this would use CoreML/Vision framework
  // For web demo, return placeholder values
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
// Types
// =============================================================================

interface SensoryAgentUIProps {
  onMomentCreated?: (moment: MomentSense) => void;
}

type ProcessingState = 'idle' | 'processing' | 'success' | 'error';

// =============================================================================
// Theme (matching FactAgentUI)
// =============================================================================

const THEME = {
  gold: {
    50: 'rgba(200, 180, 160, 0.05)',
    100: 'rgba(200, 180, 160, 0.1)',
    200: 'rgba(200, 180, 160, 0.2)',
    300: 'rgba(200, 180, 160, 0.3)',
    500: 'rgba(200, 180, 160, 0.5)',
    600: 'rgba(200, 180, 160, 0.6)',
    text: '#e8e6e3',
  },
  green: {
    100: 'rgba(90, 138, 106, 0.15)',
    300: 'rgba(90, 138, 106, 0.3)',
    500: 'rgba(90, 138, 106, 0.5)',
    text: 'rgba(90, 138, 106, 0.9)',
  },
};

// =============================================================================
// Component
// =============================================================================

export default function SensoryAgentUI({ onMomentCreated }: SensoryAgentUIProps) {
  const [state, setState] = useState<ProcessingState>('idle');
  const [moment, setMoment] = useState<MomentSense | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Photo upload state
  const [photos, setPhotos] = useState<ExtractedPhotoData[]>([]);
  const [isProcessingPhotos, setIsProcessingPhotos] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
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

      // Create preview URL (stays in browser memory only)
      const previewUrl = URL.createObjectURL(file);

      // Extract EXIF data client-side
      const exifData = await extractExifData(file);

      // Run local image analysis
      const localAnalysis = await analyzeImageLocally(file);

      // Keep first valid coordinates for venue lookup
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

    // Clear input so same files can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [extractedCoordinates]);

  // Remove a photo
  const handleRemovePhoto = useCallback((index: number) => {
    setPhotos((prev) => {
      const newPhotos = [...prev];
      // Revoke object URL to free memory
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
      // Build photo refs with local analysis (photos themselves stay on device)
      const photoRefs: PhotoReference[] = photos.map((photo, index) => ({
        local_id: `web-${index}`, // Web uploads don't have PHAsset IDs
        captured_at: photo.timestamp,
        location_extracted: !!photo.coordinates,
        local_analysis: {
          scene_type: photo.localAnalysis.scene_type,
          lighting: null, // Would be populated by CoreML in iOS app
          indoor_outdoor: null, // Would be populated by CoreML in iOS app
          face_count: photo.localAnalysis.face_count,
          crowd_level: null, // Would be populated by CoreML in iOS app
          energy_level: null, // Would be populated by CoreML in iOS app
          basic_emotion: photo.localAnalysis.basic_emotion,
        },
      }));

      // Use extracted coordinates from EXIF, or manual input
      const venueCoords = extractedCoordinates || undefined;

      const input: SensoryInput = {
        photos: {
          count: photos.length,
          refs: photoRefs,
        },
        audio: voiceKeywords.trim() ? {
          duration_seconds: 15,
          recorded_at: new Date().toISOString(),
          transcript: null, // Never sent to cloud
          sentiment_score: voiceSentiment,
          sentiment_keywords: voiceKeywords.split(',').map(k => k.trim()).filter(Boolean),
        } : null,
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
    // Clean up photo object URLs before clearing
    photos.forEach((photo) => URL.revokeObjectURL(photo.previewUrl));
    setPhotos([]);
    setExtractedCoordinates(null);
    setVoiceSentiment(0.5);
    setVoiceKeywords('');
  }, [photos]);

  return (
    <div style={{
      maxWidth: '600px',
      margin: '0 auto',
      padding: '24px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      {/* Header */}
      <div style={{ marginBottom: '24px', textAlign: 'center' }}>
        <h1 style={{
          fontSize: '24px',
          fontWeight: 600,
          color: THEME.gold.text,
          marginBottom: '8px',
        }}>
          Sensory Agent
        </h1>
        <p style={{
          fontSize: '14px',
          color: THEME.gold[500],
        }}>
          Transform moments into memories
        </p>
      </div>

      {/* Input Form */}
      {state === 'idle' && (
        <div style={{
          background: THEME.gold[50],
          border: `1px solid ${THEME.gold[200]}`,
          borderRadius: '12px',
          padding: '20px',
        }}>
          {/* Venue Name */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 500,
              color: THEME.gold.text,
              marginBottom: '6px',
            }}>
              Venue Name
            </label>
            <input
              type="text"
              value={venueName}
              onChange={(e) => setVenueName(e.target.value)}
              placeholder="e.g., Senso-ji Temple"
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                border: `1px solid ${THEME.gold[300]}`,
                borderRadius: '8px',
                background: 'transparent',
                color: THEME.gold.text,
                outline: 'none',
              }}
            />
          </div>

          {/* Photo Upload */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 500,
              color: THEME.gold.text,
              marginBottom: '6px',
            }}>
              Photos {photos.length > 0 && `(${photos.length})`}
            </label>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoSelect}
              style={{ display: 'none' }}
            />

            {/* Upload button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessingPhotos}
              style={{
                width: '100%',
                padding: '16px',
                fontSize: '14px',
                fontWeight: 500,
                color: THEME.gold.text,
                background: 'transparent',
                border: `2px dashed ${THEME.gold[300]}`,
                borderRadius: '8px',
                cursor: isProcessingPhotos ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              {isProcessingPhotos ? (
                'Processing photos...'
              ) : (
                <>
                  <span style={{ fontSize: '20px' }}>📷</span>
                  {photos.length === 0 ? 'Add Photos' : 'Add More Photos'}
                </>
              )}
            </button>

            {/* Photo thumbnails */}
            {photos.length > 0 && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
                gap: '8px',
                marginTop: '12px',
              }}>
                {photos.map((photo, index) => (
                  <div
                    key={index}
                    style={{
                      position: 'relative',
                      aspectRatio: '1',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      border: `1px solid ${THEME.gold[300]}`,
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
                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(index)}
                      style={{
                        position: 'absolute',
                        top: '4px',
                        right: '4px',
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        border: 'none',
                        background: 'rgba(0,0,0,0.6)',
                        color: 'white',
                        fontSize: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      ×
                    </button>
                    {/* Show EXIF indicator if we got location/time */}
                    {(photo.coordinates || photo.timestamp) && (
                      <div style={{
                        position: 'absolute',
                        bottom: '4px',
                        left: '4px',
                        background: 'rgba(0,0,0,0.6)',
                        color: 'white',
                        fontSize: '10px',
                        padding: '2px 4px',
                        borderRadius: '4px',
                      }}>
                        {photo.coordinates ? '📍' : ''}
                        {photo.timestamp ? '🕐' : ''}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Privacy note about photos */}
            <p style={{
              fontSize: '11px',
              color: THEME.gold[500],
              marginTop: '8px',
              marginBottom: 0,
            }}>
              Photos stay on your device. Only metadata is sent for processing.
            </p>
          </div>

          {/* Voice Sentiment */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 500,
              color: THEME.gold.text,
              marginBottom: '6px',
            }}>
              Voice Sentiment: {voiceSentiment > 0.5 ? 'Positive' : voiceSentiment < 0.5 ? 'Negative' : 'Neutral'} ({voiceSentiment.toFixed(2)})
            </label>
            <input
              type="range"
              min="-1"
              max="1"
              step="0.1"
              value={voiceSentiment}
              onChange={(e) => setVoiceSentiment(parseFloat(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>

          {/* Keywords */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 500,
              color: THEME.gold.text,
              marginBottom: '6px',
            }}>
              Keywords (comma-separated)
            </label>
            <input
              type="text"
              value={voiceKeywords}
              onChange={(e) => setVoiceKeywords(e.target.value)}
              placeholder="e.g., Japan, dream, peaceful"
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                border: `1px solid ${THEME.gold[300]}`,
                borderRadius: '8px',
                background: 'transparent',
                color: THEME.gold.text,
                outline: 'none',
              }}
            />
          </div>

          {/* Privacy Notice */}
          <div style={{
            padding: '12px',
            background: THEME.green[100],
            borderRadius: '8px',
            marginBottom: '20px',
          }}>
            <p style={{
              fontSize: '12px',
              color: THEME.green.text,
              margin: 0,
            }}>
              Privacy: Only metadata is sent to the cloud. Your photos, audio, and transcript text never leave your device.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              padding: '12px',
              background: 'rgba(200, 100, 100, 0.1)',
              border: '1px solid rgba(200, 100, 100, 0.3)',
              borderRadius: '8px',
              marginBottom: '16px',
            }}>
              <p style={{ color: 'rgba(200, 100, 100, 0.9)', margin: 0, fontSize: '14px' }}>
                {error}
              </p>
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleSynthesize}
            style={{
              width: '100%',
              padding: '14px',
              fontSize: '16px',
              fontWeight: 600,
              color: '#1a1a1a',
              background: THEME.gold.text,
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            Synthesize Memory
          </button>
        </div>
      )}

      {/* Processing State */}
      {state === 'processing' && (
        <div style={{
          textAlign: 'center',
          padding: '40px 20px',
          background: THEME.gold[50],
          border: `1px solid ${THEME.gold[200]}`,
          borderRadius: '12px',
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: `3px solid ${THEME.gold[300]}`,
            borderTopColor: THEME.gold.text,
            borderRadius: '50%',
            margin: '0 auto 16px',
            animation: 'spin 1s linear infinite',
          }} />
          <p style={{ color: THEME.gold.text, margin: 0 }}>
            Synthesizing your memory...
          </p>
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}

      {/* Success State - Show Moment */}
      {state === 'success' && moment && (
        <div style={{
          background: THEME.gold[50],
          border: `1px solid ${THEME.gold[200]}`,
          borderRadius: '12px',
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            padding: '16px 20px',
            borderBottom: `1px solid ${THEME.gold[200]}`,
          }}>
            <h2 style={{
              fontSize: '18px',
              fontWeight: 600,
              color: THEME.gold.text,
              margin: 0,
            }}>
              {moment.venue_name}
            </h2>
            <p style={{
              fontSize: '14px',
              color: THEME.gold[500],
              margin: '4px 0 0',
            }}>
              {moment.primary_emotion} • Transcendence: {(moment.transcendence_score * 100).toFixed(0)}%
            </p>
          </div>

          {/* Narratives */}
          <div style={{ padding: '20px' }}>
            <h3 style={{
              fontSize: '14px',
              fontWeight: 600,
              color: THEME.gold[600],
              marginBottom: '8px',
            }}>
              Your Memory
            </h3>
            <p style={{
              fontSize: '16px',
              color: THEME.gold.text,
              lineHeight: 1.6,
              margin: 0,
            }}>
              {moment.narratives.medium}
            </p>
          </div>

          {/* Memory Anchors */}
          <div style={{
            padding: '16px 20px',
            borderTop: `1px solid ${THEME.gold[200]}`,
            background: THEME.gold[100],
          }}>
            <h3 style={{
              fontSize: '14px',
              fontWeight: 600,
              color: THEME.gold[600],
              marginBottom: '12px',
            }}>
              Memory Anchors
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {moment.memory_anchors.sensory_anchor && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{ color: THEME.gold[500] }}>Sensory:</span>
                  <span style={{ color: THEME.gold.text }}>{moment.memory_anchors.sensory_anchor}</span>
                </div>
              )}
              {moment.memory_anchors.emotional_anchor && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{ color: THEME.gold[500] }}>Emotional:</span>
                  <span style={{ color: THEME.gold.text }}>{moment.memory_anchors.emotional_anchor}</span>
                </div>
              )}
            </div>
          </div>

          {/* Excitement Hook */}
          {moment.excitement.excitement_hook && (
            <div style={{
              padding: '16px 20px',
              borderTop: `1px solid ${THEME.gold[200]}`,
              background: THEME.green[100],
            }}>
              <p style={{
                fontSize: '14px',
                color: THEME.green.text,
                margin: 0,
                fontStyle: 'italic',
              }}>
                {moment.excitement.excitement_hook}
              </p>
            </div>
          )}

          {/* Processing Info */}
          <div style={{
            padding: '12px 20px',
            borderTop: `1px solid ${THEME.gold[200]}`,
            background: THEME.gold[100],
          }}>
            <p style={{
              fontSize: '12px',
              color: THEME.gold[500],
              margin: 0,
            }}>
              {moment.processing.local_percentage}% local processing • {moment.processing.processing_time_ms}ms
            </p>
          </div>

          {/* Reset Button */}
          <div style={{ padding: '16px 20px' }}>
            <button
              onClick={handleReset}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '14px',
                fontWeight: 500,
                color: THEME.gold.text,
                background: 'transparent',
                border: `1px solid ${THEME.gold[300]}`,
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              Create Another Memory
            </button>
          </div>
        </div>
      )}

      {/* Error State */}
      {state === 'error' && (
        <div style={{
          textAlign: 'center',
          padding: '40px 20px',
          background: 'rgba(200, 100, 100, 0.05)',
          border: '1px solid rgba(200, 100, 100, 0.2)',
          borderRadius: '12px',
        }}>
          <p style={{ color: 'rgba(200, 100, 100, 0.9)', marginBottom: '16px' }}>
            {error || 'Something went wrong'}
          </p>
          <button
            onClick={handleReset}
            style={{
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: 500,
              color: THEME.gold.text,
              background: 'transparent',
              border: `1px solid ${THEME.gold[300]}`,
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
