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

// Hash name to a deterministic gradient pair
function getGradientPair(name) {
  if (!name) return GRADIENT_PAIRS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return GRADIENT_PAIRS[Math.abs(hash) % GRADIENT_PAIRS.length];
}

// Extract initials from a full name
function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return parts[0][0].toUpperCase();
}

const NameAvatar = ({ name, size = 30, fontSize = 12, borderRadius = '50%', style }) => {
  const [color1, color2] = getGradientPair(name);
  const initials = getInitials(name);

  return (
    <div style={{
      width: size, height: size, borderRadius, flexShrink: 0,
      background: `linear-gradient(135deg, ${color1}, ${color2})`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize, fontWeight: 700, color: '#ffffff',
      boxShadow: `0 4px 12px ${color1}40`,
      ...style,
    }}>
      {initials}
    </div>
  );
};

export default NameAvatar;
