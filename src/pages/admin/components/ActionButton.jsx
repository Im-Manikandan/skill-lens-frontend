import { motion } from 'framer-motion';
import { Spinner } from 'reactstrap';

export default function ActionButton({ icon: Icon, color, onClick, title, disabled = false, loading = false }) {
  // Derived State
  const isDisabled = disabled || loading;

  return (
    <motion.button
      whileHover={isDisabled ? {} : { scale: 1.1 }}
      whileTap={isDisabled ? {} : { scale: 0.9 }}
      onClick={onClick}
      disabled={isDisabled}
      title={title}
      className={`tw:w-9 tw:h-9 tw:rounded-[10px] tw:border-none tw:flex tw:items-center tw:justify-center tw:transition-all tw:duration-200 tw:ease-in-out ${isDisabled ? 'tw:cursor-default tw:opacity-50' : 'tw:cursor-pointer tw:opacity-100'}`}
      style={{
        background: `${color}1a`,
        color,
      }}
      onMouseEnter={e => {
        if (!isDisabled) {
          e.currentTarget.style.background = `${color}33`;
          e.currentTarget.style.boxShadow = `0 0 16px ${color}33`;
        }
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = `${color}1a`;
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {loading
        ? <Spinner size="sm" className="tw:w-4 tw:h-4" />
        : <Icon className="tw:w-4 tw:h-4" />
      }
    </motion.button>
  );
}
