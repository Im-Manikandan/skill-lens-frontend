'use client';

import React, { useState } from 'react';

export default function Avatar({ src, name, size = 64, className = '' }) {
  // State
  const [imageError, setImageError] = useState(false);

  // Initials Derivation
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Background Color Generator
  const getBackgroundColor = (name) => {
    const colors = [
      'tw:bg-gray-500',
      'tw:bg-green-500',
      'tw:bg-purple-500',
      'tw:bg-pink-500',
      'tw:bg-indigo-500',
      'tw:bg-yellow-500',
      'tw:bg-red-500',
      'tw:bg-teal-500'
    ];

    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

    return colors[Math.abs(hash) % colors.length];
  };

  const bgColor = getBackgroundColor(name);

  // Image Avatar Render
  if (src && !imageError) {
    return (
      <div className={`tw:relative tw:overflow-hidden tw:rounded-full ${className}`} style={{ width: size, height: size }}>
        <img
          src={src}
          alt={`${name} profile`}
          className="tw:object-cover tw:absolute tw:inset-0 tw:w-full tw:h-full"
          onError={() => setImageError(true)}
        />
      </div>
    );
  }

  // Initials Fallback Render
  return (
    <div
      className={`tw:flex tw:items-center tw:justify-center tw:rounded-full ${bgColor} tw:text-white tw:font-semibold ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {initials}
    </div>
  );
}
