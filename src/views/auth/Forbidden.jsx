// Imports
import { Link } from 'react-router';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { Home, ArrowLeft, ShieldAlert } from 'lucide-react';

// Floating Shape Configuration
const floatingShapes = [
  { size: 60, x: '10%', y: '15%', delay: 0, duration: 6, color: 'rgba(179,211,53,0.07)' },
  { size: 40, x: '80%', y: '10%', delay: 1.2, duration: 7, color: 'rgba(154,202,60,0.06)' },
  { size: 80, x: '70%', y: '70%', delay: 0.5, duration: 8, color: 'rgba(179,211,53,0.05)' },
  { size: 35, x: '20%', y: '75%', delay: 2, duration: 5.5, color: 'rgba(96,165,250,0.06)' },
  { size: 50, x: '50%', y: '85%', delay: 1.5, duration: 6.5, color: 'rgba(129,140,248,0.06)' },
  { size: 45, x: '90%', y: '45%', delay: 0.8, duration: 7.5, color: 'rgba(179,211,53,0.04)' },
];

// Shown when an authenticated user's role doesn't match the route they hit
// (e.g. a Client session opening an /admin/* URL). The session stays intact —
// this page must never touch tokens/redux auth state — so the "home" link
// below sends the user back into their own area instead of logging them out.
const Forbidden = () => {
  const userType = useSelector((state) => state.userType.userType);
  const homePath = userType === 'admin' ? '/admin/dashboard' : '/client/dashboard';

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
          background: 'radial-gradient(circle, rgba(239,68,68,0.08), transparent 70%)',
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
          background: 'radial-gradient(circle, rgba(129,140,248,0.06), transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '40%',
          right: '10%',
          width: 300,
          height: 300,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(154,202,60,0.04), transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Floating geometric shapes */}
      {floatingShapes.map((shape, i) => (
        <motion.div
          key={i}
          animate={{
            y: [0, -20, 0],
            rotate: [0, 180, 360],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: shape.duration,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: shape.delay,
          }}
          style={{
            position: 'absolute',
            left: shape.x,
            top: shape.y,
            width: shape.size,
            height: shape.size,
            borderRadius: shape.size > 50 ? '24%' : '50%',
            background: shape.color,
            border: `1px solid ${shape.color}`,
            pointerEvents: 'none',
          }}
        />
      ))}

      {/* Grid pattern overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(179,211,53,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(179,211,53,0.02) 1px, transparent 1px)
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
          maxWidth: 600,
          width: '100%',
        }}
      >
        {/* Animated shield icon */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div
            animate={{ rotate: [0, 15, -15, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              width: 80,
              height: 80,
              borderRadius: 24,
              background: 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(239,68,68,0.05))',
              border: '1px solid rgba(239,68,68,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 32,
              boxShadow: '0 8px 32px rgba(239,68,68,0.1)',
            }}
          >
            <ShieldAlert style={{ width: 36, height: 36, color: '#ef4444' }} />
          </motion.div>
        </motion.div>

        {/* Giant 403 */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        >
          <h1
            style={{
              fontSize: 'clamp(100px, 20vw, 180px)',
              fontWeight: 900,
              lineHeight: 1,
              letterSpacing: '-4px',
              marginBottom: 8,
              background: 'linear-gradient(135deg, #ffffff 0%, #64748b 40%, #ef4444 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textAlign: 'center',
              filter: 'drop-shadow(0 4px 30px rgba(239,68,68,0.15))',
            }}
          >
            403
          </h1>
        </motion.div>

        {/* Glass card with message */}
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
                background: 'linear-gradient(90deg, #ef4444, #f59e0b, #ef4444)',
                borderRadius: '20px 20px 0 0',
              }}
            />

            {/* Warning icon */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                marginBottom: 16,
              }}
            >
              <ShieldAlert style={{ width: 20, height: 20, color: '#fbbf24', opacity: 0.8 }} />
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '3px',
                  color: '#9ca3af',
                }}
              >
                Access Denied
              </span>
              <ShieldAlert style={{ width: 20, height: 20, color: '#fbbf24', opacity: 0.8 }} />
            </div>

            <p
              style={{
                fontSize: 17,
                fontWeight: 500,
                color: '#e2e8f0',
                marginBottom: 8,
                lineHeight: 1.6,
              }}
            >
              You don't have permission to view this page.
            </p>
            <p
              style={{
                fontSize: 13,
                color: '#6b7280',
                marginBottom: 28,
              }}
            >
              Your account isn't authorized for this area. You're still signed in.
            </p>

            {/* Action Buttons */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                flexWrap: 'wrap',
              }}
            >
              {/* Back to own home */}
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                <Link
                  to={homePath}
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
                    transition: 'box-shadow 0.3s ease',
                  }}
                >
                  <Home style={{ width: 16, height: 16 }} />
                  Back to Dashboard
                </Link>
              </motion.div>

              {/* Go Back */}
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                <Link
                  to={-1}
                  onClick={(e) => {
                    e.preventDefault();
                    window.history.back();
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    background: 'rgba(255,255,255,0.06)',
                    color: '#e2e8f0',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 12,
                    padding: '12px 24px',
                    fontWeight: 600,
                    fontSize: 14,
                    textDecoration: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                  }}
                >
                  <ArrowLeft style={{ width: 16, height: 16 }} />
                  Go Back
                </Link>
              </motion.div>
            </div>
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
            background: 'linear-gradient(90deg, transparent, rgba(239,68,68,0.4), transparent)',
            marginTop: 40,
            borderRadius: 1,
          }}
        />

        {/* Error code footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          style={{
            fontSize: 11,
            color: '#4b5563',
            marginTop: 16,
            letterSpacing: '1px',
          }}
        >
          ERROR CODE: 403 &bull; ACCESS DENIED
        </motion.p>
      </div>
    </div>
  );
};

export default Forbidden;
