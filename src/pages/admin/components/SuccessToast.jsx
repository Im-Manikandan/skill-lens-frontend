import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

/**
 * Dismissible success notification, styled to match the dark glass design system.
 * Replaces Reactstrap <Alert color="success"> and one-off inline success divs.
 *
 * Props:
 *   message  — string, shown when truthy
 *   onDismiss — callback to clear the message
 */
export default function SuccessToast({ message, onDismiss }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          style={{ overflow: 'hidden' }}
        >
          <div style={{
            borderRadius: 10,
            padding: '10px 14px',
            background: 'rgba(52,211,153,0.08)',
            border: '1px solid rgba(52,211,153,0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <CheckCircle2 style={{ width: 14, height: 14, color: '#34d399', flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: '#34d399', flex: 1 }}>{message}</span>
            {onDismiss && (
              <button
                onClick={onDismiss}
                style={{
                  marginLeft: 'auto', background: 'none', border: 'none',
                  color: '#6b7280', cursor: 'pointer', fontSize: 16, lineHeight: 1,
                  padding: '0 2px',
                }}
                aria-label="Dismiss"
              >
                ×
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
