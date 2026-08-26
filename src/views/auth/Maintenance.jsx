// Imports
import React from 'react';
import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { Wrench, Home, Clock, RefreshCw } from 'lucide-react';

const Maintenance = () => {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(145deg, #0a0e1a 0%, #0f1629 30%, #111827 60%, #0d1117 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      }}
    >
      {/* Ambient background orbs */}
      <div
        style={{
          position: 'absolute',
          top: -150,
          left: -150,
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(251,191,36,0.07), transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: -180,
          right: -120,
          width: 450,
          height: 450,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(179,211,53,0.06), transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Grid pattern overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(251,191,36,0.015) 1px, transparent 1px),
            linear-gradient(90deg, rgba(251,191,36,0.015) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          pointerEvents: 'none',
        }}
      />

      {/* Main content */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '40px 20px',
          maxWidth: 550,
          width: '100%',
        }}
      >
        {/* Animated wrench icon */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div
            animate={{ rotate: [0, -20, 20, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              width: 80,
              height: 80,
              borderRadius: 24,
              background: 'linear-gradient(135deg, rgba(251,191,36,0.15), rgba(251,191,36,0.05))',
              border: '1px solid rgba(251,191,36,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 32,
              boxShadow: '0 8px 32px rgba(251,191,36,0.1)',
            }}
          >
            <Wrench style={{ width: 36, height: 36, color: '#fbbf24' }} />
          </motion.div>
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          style={{ textAlign: 'center', marginBottom: 24 }}
        >
          <h1
            style={{
              fontSize: 'clamp(32px, 6vw, 48px)',
              fontWeight: 800,
              lineHeight: 1.2,
              marginBottom: 8,
              background: 'linear-gradient(135deg, #ffffff 0%, #94a3b8 60%, #fbbf24 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Under Maintenance
          </h1>
          <p style={{ fontSize: 14, color: '#6b7280', letterSpacing: '2px', textTransform: 'uppercase' }}>
            We'll be back shortly
          </p>
        </motion.div>

        {/* Glass card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          style={{ width: '100%', maxWidth: 460 }}
        >
          <div
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 20,
              padding: '32px 36px',
              backdropFilter: 'blur(20px)',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Top gradient bar */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 3,
                background: 'linear-gradient(90deg, #fbbf24, #B3D335, #818cf8)',
                borderRadius: '20px 20px 0 0',
              }}
            />

            {/* Message */}
            <p
              style={{
                fontSize: 17,
                fontWeight: 500,
                color: '#e2e8f0',
                marginBottom: 8,
                lineHeight: 1.6,
              }}
            >
              Something amazing is being built behind the scenes.
            </p>
            <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 28 }}>
              Our team is working hard to improve your experience. Please check back again soon.
            </p>

            {/* Status indicators */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: 20,
                marginBottom: 28,
                flexWrap: 'wrap',
              }}
            >
              {[
                { icon: Clock, label: 'Scheduled', color: '#fbbf24' },
                { icon: RefreshCw, label: 'In Progress', color: '#B3D335' },
              ].map(({ icon: Icon, label, color }) => (
                <div
                  key={label}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 16px',
                    borderRadius: 12,
                    background: `linear-gradient(135deg, ${color}12, ${color}05)`,
                    border: `1px solid ${color}25`,
                  }}
                >
                  <Icon style={{ width: 14, height: 14, color }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color }}>{label}</span>
                </div>
              ))}
            </div>

            {/* Back to home button */}
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
              <Link
                to="/"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  background: 'linear-gradient(135deg, #9ACA3C, #B3D335)',
                  color: '#0a0e1a',
                  border: 'none',
                  borderRadius: 12,
                  padding: '12px 24px',
                  fontWeight: 700,
                  fontSize: 14,
                  textDecoration: 'none',
                  boxShadow: '0 4px 24px rgba(154,202,60,0.3)',
                }}
              >
                <Home style={{ width: 16, height: 16 }} />
                Back to Home
              </Link>
            </motion.div>
          </div>
        </motion.div>

        {/* Bottom decorative line */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1.2, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
          style={{
            width: 120,
            height: 2,
            background: 'linear-gradient(90deg, transparent, rgba(251,191,36,0.4), transparent)',
            marginTop: 40,
            borderRadius: 1,
          }}
        />

        {/* Status Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          style={{ fontSize: 11, color: '#4b5563', marginTop: 16, letterSpacing: '1px' }}
        >
          STATUS: MAINTENANCE &bull; SCHEDULED
        </motion.p>
      </div>
    </div>
  );
};

export default Maintenance;
