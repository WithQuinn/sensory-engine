'use client';

import React, { useState } from 'react';
import { trackEvent } from '@/lib/telemetry';
import { THEME, SPACING, BORDER_RADIUS } from '@/lib/uiTheme';

interface NarrativeRatingPromptProps {
  momentId: string;
  onRated?: (rating: number) => void;
  onDismiss?: () => void;
}

export default function NarrativeRatingPrompt({
  momentId,
  onRated,
  onDismiss,
}: NarrativeRatingPromptProps) {
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [showThankYou, setShowThankYou] = useState(false);

  const handleRatingClick = (rating: number) => {
    setSelectedRating(rating);
    setShowThankYou(true);

    // Track the rating event
    trackEvent('narrative_rated', {
      moment_id: momentId,
      rating,
      timestamp: new Date().toISOString(),
    });

    // Notify parent component
    if (onRated) {
      onRated(rating);
    }

    // Auto-hide thank you message after 2 seconds
    setTimeout(() => {
      setShowThankYou(false);
    }, 2000);
  };

  const handleDismiss = () => {
    if (onDismiss) {
      onDismiss();
    }
  };

  // Don't render if already rated and thank you message is gone
  if (selectedRating !== null && !showThankYou) {
    return null;
  }

  return (
    <div
      style={{
        padding: SPACING.lg,
        background: THEME.gold[50],
        borderRadius: BORDER_RADIUS.md,
        border: `1px solid ${THEME.gold[200]}`,
      }}
    >
      {showThankYou ? (
        <div
          style={{
            textAlign: 'center',
            color: THEME.green.text,
            fontSize: '14px',
            fontWeight: 500,
            padding: `${SPACING.md} 0`,
          }}
        >
          Thank you for your feedback!
        </div>
      ) : (
        <>
          <div
            style={{
              fontSize: '14px',
              fontWeight: 600,
              color: THEME.gold.text,
              marginBottom: SPACING.md,
              textAlign: 'center',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}
          >
            How would you rate this narrative?
          </div>

          {/* Star Rating */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: SPACING.sm,
              marginBottom: SPACING.md,
            }}
          >
            {[1, 2, 3, 4, 5].map((rating) => {
              const isHovered = hoveredRating !== null && rating <= hoveredRating;
              const isSelected = selectedRating !== null && rating <= selectedRating;
              const isFilled = isHovered || isSelected;

              return (
                <button
                  key={rating}
                  onClick={() => handleRatingClick(rating)}
                  onMouseEnter={() => setHoveredRating(rating)}
                  onMouseLeave={() => setHoveredRating(null)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '32px',
                    padding: 0,
                    lineHeight: 1,
                    transition: 'transform 0.2s ease',
                    transform: isHovered ? 'scale(1.15)' : 'scale(1)',
                  }}
                  title={`${rating} star${rating > 1 ? 's' : ''}`}
                >
                  <span
                    style={{
                      color: isFilled ? '#D4AF37' : THEME.gold[300],
                    }}
                  >
                    {isFilled ? '★' : '☆'}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Skip/Dismiss Link */}
          <div style={{ textAlign: 'center' }}>
            <button
              onClick={handleDismiss}
              style={{
                background: 'transparent',
                border: 'none',
                color: THEME.gold[600],
                fontSize: '12px',
                cursor: 'pointer',
                textDecoration: 'underline',
                padding: `${SPACING.xs} ${SPACING.sm}`,
              }}
            >
              Skip
            </button>
          </div>
        </>
      )}
    </div>
  );
}
