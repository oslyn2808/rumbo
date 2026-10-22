import { ArrowLeft, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { errorMessage } from '../api/client.js';
import { tripsApi } from '../api/endpoints.js';
import PlanView from '../components/PlanView.jsx';
import { Button, Sheet } from '../components/ui.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useAsync } from '../hooks/useAsync.js';
import page from '../styles/page.module.css';
import styles from './NewTrip.module.css';

export default function TripDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { data, loading, error } = useAsync(() => tripsApi.get(id), [id]);
  const [confirming, setConfirming] = useState(false);

  async function remove() {
    try {
      await tripsApi.remove(id);
      toast.show('Viaje eliminado.');
      navigate('/viajes', { replace: true });
    } catch (err) {
      toast.show(errorMessage(err), 'error');
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.scroll}>
        <header className={page.hero}>
          <button type="button" className={page.iconButton} onClick={() => navigate('/viajes')} aria-label="Volver a mis viajes">
            <ArrowLeft size={20} />
          </button>
          <h1 className={`${page.heroTitle} serif`} style={{ marginTop: 16 }}>
            Viaje guardado
          </h1>
          {data && (
            <p className={page.heroSub}>
              {data.destination} · {data.days} {data.days === 1 ? 'día' : 'días'}
            </p>
          )}
        </header>

        <Sheet className={styles.sheet}>
          {loading && <p className={page.empty} role="status">Cargando el viaje</p>}
          {error && (
            <div className={page.empty} role="alert">
              <p>{error}</p>
              <Button variant="outline" size="small" to="/viajes" style={{ marginTop: 12 }}>
                Volver a mis viajes
              </Button>
            </div>
          )}
          {data && (
            <>
              <PlanView plan={data.plan} />
              <div className={styles.actions}>
                {confirming ? (
                  <>
                    <Button variant="danger" block onClick={remove}>
                      Sí, eliminar este viaje
                    </Button>
                    <Button variant="ghost" block onClick={() => setConfirming(false)}>
                      Cancelar
                    </Button>
                  </>
                ) : (
                  <Button variant="outline" block onClick={() => setConfirming(true)}>
                    <Trash2 size={18} aria-hidden="true" />
                    Eliminar viaje
                  </Button>
                )}
              </div>
            </>
          )}
        </Sheet>
      </div>
    </div>
  );
}
