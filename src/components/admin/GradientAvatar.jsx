import React from 'react';

// Gradient Color Pairs
const GRADIENT_PAIRS = [
  ['#818cf8', '#6366f1'],
  ['#34d399', '#10b981'],
  ['#f472b6', '#ec4899'],
  ['#fbbf24', '#f59e0b'],
  ['#60a5fa', '#3b82f6'],
  ['#a78bfa', '#8b5cf6'],
  ['#fb923c', '#f97316'],
  ['#2dd4bf', '#14b8a6'],
];

// Gradient Pair Selection Helper
export function getGradientPair(name) {
  if (!name) return GRADIENT_PAIRS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return GRADIENT_PAIRS[Math.abs(hash) % GRADIENT_PAIRS.length];
}

// Initials Helpers
function getInitial(name) {
  if (!name) return '?';
  return name.trim()[0].toUpperCase();
}

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return parts[0][0].toUpperCase();
}

// GradientAvatar Component
export default function GradientAvatar({
  name,
  src,
  doubleInitial = false,
  size = 48,
  borderRadius = 14,
  fontSize = 20,
  style: styleProp,
}) {
  // Derived Values
  const [color1, color2] = getGradientPair(name);
  const initials = doubleInitial ? getInitials(name) : getInitial(name);

  // Image Avatar Render
  if (src) {
    const imgSrc = src.startsWith('data:') ? src : `data:image/png;base64,${src}`;
    return (
      <div style={{
        width: size, height: size, borderRadius, flexShrink: 0,
        overflow: 'hidden',
        border: `1px solid ${color1}30`,
        boxShadow: `0 4px 12px ${color1}20`,
        ...styleProp,
      }}>
        <img
          src={imgSrc}
          alt={`${name} avatar`}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>
    );
  }

  // Initials Fallback Render
  return (
    <div style={{
      width: size, height: size, borderRadius, flexShrink: 0,
      background: `linear-gradient(135deg, ${color1}, ${color2})`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize, fontWeight: 700, color: '#ffffff',
      boxShadow: `0 4px 12px ${color1}40`,
      ...styleProp,
    }}>
      {initials}
    </div>
  );
}
