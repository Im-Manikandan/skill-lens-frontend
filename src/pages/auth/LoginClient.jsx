// Imports
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { ErrorMessage, Field, Form, Formik } from 'formik';
import * as Yup from 'yup';
import { Link } from 'react-router';

import { ReactComponent as LogoDarkText } from '../../assets/images/logos/skill_lens_logo_text.svg';
import { ReactComponent as LeftBg } from '../../assets/images/bg/login-bgleft.svg';
import { ReactComponent as RightBg } from '../../assets/images/bg/login-bg-right.svg';
import useLoginClient from '../../hooks/query/useLoginClient.jsx';
import BrandButton from '../../components/buttons/BrandButton.jsx';

// Animation Variants
const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

const LoginClient = () => {
  // State & Hooks
  const { mutate: loginClient, isPending, isError, error } = useLoginClient();
  const [showPassword, setShowPassword] = useState(false);

  // Form Configuration
  const initialValues = {
    email: '',
    password: '',
  };

  const validationSchema = Yup.object().shape({
    email: Yup.string().email('Email is invalid').required('Email is required'),
    password: Yup.string()
      .min(6, 'Password must be at least 6 characters')
      .required('Password is required'),
  });

  // Clear Storage on Mount
  useEffect(() => {
    sessionStorage.clear();
    localStorage.clear();
  }, []);

  return (
    <div
      className="tw:relative tw:flex tw:min-h-screen tw:items-center tw:justify-center tw:overflow-hidden tw:p-5"
      style={{ background: 'linear-gradient(135deg, #0a0a0f 0%, #0d1117 40%, #0a0f1a 70%, #080b12 100%)' }}
    >
      {/* Left & Right background SVGs */}
      <LeftBg className="tw:absolute tw:left-0 tw:bottom-0 tw:pointer-events-none tw:opacity-30" />
      <RightBg className="tw:absolute tw:right-0 tw:top-0 tw:pointer-events-none tw:opacity-30" />

      {/* Ambient background orbs */}
      <div
        className="tw:absolute tw:-top-50 tw:-left-37.5 tw:w-150 tw:h-150 tw:rounded-full tw:pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(179,211,53,0.07), transparent 70%)' }}
      />
      <div
        className="tw:absolute tw:-bottom-50 tw:-right-37.5 tw:w-125 tw:h-125 tw:rounded-full tw:pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(96,165,250,0.06), transparent 70%)' }}
      />
      <div
        className="tw:absolute tw:top-[40%] tw:right-[10%] tw:w-87.5 tw:h-87.5 tw:rounded-full tw:pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(129,140,248,0.04), transparent 70%)' }}
      />

      {/* Subtle grid pattern */}
      <div
        className="tw:absolute tw:inset-0 tw:pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="tw:relative tw:z-10 tw:w-full tw:max-w-105"
      >
        {/* Glass card */}
        <motion.div variants={itemVariants}>
          <div
            className="tw:rounded-3xl tw:backdrop-blur-[20px]"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              padding: '40px 36px',
              boxShadow: '0 8px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)',
            }}
          >
            {/* Logo inside card */}
            <motion.div variants={itemVariants} className="tw:flex tw:flex-col tw:items-center tw:mb-8">
              <div className="tw:mb-3 tw:flex tw:justify-center">
                <LogoDarkText style={{ height: 56 }} />
              </div>
              <p className="tw:text-sm tw:text-gray-500 tw:m-0">
                Sign in to your client account
              </p>
            </motion.div>

            {/* Login Form */}
            <Formik
              initialValues={initialValues}
              validationSchema={validationSchema}
              onSubmit={(fields) => {
                loginClient(
                  { email: fields.email, password: fields.password },
                  {
                    onSuccess: () => {
                      window.location.replace(`${import.meta.env.BASE_URL}/auth/client/authorized`);
                    },
                  },
                );
              }}
            >
              {({ errors, touched }) => (
                <Form>
                  {/* Error Display */}
                  {isError && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="tw:mb-5"
                    >
                      <div
                        className="tw:flex tw:items-center tw:gap-2 tw:rounded-xl tw:px-4 tw:py-3 tw:text-[13px]"
                        style={{
                          background: 'rgba(239,68,68,0.1)',
                          border: '1px solid rgba(239,68,68,0.2)',
                          color: '#f87171',
                        }}
                      >
                        <div
                          className="tw:w-1.5 tw:h-1.5 tw:rounded-full tw:shrink-0"
                          style={{
                            backgroundColor: '#ef4444',
                            boxShadow: '0 0 8px rgba(239,68,68,0.5)',
                          }}
                        />
                        {error?.message || 'Login failed. Please try again.'}
                      </div>
                    </motion.div>
                  )}

                  {/* Email field */}
                  <motion.div variants={itemVariants} className="tw:mb-5">
                    <label className="tw:block tw:text-[13px] tw:font-medium tw:text-gray-400 tw:mb-2">
                      Email Address
                    </label>
                    <div className="tw:relative">
                      <Mail className="tw:absolute tw:left-3.5 tw:top-1/2 tw:-translate-y-1/2 tw:w-4.5 tw:h-4.5 tw:text-gray-600 tw:pointer-events-none" />
                      <Field
                        name="email"
                        type="text"
                        placeholder="Enter your email"
                        className="tw:w-full tw:rounded-xl tw:text-sm tw:text-slate-200 tw:outline-none tw:transition-all tw:duration-300 tw:box-border"
                        style={{
                          background: 'rgba(255,255,255,0.03)',
                          border: `1px solid ${errors.email && touched.email ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.08)'}`,
                          padding: '14px 16px 14px 44px',
                        }}
                        onFocus={(e) => {
                          if (!(errors.email && touched.email)) {
                            e.target.style.borderColor = 'rgba(179,211,53,0.4)';
                            e.target.style.boxShadow = '0 0 20px rgba(179,211,53,0.08)';
                          }
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = errors.email && touched.email
                            ? 'rgba(239,68,68,0.4)'
                            : 'rgba(255,255,255,0.08)';
                          e.target.style.boxShadow = 'none';
                        }}
                      />
                    </div>
                    <ErrorMessage name="email">
                      {(msg) => (
                        <div className="tw:text-xs tw:text-red-400 tw:mt-1.5 tw:pl-1">{msg}</div>
                      )}
                    </ErrorMessage>
                  </motion.div>

                  {/* Password field */}
                  <motion.div variants={itemVariants} className="tw:mb-6">
                    <label className="tw:block tw:text-[13px] tw:font-medium tw:text-gray-400 tw:mb-2">
                      Password
                    </label>
                    <div className="tw:relative">
                      <Lock className="tw:absolute tw:left-3.5 tw:top-1/2 tw:-translate-y-1/2 tw:w-4.5 tw:h-4.5 tw:text-gray-600 tw:pointer-events-none" />
                      <Field
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        className="tw:w-full tw:rounded-xl tw:text-sm tw:text-slate-200 tw:outline-none tw:transition-all tw:duration-300 tw:box-border"
                        style={{
                          background: 'rgba(255,255,255,0.03)',
                          border: `1px solid ${errors.password && touched.password ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.08)'}`,
                          padding: '14px 44px 14px 44px',
                        }}
                        onFocus={(e) => {
                          if (!(errors.password && touched.password)) {
                            e.target.style.borderColor = 'rgba(179,211,53,0.4)';
                            e.target.style.boxShadow = '0 0 20px rgba(179,211,53,0.08)';
                          }
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = errors.password && touched.password
                            ? 'rgba(239,68,68,0.4)'
                            : 'rgba(255,255,255,0.08)';
                          e.target.style.boxShadow = 'none';
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="tw:absolute tw:right-3.5 tw:top-1/2 tw:-translate-y-1/2 tw:bg-transparent tw:border-none tw:cursor-pointer tw:p-0 tw:text-gray-600 tw:flex tw:items-center"
                      >
                        {showPassword
                          ? <EyeOff className="tw:w-4.5 tw:h-4.5" />
                          : <Eye className="tw:w-4.5 tw:h-4.5" />
                        }
                      </button>
                    </div>
                    <ErrorMessage name="password">
                      {(msg) => (
                        <div className="tw:text-xs tw:text-red-400 tw:mt-1.5 tw:pl-1">{msg}</div>
                      )}
                    </ErrorMessage>
                  </motion.div>

                  {/* Remember & Forgot */}
                  <motion.div variants={itemVariants} className="tw:flex tw:items-center tw:justify-between tw:mb-7">
                    <label className="tw:flex tw:items-center tw:gap-2 tw:cursor-pointer tw:text-[13px] tw:text-gray-400">
                      <input
                        type="checkbox"
                        className="tw:w-4 tw:h-4 tw:cursor-pointer"
                        style={{ accentColor: '#B3D335' }}
                      />
                      Remember me
                    </label>
                    <Link
                      to="/auth/forgotPwd"
                      className="tw:text-[13px] tw:font-medium tw:no-underline tw:transition-opacity tw:duration-200 hover:tw:opacity-80"
                      style={{ color: '#B3D335' }}
                    >
                      Forgot Password?
                    </Link>
                  </motion.div>

                  {/* Submit button */}
                  <motion.div variants={itemVariants}>
                    <BrandButton
                      type="submit"
                      loading={isPending}
                      loadingText="Signing in..."
                      fullWidth
                    >
                      Sign In
                      <ArrowRight className="tw:w-4.5 tw:h-4.5" />
                    </BrandButton>
                  </motion.div>
                </Form>
              )}
            </Formik>
          </div>
        </motion.div>

        {/* Footer text */}
        <motion.div
          variants={itemVariants}
          className="tw:text-center tw:mt-6 tw:text-[13px] tw:text-gray-600"
        >
          Powered by <span className="tw:text-gray-500 tw:font-medium">Skill Lens</span>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default LoginClient;
