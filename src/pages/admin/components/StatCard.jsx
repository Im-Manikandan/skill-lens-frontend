import { motion } from 'framer-motion';

export default function StatCard({ icon: Icon, label, value, color, animationY = 20 }) {
  // Animation Variants
  const itemVariants = {
    hidden: { opacity: 0, y: animationY },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
  };

  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
    >
      <div
        className="tw:rounded-xl tw:py-3 tw:px-4 tw:relative tw:overflow-hidden tw:cursor-default"
        style={{
          background: `linear-gradient(135deg, ${color}12 0%, ${color}05 100%)`,
          border: `1px solid ${color}20`,
        }}
      >
        <div
          className="tw:absolute tw:-top-4 tw:-right-4 tw:w-16 tw:h-16 tw:rounded-full"
          style={{ background: `radial-gradient(circle, ${color}15, transparent 70%)` }}
        />
        <div className="tw:flex tw:items-center tw:gap-2.5 tw:relative tw:z-10">
          <div
            className="tw:w-9 tw:h-9 tw:rounded-lg tw:flex tw:items-center tw:justify-center tw:shrink-0"
            style={{
              background: `linear-gradient(135deg, ${color}25, ${color}10)`,
              border: `1px solid ${color}30`,
            }}
          >
            <Icon className="tw:w-4.5 tw:h-4.5" style={{ color }} />
          </div>
          <div>
            <div className="tw:text-xl tw:font-bold tw:text-white tw:leading-none">
              {value}
            </div>
            <div className="tw:text-[10px] tw:text-gray-500 tw:uppercase tw:tracking-wide tw:font-medium tw:mt-0.5">
              {label}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
