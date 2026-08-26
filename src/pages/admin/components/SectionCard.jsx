import React from 'react';
import { motion } from 'framer-motion';

/**
 * Standard section container card for config/detail pages.
 *
 * Props:
 *   children  — card content
 *   accent    — optional color string; when provided, uses a tinted bg/border
 *               instead of the default neutral glass style (e.g. '#f59e0b' for amber)
 *   delay     — framer-motion entrance delay (default 0.2)
 *   style     — additional inline styles merged onto the outer motion.div
 */
export default function SectionCard({ children, accent, delay = 0.2, style: extraStyle }) {
  const bg     = accent ? `rgba(${hexToRgb(accent)},0.05)` : 'rgba(255,255,255,0.02)';
  const border = accent ? `rgba(${hexToRgb(accent)},0.2)`  : 'rgba(255,255,255,0.07)';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      style={{
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: 14,
        padding: 20,
        ...extraStyle,
      }}
    >
      {children}
    </motion.div>
  );
}

/** Convert 6-digit hex to "r,g,b" for use in rgba(). */
function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `${r},${g},${b}`;
}
