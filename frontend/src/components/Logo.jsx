import { motion } from 'framer-motion';

// Marca de Rumbo: una brujula. La aguja norte es el acento de la marca.
export default function Logo({ size = 48, animated = false, className }) {
  const draw = animated
    ? { initial: { pathLength: 0, opacity: 0 }, animate: { pathLength: 1, opacity: 1 }, transition: { duration: 1.1, ease: 'easeInOut' } }
    : {};
  const needle = animated
    ? {
        initial: { rotate: -140, opacity: 0 },
        animate: { rotate: 0, opacity: 1 },
        transition: { type: 'spring', stiffness: 70, damping: 9, delay: 0.7 },
      }
    : {};
  const fade = (delay) =>
    animated ? { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { delay, duration: 0.4 } } : {};

  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} role="img" aria-label="Rumbo" fill="none">
      <motion.circle cx="32" cy="32" r="27" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" {...draw} />
      {[0, 90, 180, 270].map((deg, i) => (
        <motion.line
          key={deg}
          x1="32"
          y1="7"
          x2="32"
          y2="12"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          transform={`rotate(${deg} 32 32)`}
          {...fade(0.9 + i * 0.08)}
        />
      ))}
      <motion.g style={{ transformOrigin: '32px 32px' }} {...needle}>
        <path d="M32 13 L39 32 L25 32 Z" fill="var(--mint)" />
        <path d="M32 51 L39 32 L25 32 Z" fill="currentColor" fillOpacity="0.85" />
        <circle cx="32" cy="32" r="2.8" fill="var(--ink-900)" />
      </motion.g>
    </svg>
  );
}
