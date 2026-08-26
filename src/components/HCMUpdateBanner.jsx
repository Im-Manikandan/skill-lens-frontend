'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, X, CheckCircle, AlertCircle } from 'lucide-react';
import HCMConfigController from '../api/admin/hcm-config-controller.jsx';

const POLL_INTERVAL_MS = 5000;

/**
 * Slim banner anchored below the search bar that notifies users when
 * a background HCM recompute is in progress or has completed.
 *
 * Props:
 *   clientId          – current client (used to poll the status endpoint)
 *   onLoadLatestScores – called when user clicks "Load Latest Scores";
 *                        receives no arguments — caller handles the refresh
 */
export default function HCMUpdateBanner({ clientId, onLoadLatestScores }) {
  const [bannerState, setBannerState] = useState('hidden'); // hidden | running | done | error
  const [dismissed, setDismissed] = useState(false);
  const lastKnownVersionRef = useRef(null);
  const pollRef = useRef(null);

  // Ref tracks current bannerState so poll can read it without being in deps
  const bannerStateRef = useRef('hidden');
  useEffect(() => { bannerStateRef.current = bannerState; }, [bannerState]);

  // poll has no bannerState dep — reads via ref to keep the interval stable
  const poll = useCallback(async () => {
    if (!clientId) return;
    try {
      const data = await HCMConfigController.getRecomputeStatus(clientId);
      const { status, config_version } = data;

      if (status === 'running') {
        setDismissed(false);
        setBannerState('running');
        return;
      }

      if (status === 'done' && config_version !== null) {
        if (lastKnownVersionRef.current === null) {
          // First poll after page load — record baseline, don't show banner
          lastKnownVersionRef.current = config_version;
          return;
        }
        if (config_version > lastKnownVersionRef.current) {
          lastKnownVersionRef.current = config_version;
          setDismissed(false);
          setBannerState('done');
        }
        return;
      }

      if (status === 'error') {
        setBannerState('error');
        return;
      }

      // idle — clear stale running banner
      if (bannerStateRef.current === 'running') setBannerState('hidden');
    } catch {
      // Silent — don't surface polling errors to the user
    }
  }, [clientId]);

  useEffect(() => {
    if (!clientId) return;
    poll();
    pollRef.current = setInterval(poll, POLL_INTERVAL_MS);
    return () => clearInterval(pollRef.current);
  }, [clientId, poll]);

  const handleLoadLatestScores = () => {
    setBannerState('hidden');
    onLoadLatestScores?.();
  };

  const handleDismiss = () => setDismissed(true);

  const visible = !dismissed && bannerState !== 'hidden';

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="hcm-banner"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            padding: '10px 16px',
            borderRadius: 10,
            border: bannerState === 'done'
              ? '1px solid rgba(179,211,53,0.3)'
              : bannerState === 'error'
                ? '1px solid rgba(248,113,113,0.3)'
                : '1px solid rgba(167,139,250,0.3)',
            background: bannerState === 'done'
              ? 'rgba(179,211,53,0.07)'
              : bannerState === 'error'
                ? 'rgba(248,113,113,0.07)'
                : 'rgba(167,139,250,0.07)',
            marginBottom: 12,
          }}
        >
          {/* Left — icon + message */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
            {bannerState === 'running' && (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                style={{ flexShrink: 0 }}
              >
                <RefreshCw style={{ width: 16, height: 16, color: '#a78bfa' }} />
              </motion.div>
            )}
            {bannerState === 'done' && (
              <CheckCircle style={{ width: 16, height: 16, color: '#B3D335', flexShrink: 0 }} />
            )}
            {bannerState === 'error' && (
              <AlertCircle style={{ width: 16, height: 16, color: '#f87171', flexShrink: 0 }} />
            )}

            <div style={{ minWidth: 0 }}>
              {bannerState === 'running' && (
                <>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#c4b5fd' }}>
                    Recalculating HCM Scores...
                  </span>
                  <span style={{ fontSize: 12, color: '#9ca3af', marginLeft: 8 }}>
                    The HCM configuration has been updated. New scores are being calculated in the background.
                  </span>
                </>
              )}
              {bannerState === 'done' && (
                <>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#B3D335' }}>
                    HCM scores have been updated.
                  </span>
                  <span style={{ fontSize: 12, color: '#9ca3af', marginLeft: 8 }}>
                    Click to load the latest scores for current results.
                  </span>
                </>
              )}
              {bannerState === 'error' && (
                <span style={{ fontSize: 13, fontWeight: 600, color: '#f87171' }}>
                  HCM score recalculation encountered an error. Contact your administrator.
                </span>
              )}
            </div>
          </div>

          {/* Right — action button + dismiss */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {bannerState === 'done' && (
              <button
                onClick={handleLoadLatestScores}
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#ffffff',
                  background: 'linear-gradient(135deg, #9ACA3C, #B3D335)',
                  border: 'none',
                  borderRadius: 6,
                  padding: '5px 14px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                Load Latest Scores
              </button>
            )}
            <button
              onClick={handleDismiss}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 4,
                display: 'flex',
                alignItems: 'center',
                color: '#6b7280',
              }}
              aria-label="Dismiss"
            >
              <X style={{ width: 14, height: 14 }} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
