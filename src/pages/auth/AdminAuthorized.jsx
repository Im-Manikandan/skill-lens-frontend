// Imports
import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router';

import { ReactComponent as LogoDarkText } from '../../assets/images/logos/skill_lens_logo_text.svg';
import { ReactComponent as LeftBg } from '../../assets/images/bg/login-bgleft.svg';
import { ReactComponent as RightBg } from '../../assets/images/bg/login-bg-right.svg';

// Animation Variants
const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

const spinnerVariants = {
  animate: {
    rotate: 360,
    transition: { duration: 1.2, repeat: Infinity, ease: 'linear' },
  },
};

const AdminAuthorized = () => {
  const navigate = useNavigate();

  // Redirect to Admin Dashboard After Delay
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/admin/dashboard');
    }, 1000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div
      className="tw:relative tw:flex tw:min-h-screen tw:items-center tw:justify-center tw:overflow-hidden tw:p-5"
      style={{ background: 'linear-gradient(135deg, #0a0a0f 0%, #0d1117 40%, #0a0f1a 70%, #080b12 100%)' }}
    >
      {/* Background SVGs */}
      <LeftBg className="tw:absolute tw:left-0 tw:bottom-0 tw:pointer-events-none tw:opacity-30" />
      <RightBg className="tw:absolute tw:right-0 tw:top-0 tw:pointer-events-none tw:opacity-30" />

      {/* Ambient Background Orbs */}
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

      {/* Subtle Grid Pattern */}
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
        {/* Glass Card */}
        <motion.div variants={itemVariants}>
          <div
            className="tw:rounded-3xl tw:backdrop-blur-[20px]"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              padding: '48px 36px',
              boxShadow: '0 8px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)',
            }}
          >
            {/* Logo */}
            <motion.div variants={itemVariants} className="tw:flex tw:flex-col tw:items-center tw:mb-8">
              <div className="tw:mb-3 tw:flex tw:justify-center">
                <LogoDarkText style={{ height: 56 }} />
              </div>
            </motion.div>

            {/* Loading Spinner */}
            <motion.div variants={itemVariants} className="tw:flex tw:justify-center tw:mb-6">
              <motion.div
                variants={spinnerVariants}
                animate="animate"
                className="tw:w-12 tw:h-12 tw:rounded-full"
                style={{
                  border: '3px solid rgba(255,255,255,0.06)',
                  borderTopColor: '#B3D335',
                }}
              />
            </motion.div>

            {/* Authorization Status Text */}
            <motion.div variants={itemVariants} className="tw:text-center">
              <div className="tw:flex tw:items-center tw:justify-center tw:gap-2 tw:mb-2">
                <ShieldCheck className="tw:w-5 tw:h-5 tw:text-gray-400" />
                <span className="tw:text-lg tw:font-semibold tw:text-slate-200">Authorizing...</span>
              </div>
              <p className="tw:text-sm tw:text-gray-500 tw:m-0">
                You will be redirected shortly
              </p>
            </motion.div>
          </div>
        </motion.div>

        {/* Footer */}
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

export default AdminAuthorized;
