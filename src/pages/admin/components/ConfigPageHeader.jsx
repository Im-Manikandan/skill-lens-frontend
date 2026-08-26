import React from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

/**
 * Standard page header for admin config/detail pages.
 * Matches the sizing spec from Clients/Profiles (28px title, 14px subtitle, 24px icon).
 *
 * Props:
 *   icon        — Lucide icon component
 *   iconColor   — e.g. '#34d399'
 *   iconBg      — gradient string for badge background
 *   iconBorder  — border color string
 *   title       — page title string
 *   subtitle    — page subtitle string
 *   backLabel   — back button text (default 'Back')
 *   onBack      — override navigate(-1) if needed
 *   actions     — optional JSX slot for right-side action buttons
 *   accentColor — used in title gradient tail (default iconColor)
 */
export default function ConfigPageHeader({
  icon: Icon,
  iconColor,
  iconBg,
  iconBorder,
  title,
  subtitle,
  backLabel = 'Back',
  onBack,
  actions,
  accentColor,
}) {
  const navigate = useNavigate();
  const handleBack = onBack ?? (() => navigate(-1));
  const titleAccent = accentColor ?? iconColor;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <button
        onClick={handleBack}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#6b7280', fontSize: 13, padding: '0 0 12px 0',
        }}
      >
        <ArrowLeft style={{ width: 14, height: 14 }} />
        {backLabel}
      </button>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14, flexShrink: 0,
            background: iconBg,
            border: `1px solid ${iconBorder}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon style={{ width: 24, height: 24, color: iconColor }} />
          </div>
          <div>
            <h2 style={{
              fontSize: 28, fontWeight: 700, margin: 0,
              background: `linear-gradient(135deg, #ffffff 0%, #94a3b8 60%, ${titleAccent} 100%)`,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              {title}
            </h2>
            {subtitle && (
              <p style={{ color: '#6b7280', fontSize: 14, margin: '2px 0 0' }}>
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {actions && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {actions}
          </div>
        )}
      </div>
    </motion.div>
  );
}
