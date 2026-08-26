// Imports
import { isRouteErrorResponse, useRouteError } from 'react-router';
import { AlertCircle, RefreshCw, Home, FileQuestion, AlertTriangle, Monitor, Smartphone } from 'lucide-react';
import * as Sentry from '@sentry/react';
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import Bowser from 'bowser';
import ErrorFragment from './ErrorFragment';

// Animation Variants
const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

// Route-Level Error Boundary Component
export default function RootErrorBoundary() {
  let error = useRouteError();

  // Device Info Detection
  const deviceInfo = useMemo(() => {
    console.error(error);
    const parser = Bowser.getParser(window.navigator.userAgent);
    const browser = parser.getBrowser();
    const os = parser.getOS();
    const platform = parser.getPlatform();

    return {
      browserName: browser.name || 'Unknown',
      browserVersion: browser.version || 'Unknown',
      osName: os.name || 'Unknown',
      osVersion: os.version || 'Unknown',
      platformType: platform.type || 'Unknown',
      deviceType: parser.getPlatformType() || 'Unknown',
    };
  }, []);

  // HTTP Route Error Response (404, 500, etc.)
  if (isRouteErrorResponse(error)) {
    const is404 = error.status === 404;
    const accent = is404 ? '#60a5fa' : '#ef4444';
    const accentRgb = is404 ? '96,165,250' : '239,68,68';
    const secondaryOrb = is404 ? 'rgba(129,140,248,0.05)' : 'rgba(244,114,182,0.05)';

    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f1117 0%, #131620 50%, #0f1520 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Poppins, sans-serif',
        padding: 16,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Ambient background orbs */}
        <div style={{ position: 'absolute', top: -100, left: -100, width: 400, height: 400,
          borderRadius: '50%', background: `radial-gradient(circle, rgba(${accentRgb},0.06), transparent 70%)`,
          pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -120, right: -80, width: 350, height: 350,
          borderRadius: '50%', background: `radial-gradient(circle, ${secondaryOrb}, transparent 70%)`,
          pointerEvents: 'none' }} />

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: 580, margin: '0 auto' }}
        >
          {/* Main glass card */}
          <motion.div variants={itemVariants} style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 24,
            padding: '40px 32px',
            backdropFilter: 'blur(20px)',
          }}>
            {/* Animated icon */}
            <motion.div
              style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              <div style={{
                width: 80, height: 80, borderRadius: 22,
                background: `linear-gradient(135deg, rgba(${accentRgb},0.2), rgba(${accentRgb},0.08))`,
                border: `1px solid rgba(${accentRgb},0.25)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 0 40px rgba(${accentRgb},0.15)`,
              }}>
                <FileQuestion style={{ width: 36, height: 36, color: accent }} strokeWidth={2} />
              </div>
            </motion.div>

            {/* Error code */}
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <h1 style={{
                fontSize: 80, fontWeight: 700, lineHeight: 1, marginBottom: 12,
                background: `linear-gradient(135deg, #ffffff 0%, #94a3b8 40%, ${accent} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                {error.status}
              </h1>
              <h2 style={{
                fontSize: 24, fontWeight: 700, marginBottom: 10,
                background: `linear-gradient(135deg, #ffffff 0%, #94a3b8 60%, ${accent} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                {error.statusText}
              </h2>
              <p style={{ fontSize: 13, color: '#9ca3af', lineHeight: 1.6, margin: 0 }}>
                Refresh the page & try again. If the issue occurs again try with a different network, browser or device.
                <br />
                If the issue persists, share a screenshot of this page to your program manager or our support team.
              </p>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 28 }}>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => window.location.reload()}
                style={{
                  background: `linear-gradient(135deg, ${accent}, ${is404 ? '#3b82f6' : '#dc2626'})`,
                  border: 'none', borderRadius: 12, padding: '10px 20px',
                  fontWeight: 600, color: '#fff', cursor: 'pointer', fontSize: 14,
                  boxShadow: `0 4px 20px rgba(${accentRgb},0.3)`,
                  display: 'flex', alignItems: 'center', gap: 8,
                  fontFamily: 'inherit',
                }}
              >
                <RefreshCw style={{ width: 16, height: 16 }} />
                Reload Page
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => window.location.href = '/'}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 12, padding: '10px 20px',
                  fontWeight: 500, color: '#e2e8f0', cursor: 'pointer', fontSize: 14,
                  display: 'flex', alignItems: 'center', gap: 8,
                  fontFamily: 'inherit',
                }}
              >
                <Home style={{ width: 16, height: 16 }} />
                Go Home
              </motion.button>
            </div>

            {/* URL & device info glass panel */}
            <motion.div variants={itemVariants} style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 14, padding: '14px 18px',
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <p style={{ color: '#6b7280', fontSize: 12, margin: 0, wordBreak: 'break-all' }}>
                  <span style={{ fontWeight: 600, color: '#9ca3af' }}>URL:</span>{' '}
                  <span style={{ color: '#e2e8f0' }}>{window.location.href}</span>
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                  <p style={{ color: '#6b7280', fontSize: 12, margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Monitor style={{ width: 14, height: 14, color: '#6b7280' }} />
                    <span style={{ fontWeight: 600, color: '#9ca3af' }}>Browser:</span>{' '}
                    <span style={{ color: '#e2e8f0' }}>{deviceInfo.browserName} {deviceInfo.browserVersion}</span>
                  </p>
                  <p style={{ color: '#6b7280', fontSize: 12, margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Smartphone style={{ width: 14, height: 14, color: '#6b7280' }} />
                    <span style={{ fontWeight: 600, color: '#9ca3af' }}>Device:</span>{' '}
                    <span style={{ color: '#e2e8f0' }}>{deviceInfo.deviceType} ({deviceInfo.osName} {deviceInfo.osVersion})</span>
                  </p>
                </div>
                {error.data && (
                  <p style={{ color: '#e2e8f0', fontSize: 13, margin: '4px 0 0', lineHeight: 1.6 }}>
                    {error.data}
                  </p>
                )}
                {!error.data && (
                  <p style={{ color: '#9ca3af', fontSize: 13, margin: '4px 0 0', lineHeight: 1.6 }}>
                    The page you're looking for doesn't exist or has been moved.
                  </p>
                )}
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    );
  // JavaScript Error - Delegate to ErrorFragment
  } else if (error instanceof Error) {
    return (
      <ErrorFragment error={error} />
    );
  // Unknown Error Fallback
  } else {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f1117 0%, #151320 50%, #1a0f20 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Poppins, sans-serif',
        padding: 16,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Ambient background orbs */}
        <div style={{ position: 'absolute', top: -100, left: -100, width: 400, height: 400,
          borderRadius: '50%', background: 'radial-gradient(circle, rgba(167,139,250,0.06), transparent 70%)',
          pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -120, right: -80, width: 350, height: 350,
          borderRadius: '50%', background: 'radial-gradient(circle, rgba(244,114,182,0.05), transparent 70%)',
          pointerEvents: 'none' }} />

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: 580, margin: '0 auto' }}
        >
          {/* Main glass card */}
          <motion.div variants={itemVariants} style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 24,
            padding: '40px 32px',
            backdropFilter: 'blur(20px)',
          }}>
            {/* Animated icon */}
            <motion.div
              style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              <div style={{
                width: 80, height: 80, borderRadius: 22,
                background: 'linear-gradient(135deg, rgba(167,139,250,0.2), rgba(167,139,250,0.08))',
                border: '1px solid rgba(167,139,250,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 40px rgba(167,139,250,0.15)',
              }}>
                <AlertTriangle style={{ width: 36, height: 36, color: '#a78bfa' }} strokeWidth={2} />
              </div>
            </motion.div>

            {/* Error heading */}
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <h2 style={{
                fontSize: 26, fontWeight: 700, marginBottom: 10,
                background: 'linear-gradient(135deg, #ffffff 0%, #94a3b8 60%, #a78bfa 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                Unknown Error
              </h2>
              <p style={{ fontSize: 13, color: '#9ca3af', lineHeight: 1.6, margin: 0 }}>
                Refresh the page & try again. If the issue occurs again try with a different network, browser or device.
                <br />
                If the issue persists, share a screenshot of this page to your program manager or our support team.
              </p>
            </div>

            {/* Action button */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 28 }}>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => window.location.href = '/'}
                style={{
                  background: 'linear-gradient(135deg, #a78bfa, #7c3aed)',
                  border: 'none', borderRadius: 12, padding: '10px 20px',
                  fontWeight: 600, color: '#fff', cursor: 'pointer', fontSize: 14,
                  boxShadow: '0 4px 20px rgba(167,139,250,0.3)',
                  display: 'flex', alignItems: 'center', gap: 8,
                  fontFamily: 'inherit',
                }}
              >
                <Home style={{ width: 16, height: 16 }} />
                Go Home
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => window.location.reload()}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 12, padding: '10px 20px',
                  fontWeight: 500, color: '#e2e8f0', cursor: 'pointer', fontSize: 14,
                  display: 'flex', alignItems: 'center', gap: 8,
                  fontFamily: 'inherit',
                }}
              >
                <RefreshCw style={{ width: 16, height: 16 }} />
                Reload Page
              </motion.button>
            </div>

            {/* URL & device info glass panel */}
            <motion.div variants={itemVariants} style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 14, padding: '14px 18px',
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <p style={{ color: '#6b7280', fontSize: 12, margin: 0, wordBreak: 'break-all' }}>
                  <span style={{ fontWeight: 600, color: '#9ca3af' }}>URL:</span>{' '}
                  <span style={{ color: '#e2e8f0' }}>{window.location.href}</span>
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                  <p style={{ color: '#6b7280', fontSize: 12, margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Monitor style={{ width: 14, height: 14, color: '#6b7280' }} />
                    <span style={{ fontWeight: 600, color: '#9ca3af' }}>Browser:</span>{' '}
                    <span style={{ color: '#e2e8f0' }}>{deviceInfo.browserName} {deviceInfo.browserVersion}</span>
                  </p>
                  <p style={{ color: '#6b7280', fontSize: 12, margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Smartphone style={{ width: 14, height: 14, color: '#6b7280' }} />
                    <span style={{ fontWeight: 600, color: '#9ca3af' }}>Device:</span>{' '}
                    <span style={{ color: '#e2e8f0' }}>{deviceInfo.deviceType} ({deviceInfo.osName} {deviceInfo.osVersion})</span>
                  </p>
                </div>
                <p style={{ color: '#9ca3af', fontSize: 13, margin: '4px 0 0', lineHeight: 1.6 }}>
                  An unexpected error occurred. Please try again later.
                </p>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    );
  }
}
