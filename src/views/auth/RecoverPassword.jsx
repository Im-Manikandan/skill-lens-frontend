// Imports
import React from 'react';
import { useNavigate, Link } from 'react-router';
import { Formik, Field, Form, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { motion } from 'framer-motion';
import { KeyRound, ArrowLeft, Mail, User } from 'lucide-react';
import AuthLogo from '../../layouts/logo/AuthLogo';

const RecoverPassword = () => {
  const navigate = useNavigate();

  // Form Configuration
  const initialValues = {
    email: '',
    uname: '',
  };

  const validationSchema = Yup.object().shape({
    email: Yup.string().email('Email is invalid').required('Email is required'),
    uname: Yup.string().required('Username is required'),
  });

  // Input Styles
  const inputStyle = {
    width: '100%',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: '12px 14px 12px 42px',
    color: '#e2e8f0',
    fontSize: 14,
    outline: 'none',
    transition: 'all 0.3s ease',
  };

  const inputErrorStyle = {
    ...inputStyle,
    borderColor: 'rgba(239,68,68,0.5)',
  };

  const labelStyle = {
    fontSize: 13,
    fontWeight: 500,
    color: '#9ca3af',
    marginBottom: 6,
    display: 'block',
  };

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
          background: 'radial-gradient(circle, rgba(179,211,53,0.07), transparent 70%)',
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
          background: 'radial-gradient(circle, rgba(96,165,250,0.06), transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Grid pattern overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(179,211,53,0.015) 1px, transparent 1px),
            linear-gradient(90deg, rgba(179,211,53,0.015) 1px, transparent 1px)
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
          maxWidth: 480,
          width: '100%',
        }}
      >
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <AuthLogo />
        </motion.div>

        {/* Key icon */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              width: 68,
              height: 68,
              borderRadius: 20,
              background: 'linear-gradient(135deg, rgba(179,211,53,0.15), rgba(154,202,60,0.05))',
              border: '1px solid rgba(179,211,53,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 24,
              boxShadow: '0 8px 32px rgba(179,211,53,0.1)',
            }}
          >
            <KeyRound style={{ width: 30, height: 30, color: '#B3D335' }} />
          </motion.div>
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          style={{ textAlign: 'center', marginBottom: 24 }}
        >
          <h2
            style={{
              fontSize: 26,
              fontWeight: 700,
              marginBottom: 6,
              background: 'linear-gradient(135deg, #ffffff 0%, #94a3b8 60%, #B3D335 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Recover Password
          </h2>
          <p style={{ fontSize: 13, color: '#6b7280' }}>
            Enter your details and we'll send you a reset link
          </p>
        </motion.div>

        {/* Glass card with form */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          style={{ width: '100%' }}
        >
          <div
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 20,
              padding: '32px 32px 28px',
              backdropFilter: 'blur(20px)',
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
                background: 'linear-gradient(90deg, #9ACA3C, #B3D335, #60a5fa)',
                borderRadius: '20px 20px 0 0',
              }}
            />

            <Formik
              initialValues={initialValues}
              validationSchema={validationSchema}
              onSubmit={(fields) => {
                // eslint-disable-next-line no-alert
                alert(`SUCCESS!! :-)\n\n${JSON.stringify(fields, null, 4)}`);
                navigate('/');
              }}
            >
              {({ errors, touched }) => (
                <Form>
                  {/* Username field */}
                  <div style={{ marginBottom: 20 }}>
                    <label htmlFor="uname" style={labelStyle}>
                      Username
                    </label>
                    <div style={{ position: 'relative' }}>
                      <User
                        style={{
                          position: 'absolute',
                          left: 14,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          width: 16,
                          height: 16,
                          color: '#6b7280',
                          pointerEvents: 'none',
                        }}
                      />
                      <Field
                        name="uname"
                        type="text"
                        placeholder="Enter your username"
                        style={errors.uname && touched.uname ? inputErrorStyle : inputStyle}
                        onFocus={(e) => {
                          e.target.style.borderColor = 'rgba(179,211,53,0.4)';
                          e.target.style.boxShadow = '0 0 20px rgba(179,211,53,0.08)';
                        }}
                        onBlur={(e) => {
                          if (!(errors.uname && touched.uname)) {
                            e.target.style.borderColor = 'rgba(255,255,255,0.1)';
                            e.target.style.boxShadow = 'none';
                          }
                        }}
                      />
                      <ErrorMessage
                        name="uname"
                        component="div"
                        className="tw:text-red-400 tw:text-xs tw:mt-1.5 tw:ml-1"
                      />
                    </div>
                  </div>

                  {/* Email field */}
                  <div style={{ marginBottom: 24 }}>
                    <label htmlFor="email" style={labelStyle}>
                      Email Address
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Mail
                        style={{
                          position: 'absolute',
                          left: 14,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          width: 16,
                          height: 16,
                          color: '#6b7280',
                          pointerEvents: 'none',
                        }}
                      />
                      <Field
                        name="email"
                        type="email"
                        placeholder="Enter your email"
                        style={errors.email && touched.email ? inputErrorStyle : inputStyle}
                        onFocus={(e) => {
                          e.target.style.borderColor = 'rgba(179,211,53,0.4)';
                          e.target.style.boxShadow = '0 0 20px rgba(179,211,53,0.08)';
                        }}
                        onBlur={(e) => {
                          if (!(errors.email && touched.email)) {
                            e.target.style.borderColor = 'rgba(255,255,255,0.1)';
                            e.target.style.boxShadow = 'none';
                          }
                        }}
                      />
                      <ErrorMessage
                        name="email"
                        component="div"
                        className="tw:text-red-400 tw:text-xs tw:mt-1.5 tw:ml-1"
                      />
                    </div>
                  </div>

                  {/* Submit button */}
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <button
                      type="submit"
                      style={{
                        width: '100%',
                        background: 'linear-gradient(135deg, #9ACA3C, #B3D335)',
                        color: '#0a0e1a',
                        border: 'none',
                        borderRadius: 12,
                        padding: '13px 24px',
                        fontWeight: 700,
                        fontSize: 15,
                        cursor: 'pointer',
                        boxShadow: '0 4px 24px rgba(154,202,60,0.3)',
                        transition: 'box-shadow 0.3s ease',
                      }}
                    >
                      Reset Password
                    </button>
                  </motion.div>
                </Form>
              )}
            </Formik>
          </div>
        </motion.div>

        {/* Back to login link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          style={{ marginTop: 24, textAlign: 'center' }}
        >
          <Link
            to="/auth/login"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 13,
              color: '#6b7280',
              textDecoration: 'none',
              transition: 'color 0.3s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#B3D335')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#6b7280')}
          >
            <ArrowLeft style={{ width: 14, height: 14 }} />
            Back to Login
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default RecoverPassword;
