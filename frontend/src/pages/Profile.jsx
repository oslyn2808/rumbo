import { Landmark, LogOut, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { errorMessage } from '../api/client.js';
import { healthApi, monumentsApi, tripsApi } from '../api/endpoints.js';
import { Badge, Button, Note, Sheet } from '../components/ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useAsync } from '../hooks/useAsync.js';
import page from '../styles/page.module.css';
import { initials } from '../utils/format.js';
import styles from './Profile.module.css';

export default function Profile() {
  const { user, logout } = useAuth();
  const toast = useToast();
  const trips = useAsync(() => tripsApi.list());
  const monuments = useAsync(() => monumentsApi.list());
  const health = useAsync(() => healthApi.get());
  const [confirming, setConfirming] = useState(null);

  async function removeMonument(id) {
    try {
      await monumentsApi.remove(id);
      setConfirming(null);
      monuments.reload();
      toast.show('Monumento eliminado del diario.');
    } catch (err) {
      toast.show(errorMessage(err), 'error');
    }
  }

  const list = monuments.data ?? [];

  return (
    <div className={page.page}>
      <header className={`${page.hero} ${styles.hero}`}>
        <span className={styles.avatar} aria-hidden="true">
          {initials(user?.name)}
        </span>
        <h1 className={`${page.heroTitle} serif`}>{user?.name}</h1>
        <p className={page.heroSub}>{user?.email}</p>
      </header>

      <Sheet className={page.grow}>
        <dl className={styles.stats}>
          <div>
            <dt>Viajes guardados</dt>
            <dd>{trips.data?.length ?? '–'}</dd>
          </div>
          <div>
            <dt>Monumentos</dt>
            <dd>{monuments.data?.length ?? '–'}</dd>
          </div>
        </dl>

        <h2 className={`${page.sectionTitle} serif`} style={{ marginTop: 28 }}>
          Mi diario de monumentos
        </h2>
        {monuments.loading && <p className={page.empty} role="status">Cargando</p>}
        {monuments.error && (
          <p className={page.empty} role="alert">
            {monuments.error}
          </p>
        )}
        {!monuments.loading && !monuments.error && list.length === 0 && <p className={`${page.empty} ${page.muted}`}>Aún no has guardado monumentos. Escanea uno para empezar.</p>}
        <ul className={styles.list}>
          {list.map((m) => (
            <li key={m.id} className={styles.item}>
              <span className={styles.itemIcon}>
                <Landmark size={20} aria-hidden="true" />
              </span>
              <div className={styles.itemText}>
                <strong>{m.name}</strong>
                {m.location && <span className={page.muted}>{m.location}</span>}
                {m.info?.demo && <Badge tone="warn">Ejemplo</Badge>}
              </div>
              {confirming === m.id ? (
                <div className={styles.confirm}>
                  <Button variant="danger" size="small" onClick={() => removeMonument(m.id)}>
                    Eliminar
                  </Button>
                  <Button variant="ghost" size="small" onClick={() => setConfirming(null)}>
                    Cancelar
                  </Button>
                </div>
              ) : (
                <button type="button" className={styles.trash} onClick={() => setConfirming(m.id)} aria-label={`Eliminar ${m.name}`}>
                  <Trash2 size={18} />
                </button>
              )}
            </li>
          ))}
        </ul>

        {health.data?.demoMode && (
          <div style={{ marginTop: 24 }}>
            <Note>La IA está en modo demo: los itinerarios y la identificación de monumentos usan ejemplos. Agrega tu clave en el archivo .env del backend para activarla.</Note>
          </div>
        )}

        <Button variant="outline" block onClick={logout} style={{ marginTop: 28 }}>
          <LogOut size={18} aria-hidden="true" />
          Cerrar sesión
        </Button>
      </Sheet>
    </div>
  );
}
