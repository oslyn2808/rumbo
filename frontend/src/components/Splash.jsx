import { motion, useReducedMotion } from 'framer-motion';
import { useEffect } from 'react';
import Topography from './Topography.jsx';
import Logo from './Logo.jsx';
import styles from './Splash.module.css';

// Animacion de entrada: la brujula se dibuja, la aguja se acomoda y aparece el nombre.
export default function Splash({ onDone }) {
  const reduce = useReducedMotion();

  useEffect(() => {
    const t = setTimeout(onDone, reduce ? 700 : 3100);
    return () => clearTimeout(t);
  }, [onDone, reduce]);

  return (
    <motion.div
      className={styles.splash}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      onClick={onDone}
      role="presentation"
    >
      <motion.div className={styles.grid} initial={{ opacity: 0, scale: 1.06 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.6, ease: [0.23, 1, 0.32, 1] }}>
        <Topography className={styles.contours} color="#5bd6ac" lineCount={20} glow={0.7} speed={0.3} tilt={34} fog={0.4} mouseInteraction={false} dpr={1} />
      </motion.div>
      <div className={styles.center}>
        <div className={styles.logo}>
          <Logo size={132} animated={!reduce} />
        </div>
        <motion.h1
          className={`${styles.word} serif`}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: reduce ? 0 : 1.5, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          Rumbo
        </motion.h1>
        <motion.p
          className={styles.tag}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: reduce ? 0 : 2.0, duration: 0.7 }}
        >
          Descubre Costa Rica a tu ritmo.
        </motion.p>
      </div>
      <button type="button" className={styles.skip} onClick={onDone}>
        Saltar
      </button>
    </motion.div>
  );
}
