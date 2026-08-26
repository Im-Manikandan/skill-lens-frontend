import React from 'react';
import { motion } from 'framer-motion';

/**
 * Standardised status banner for config/detail pages.
 *
 * Props:
 *   color      — text/icon color,  e.g. '#34d399'
 *   bg         — background,       e.g. 'rgba(52,211,153,0.06)'
 *   border     — border color,     e.g. 'rgba(52,211,153,0.2)'
 *   icon       — Lucide icon component
 *   iconSpin   — boolean, adds animate-spin class
 *   label      — bold status label string
 *   desc       — secondary description string
 *   children   — optional content below desc (e.g. progress bar)
 *   delay      — framer-motion entrance delay (default 0.1)
 */
export default function StatusBanner({
  color,
  bg,
  border,
  icon: Icon,
  iconSpin = false,
  label,
  desc,
  children,
  delay = 0.1,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      style={{
        borderRadius: 12,
        padding: '12px 16px',
        background: bg,
        border: `1px solid ${border}`,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
      }}
    >
      <Icon
        style={{ width: 18, height: 18, color, flexShrink: 0, marginTop: 2 }}
        className={iconSpin ? 'tw:animate-spin' : undefined}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ color, fontWeight: 600, fontSize: 14 }}>{label}</span>
        {desc && (
          <p style={{ color: '#9ca3af', fontSize: 13, margin: '2px 0 0' }}>{desc}</p>
        )}
        {children}
      </div>
    </motion.div>
  );
}
