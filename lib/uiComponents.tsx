/**
 * Reusable UI Components
 * Matches FactAgent visual patterns
 */

import React from 'react';
import { THEME, BORDER_RADIUS, SPACING } from './uiTheme';

// =============================================================================
// Button Component
// =============================================================================

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', isLoading = false, children, disabled, ...props }, ref) => {
    const sizeMap = {
      sm: { padding: `${SPACING.sm} ${SPACING.md}`, fontSize: '12px' },
      md: { padding: `${SPACING.md} ${SPACING.lg}`, fontSize: '14px' },
      lg: { padding: `${SPACING.lg} ${SPACING.xl}`, fontSize: '16px' },
    };

    const variantStyles = {
      primary: {
        background: THEME.green[500],
        color: '#fff',
        border: 'none',
      },
      secondary: {
        background: 'transparent',
        color: THEME.gold.text,
        border: `1px solid ${THEME.gold[300]}`,
      },
      danger: {
        background: 'rgba(220, 38, 38, 0.2)',
        color: '#fca5a5',
        border: `1px solid rgba(220, 38, 38, 0.5)`,
      },
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        style={{
          ...sizeMap[size],
          ...variantStyles[variant],
          borderRadius: BORDER_RADIUS.md,
          fontWeight: 500,
          cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
          opacity: disabled || isLoading ? 0.6 : 1,
          transition: 'all 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: SPACING.sm,
        }}
        {...props}
      >
        {isLoading && <span>⏳</span>}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

// =============================================================================
// Card Component
// =============================================================================

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'highlight' | 'success';
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ variant = 'default', children, style, ...props }, ref) => {
    const variantStyles = {
      default: {
        background: THEME.gold[50],
        border: `1px solid ${THEME.gold[200]}`,
      },
      highlight: {
        background: THEME.gold[100],
        border: `1px solid ${THEME.gold[300]}`,
      },
      success: {
        background: THEME.green[100],
        border: `1px solid ${THEME.green[300]}`,
      },
    };

    return (
      <div
        ref={ref}
        style={{
          ...variantStyles[variant],
          borderRadius: BORDER_RADIUS.lg,
          padding: SPACING.xl,
          ...style,
        }}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = 'Card';

// =============================================================================
// Pill / Badge Component
// =============================================================================

interface PillProps extends React.HTMLAttributes<HTMLSpanElement> {
  icon?: string;
  color?: 'gold' | 'green' | 'neutral';
}

export const Pill = React.forwardRef<HTMLSpanElement, PillProps>(
  ({ icon, color = 'neutral', children, ...props }, ref) => {
    const colorMap = {
      gold: { bg: THEME.gold[100], text: THEME.gold.text, border: THEME.gold[200] },
      green: { bg: THEME.green[100], text: THEME.green.text, border: THEME.green[300] },
      neutral: { bg: THEME.gold[50], text: THEME.gold[600], border: THEME.gold[200] },
    };

    const colors = colorMap[color];

    return (
      <span
        ref={ref}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: SPACING.sm,
          padding: `${SPACING.sm} ${SPACING.md}`,
          backgroundColor: colors.bg,
          color: colors.text,
          border: `1px solid ${colors.border}`,
          borderRadius: BORDER_RADIUS.xl,
          fontSize: '12px',
          fontWeight: 500,
          whiteSpace: 'nowrap',
        }}
        {...props}
      >
        {icon && <span>{icon}</span>}
        {children}
      </span>
    );
  }
);
Pill.displayName = 'Pill';

// =============================================================================
// Input Component
// =============================================================================

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, style, ...props }, ref) => {
    return (
      <div>
        {label && (
          <label
            style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: 500,
              color: THEME.gold.text,
              marginBottom: SPACING.sm,
            }}
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          style={{
            width: '100%',
            padding: SPACING.md,
            fontSize: '14px',
            border: `1px solid ${error ? '#dc2626' : THEME.gold[300]}`,
            borderRadius: BORDER_RADIUS.md,
            background: 'transparent',
            color: THEME.gold.text,
            outline: 'none',
            ...style,
          }}
          {...props}
        />
        {error && (
          <p
            style={{
              color: '#fca5a5',
              fontSize: '12px',
              marginTop: SPACING.xs,
            }}
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

// =============================================================================
// Loading State Component
// =============================================================================

interface LoadingStateProps {
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ message = 'Processing...' }) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: SPACING.xxl,
        gap: SPACING.lg,
      }}
    >
      <div
        style={{
          display: 'inline-block',
          width: '24px',
          height: '24px',
          border: `2px solid ${THEME.gold[300]}`,
          borderTop: `2px solid ${THEME.green[500]}`,
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }}
      />
      <p style={{ color: THEME.gold[600], fontSize: '14px' }}>{message}</p>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

// =============================================================================
// Emotion Tag Component (for sensory display)
// =============================================================================

interface EmotionTagProps {
  emotion: string;
  score?: number;
}

export const EmotionTag: React.FC<EmotionTagProps> = ({ emotion, score }) => {
  const getEmojiForEmotion = (e: string): string => {
    const map: Record<string, string> = {
      'Transcendence': '✨',
      'Awe': '🌅',
      'Joy': '😊',
      'Serenity': '🧘',
      'Adventure': '🏔️',
      'Connection': '💝',
      'Wonder': '🤩',
      'Peace': '☮️',
      'Energy': '⚡',
      'Nostalgia': '📸',
    };
    return map[e] || '💫';
  };

  return (
    <Pill
      color="green"
      icon={getEmojiForEmotion(emotion)}
      title={score ? `${emotion} (${score.toFixed(1)}/10)` : emotion}
    >
      {emotion}
      {score && <span style={{ opacity: 0.7, fontSize: '11px' }}> {score.toFixed(1)}</span>}
    </Pill>
  );
};

// =============================================================================
// Divider Component
// =============================================================================

export const Divider: React.FC = () => (
  <div
    style={{
      height: '1px',
      background: `linear-gradient(to right, transparent, ${THEME.gold[200]}, transparent)`,
      margin: `${SPACING.lg} 0`,
    }}
  />
);
