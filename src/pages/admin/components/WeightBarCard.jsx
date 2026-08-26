import React from 'react';
import { motion } from 'framer-motion';

/**
 * Animated weight / score bar card — used by both config pages.
 *
 * Props:
 *   label      — primary label string
 *   pct        — percentage (0–100), numeric
 *   color      — bar + percentage text color, e.g. '#34d399'
 *   subtitle   — optional secondary text below the label
 *   badge      — optional JSX or string shown as a tag next to the label
 *   index      — stagger index for entrance animation delay
 */
export default function WeightBarCard({ label, pct = 0, color = '#34d399', subtitle, badge, index = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.04 * index, ease: [0.22, 1, 0.36, 1] }}
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 12,
        padding: '12px 14px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{label}</span>
            {badge && badge}
          </div>
          {subtitle && (
            <p style={{ color: '#6b7280', fontSize: 12, margin: '2px 0 0', lineHeight: 1.4 }}>{subtitle}</p>
          )}
        </div>
        <span style={{ fontSize: 16, fontWeight: 700, color, flexShrink: 0 }}>{pct}%</span>
      </div>
      <div style={{
        height: 4, borderRadius: 4,
        background: 'rgba(255,255,255,0.07)',
        marginTop: 8, overflow: 'hidden',
      }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          style={{ height: '100%', borderRadius: 4, background: color }}
        />
      </div>
    </motion.div>
  );
}
