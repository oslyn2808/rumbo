import { motion } from 'framer-motion';
import { Plus, Route as RouteIcon } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { errorMessage } from '../api/client.js';
import { tripsApi } from '../api/endpoints.js';
import Logo from '../components/Logo.jsx';
import { Badge, Button, Sheet } from '../components/ui.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useAsync } from '../hooks/useAsync.js';
import page from '../styles/page.module.css';
import styles from './Trips.module.css';

const savedOn = (iso) =>
  new Date(`${iso.replace(' ', 'T')}Z`).toLocaleDateString('es-CR', { day: 'numeric', month: 'short', year: 'numeric' });

export default function Trips() {
  const toast = useToast();
  const { data, loading, error, reload } = useAsync(() => tripsApi.list());
  const [confirming, setConfirming] = useState(null);

  async function remove(id) {
    try {
      await tripsApi.remove(id);
      setConfirming(null);
      reload();
      toast.show('Viaje eliminado.');
    } catch (err) {
      toast.show(errorMessage(err), 'error');
    }
  }

  const trips = data ?? [];

  return (
    <div className={page.page}>
      <header className={page.hero}>
        <div className={page.heroRow}>
          <div>
            <h1 className={`${page.heroTitle} serif`}>Mis viajes</h1>
            <p className={page.heroSub}>Tus rutas guardadas.</p>
          </div>
          <Link to="/viajes/nuevo" className={page.iconButton} aria-label="Planear un viaje nuevo">
            <Plus size={22} />
          </Link>
        </div>
      </header>

      <Sheet className={page.grow}>
        {loading && <p className={page.empty} role="status">Cargando tus viajes</p>}
        {error && (
          <div className={page.empty} role="alert">
            <p>{error}</p>
            <Button variant="outline" size="small" onClick={reload} style={{ marginTop: 12 }}>
              Reintentar
            </Button>
          </div>
        )}

        {!loading && !error && trips.length === 0 && (
          <div className={styles.emptyState}>
            <span className={styles.emptyLogo}>
              <Logo size={64} />
            </span>
            <h2 className="serif">Aún no tienes viajes</h2>
            <p className={page.muted}>Crea tu primera ruta y guárdala aquí.</p>
            <Button to="/viajes/nuevo">
              <Plus size={18} aria-hidden="true" />
              Planear un viaje
            </Button>
          </div>
        )}

        <div className={page.stack}>
          {trips.map((t, i) => (
            <motion.article key={t.id} className={styles.card} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 6) * 0.05 }}>
              <div className={styles.top}>
                <span className={styles.icon}>
                  <RouteIcon size={20} aria-hidden="true" />
                </span>
                <div className={styles.text}>
                  <h2 className={styles.title}>{t.plan.title}</h2>
                  <p className={page.muted}>
                    {t.plan.route?.places?.length ? t.plan.route.places.join(' → ') : t.destination}
                    {t.plan.route?.approxKm ? ` · ${t.plan.route.approxKm} km en línea recta` : ''}
                  </p>
                </div>
              </div>
              <div className={styles.meta}>
                <Badge>
                  {t.days} {t.days === 1 ? 'día' : 'días'}
                </Badge>
                <span className={page.muted}>Guardado el {savedOn(t.createdAt)}</span>
              </div>
              <div className={styles.actions}>
                {confirming === t.id ? (
                  <>
                    <Button variant="danger" size="small" onClick={() => remove(t.id)}>
                      Sí, eliminar
                    </Button>
                    <Button variant="ghost" size="small" onClick={() => setConfirming(null)}>
                      Cancelar
                    </Button>
                  </>
                ) : (
                  <>
                    <Button size="small" to={`/viajes/${t.id}`}>
                      Abrir
                    </Button>
                    <Button variant="ghostDanger" size="small" onClick={() => setConfirming(t.id)}>
                      Eliminar
                    </Button>
                  </>
                )}
              </div>
            </motion.article>
          ))}
        </div>
      </Sheet>
    </div>
  );
}
