import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { destinationsApi } from '../api/endpoints.js';
import { markIntroSeen } from '../components/RouteGuards.jsx';
import { sceneVariant } from '../components/DestinationCard.jsx';
import Scene from '../components/Scene.jsx';
import { Button } from '../components/ui.jsx';
import { useAsync } from '../hooks/useAsync.js';
import styles from './Intro.module.css';

export default function Intro() {
  const navigate = useNavigate();
  const { data } = useAsync(() => destinationsApi.list());
  const items = data?.items ?? [];
  const columns = [0, 1, 2].map((c) => items.filter((_, i) => i % 3 === c));

  const start = () => {
    markIntroSeen();
    navigate('/explorar', { replace: true });
  };

  return (
    <div className={styles.page}>
      <div className={styles.collage} aria-hidden="true">
        {columns.map((col, c) => (
          <motion.div
            key={c}
            className={styles.column}
            initial={{ y: c === 1 ? -40 : 0 }}
            animate={{ y: c === 1 ? [-40, -150, -40] : [0, -110, 0] }}
            transition={{ duration: 22 + c * 5, repeat: Infinity, ease: 'easeInOut' }}
          >
            {[...col, ...col].map((d, i) => (
              <div key={`${d.id}-${i}`} className={styles.tile}>
                <Scene kind={d.scene} condition="sunny" variant={sceneVariant(d.id)} animated={false} className={styles.scene} label="" />
              </div>
            ))}
          </motion.div>
        ))}
      </div>
      <div className={styles.fade} aria-hidden="true" />

      <motion.div className={styles.content} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
        <h1 className={`${styles.title} serif`}>Tu próxima aventura, a un toque.</h1>
        <p className={styles.text}>Playas, volcanes y rutas pensadas para tu estilo, para que planees menos y vivas más.</p>
        <Button variant="mint" block onClick={start}>
          Comenzar
        </Button>
        <p className={styles.foot}>{data ? `${data.total} destinos` : 'Destinos de Costa Rica'} · itinerarios con IA · reconoce monumentos</p>
      </motion.div>
    </div>
  );
}
