// Imports
import { motion } from 'framer-motion';

export default function BrandButton({
  children,
  type = 'button',
  loading = false,
  disabled = false,
  loadingText = 'Loading...',
  compact = false,
  fullWidth = false,
  onClick,
  className = '',
  style,
  ...rest
}) {
  // Derived State
  const isDisabled = disabled || loading;
  // Size Variants
  const sizeClasses = compact ? 'tw:py-2 tw:px-5 tw:text-[14px]' : 'tw:py-3.5 tw:px-6 tw:text-[15px]';

  // Button Rendering
  return (
    <motion.button
      type={type}
      disabled={isDisabled}
      onClick={onClick}
      whileHover={isDisabled ? {} : { scale: 1.02 }}
      whileTap={isDisabled ? {} : { scale: 0.98 }}
      className={`tw:flex tw:items-center tw:justify-center tw:gap-2 ${sizeClasses} tw:rounded-[10px] tw:border-none tw:text-white tw:font-semibold tw:transition-all tw:duration-300 tw:ease-in-out ${fullWidth ? 'tw:w-full' : ''} ${isDisabled ? 'tw:cursor-not-allowed' : 'tw:cursor-pointer'} ${className}`}
      style={{
        background: isDisabled
          ? 'rgba(179,211,53,0.3)'
          : 'linear-gradient(135deg, #9ACA3C, #B3D335)',
        boxShadow: '0 4px 24px rgba(154,202,60,0.3)',
        borderRadius: 10,
        ...style,
      }}
      {...rest}
    >
      {/* Loading State or Children */}
      {loading ? (
        <>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="tw:w-4.5 tw:h-4.5 tw:rounded-full tw:border-2 tw:border-white/30 tw:border-t-white"
          />
          {loadingText}
        </>
      ) : (
        children
      )}
    </motion.button>
  );
}
