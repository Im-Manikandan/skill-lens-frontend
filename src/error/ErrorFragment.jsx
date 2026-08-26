// Imports
import { AlertCircle, Monitor, RefreshCw, Smartphone, Home, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Bowser from 'bowser';

// Animation Variants
const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

// Error Display Component
const ErrorFragment = ({ error }) => {
  const [copied, setCopied] = useState(false);
  const [showStack, setShowStack] = useState(false);

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

  // Copy Error Details to Clipboard
  const handleCopyError = () => {
    const text = `Error: ${error?.message}\nURL: ${window.location.href}\nBrowser: ${deviceInfo.browserName} ${deviceInfo.browserVersion}\nDevice: ${deviceInfo.deviceType} (${deviceInfo.osName} ${deviceInfo.osVersion})\n\nStack:\n${error?.stack || 'N/A'}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f1117 0%, #131620 50%, #170f1a 100%)',
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
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(239,68,68,0.06), transparent 70%)',
        pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -120, right: -80, width: 350, height: 350,
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(244,114,182,0.05), transparent 70%)',
        pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '40%', right: '10%', width: 250, height: 250,
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(251,146,60,0.04), transparent 70%)',
        pointerEvents: 'none' }} />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: 640, margin: '0 auto' }}
      >
        {/* Main glass card */}
        <motion.div variants={itemVariants} style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 24,
          padding: '40px 32px',
          backdropFilter: 'blur(20px)',
        }}>
          {/* Animated error icon */}
          <motion.div
            style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <div style={{
              width: 80, height: 80, borderRadius: 22,
              background: 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(239,68,68,0.08))',
              border: '1px solid rgba(239,68,68,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 40px rgba(239,68,68,0.15)',
            }}>
              <AlertCircle style={{ width: 36, height: 36, color: '#ef4444' }} strokeWidth={2} />
            </div>
          </motion.div>

          {/* Error heading */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <h2 style={{
              fontSize: 26, fontWeight: 700, marginBottom: 8,
              background: 'linear-gradient(135deg, #ffffff 0%, #94a3b8 60%, #ef4444 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              Oops! Something went wrong
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
                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                border: 'none', borderRadius: 12, padding: '10px 20px',
                fontWeight: 600, color: '#fff', cursor: 'pointer', fontSize: 14,
                boxShadow: '0 4px 20px rgba(239,68,68,0.3)',
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

          {/* Error message glass panel */}
          <motion.div variants={itemVariants} style={{
            background: 'rgba(239,68,68,0.06)',
            border: '1px solid rgba(239,68,68,0.15)',
            borderRadius: 14, padding: '14px 18px', marginBottom: 16,
          }}>
            <pre style={{
              color: '#fca5a5', fontSize: 13, fontFamily: 'monospace',
              margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.5,
            }}>
              {error?.message}
            </pre>
          </motion.div>

          {/* Device & URL info glass panel */}
          <motion.div variants={itemVariants} style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 14, padding: '14px 18px', marginBottom: 16,
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
            </div>
          </motion.div>

          {/* Stack trace collapsible */}
          {error?.stack && (
            <motion.div variants={itemVariants}>
              <button
                onClick={() => setShowStack(!showStack)}
                style={{
                  width: '100%', background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: showStack ? '14px 14px 0 0' : 14,
                  padding: '10px 18px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  color: '#6b7280', fontSize: 12, fontWeight: 600,
                  fontFamily: 'inherit',
                  transition: 'all 0.3s ease',
                }}
              >
                <span>Stack Trace</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => { e.stopPropagation(); handleCopyError(); }}
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 8, padding: '4px 8px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 4,
                      color: copied ? '#34d399' : '#9ca3af', fontSize: 11,
                      fontFamily: 'inherit',
                    }}
                  >
                    {copied ? <Check style={{ width: 12, height: 12 }} /> : <Copy style={{ width: 12, height: 12 }} />}
                    {copied ? 'Copied' : 'Copy'}
                  </motion.button>
                  {showStack ? <ChevronUp style={{ width: 16, height: 16 }} /> : <ChevronDown style={{ width: 16, height: 16 }} />}
                </div>
              </button>
              {showStack && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  transition={{ duration: 0.3 }}
                  style={{
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderTop: 'none',
                    borderRadius: '0 0 14px 14px',
                    padding: '16px 18px',
                  }}
                >
                  <pre style={{
                    color: '#34d399', fontSize: 11, fontFamily: 'monospace',
                    overflow: 'auto', maxHeight: 200, margin: 0,
                    lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                  }}>
                    {error.stack}
                  </pre>
                </motion.div>
              )}
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ErrorFragment;
