import { motion } from 'framer-motion';
import { ArrowLeft, Bookmark, BookmarkCheck, MapPin, Minus, Plus, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { errorMessage } from '../api/client.js';
import { destinationsApi, tripsApi } from '../api/endpoints.js';
import Logo from '../components/Logo.jsx';
import PlanView from '../components/PlanView.jsx';
import Segmented from '../components/Segmented.jsx';
import { Button, Chip, Sheet, TextField } from '../components/ui.jsx';
import { useToast } from '../context/ToastContext.jsx';
import page from '../styles/page.module.css';
import styles from './NewTrip.module.css';

const INTERESTS = ['Playa', 'Surf', 'Naturaleza', 'Historia', 'Gastronomía', 'Aventura', 'Fotografía', 'Tranquilidad', 'Vida nocturna', 'Cultura local', 'Senderismo', 'Aguas termales'];

export default function NewTrip() {
  const navigate = useNavigate();
  const toast = useToast();
  const [params] = useSearchParams();

  const [destination, setDestination] = useState(params.get('destino') ?? '');
  const [days, setDays] = useState(Math.min(14, Math.max(1, Number(params.get('dias')) || 3)));
  const [interests, setInterests] = useState([]);
  const [budget, setBudget] = useState('Medio');
  const [travelers, setTravelers] = useState('Solo');
  const [pace, setPace] = useState('Relajado');

  const [suggestions, setSuggestions] = useState([]);
  const [plan, setPlan] = useState(null);
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(false);
  const [regenerating, setRegenerating] = useState(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    destinationsApi
      .list()
      .then(({ items }) => setSuggestions(items.slice(0, 8).map((d) => d.name)))
      .catch(() => {});
  }, []);

  const toggleInterest = (name) => setInterests((list) => (list.includes(name) ? list.filter((i) => i !== name) : [...list, name]));

  async function submit(event) {
    event.preventDefault();
    if (destination.trim().length < 2) return setError('Escribe un destino.');
    setError('');
    setLoading(true);
    const body = { destination: destination.trim(), days, interests, budget: budget.toLowerCase(), travelers: travelers.toLowerCase(), pace: pace.toLowerCase() };
    try {
      setPlan(await tripsApi.generate(body));
      setRequest(body);
      setSaved(false);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function regenerate(day, instruction) {
    setRegenerating(day);
    try {
      setPlan(await tripsApi.regenerateDay({ request, plan, day, instruction }));
      setSaved(false);
    } catch (err) {
      toast.show(errorMessage(err), 'error');
    } finally {
      setRegenerating(null);
    }
  }

  async function save() {
    try {
      await tripsApi.save({ request, plan });
      setSaved(true);
      toast.show('Viaje guardado.');
    } catch (err) {
      toast.show(errorMessage(err), 'error');
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.scroll}>
        <header className={page.hero}>
          <button type="button" className={page.iconButton} onClick={() => (plan ? setPlan(null) : window.history.state?.idx > 0 ? navigate(-1) : navigate('/viajes'))} aria-label={plan ? 'Editar los datos del viaje' : 'Volver'}>
            <ArrowLeft size={20} />
          </button>
          <h1 className={`${page.heroTitle} serif`} style={{ marginTop: 16 }}>
            {plan ? 'Tu ruta' : 'Planear viaje'}
          </h1>
          <p className={page.heroSub}>{plan ? 'Ajusta cada día a tu gusto y guárdalo.' : 'Cuéntanos qué te gusta y armamos el itinerario.'}</p>
        </header>

        <Sheet className={styles.sheet}>
          {plan ? (
            <>
              <PlanView plan={plan} onRegenerate={regenerate} regenerating={regenerating} />
              <div className={styles.actions}>
                <Button block variant={saved ? 'outline' : 'primary'} onClick={save} disabled={saved}>
                  {saved ? <BookmarkCheck size={18} aria-hidden="true" /> : <Bookmark size={18} aria-hidden="true" />}
                  {saved ? 'Viaje guardado' : 'Guardar viaje'}
                </Button>
                {saved && (
                  <Button block variant="ghost" to="/viajes">
                    Ver mis viajes
                  </Button>
                )}
              </div>
            </>
          ) : (
            <form onSubmit={submit} noValidate className={styles.form}>
              <div>
                <TextField label="Destino" icon={MapPin} value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="Ej: Santa Teresa" maxLength={100} />
                {suggestions.length > 0 && (
                  <div className={styles.suggest} role="group" aria-label="Destinos sugeridos">
                    {suggestions.map((s) => (
                      <Chip key={s} pressed={destination.trim() === s} onClick={() => setDestination(s)}>
                        {s}
                      </Chip>
                    ))}
                  </div>
                )}
              </div>

              <div className={styles.stepper}>
                <span className={styles.label} id="days-label">
                  Número de días
                </span>
                <div className={styles.stepControl} role="group" aria-labelledby="days-label">
                  <button type="button" onClick={() => setDays((d) => Math.max(1, d - 1))} disabled={days <= 1} aria-label="Menos días">
                    <Minus size={18} />
                  </button>
                  <output aria-live="polite">{days}</output>
                  <button type="button" onClick={() => setDays((d) => Math.min(14, d + 1))} disabled={days >= 14} aria-label="Más días">
                    <Plus size={18} />
                  </button>
                </div>
              </div>

              <fieldset className={styles.fieldset}>
                <legend className={styles.label}>¿Qué te gusta?</legend>
                <div className={styles.interests}>
                  {INTERESTS.map((i) => (
                    <Chip key={i} pressed={interests.includes(i)} onClick={() => toggleInterest(i)}>
                      {i}
                    </Chip>
                  ))}
                </div>
              </fieldset>

              <Segmented label="Presupuesto" options={['Económico', 'Medio', 'Alto']} value={budget} onChange={setBudget} />
              <Segmented label="Viajo" options={['Solo', 'En pareja', 'En familia', 'Con amigos']} value={travelers} onChange={setTravelers} />
              <Segmented label="Ritmo" options={['Relajado', 'Moderado', 'Intenso']} value={pace} onChange={setPace} />

              {error && (
                <p className={styles.error} role="alert">
                  {error}
                </p>
              )}
              <Button type="submit" block loading={loading}>
                <Sparkles size={18} aria-hidden="true" />
                Crear itinerario
              </Button>
            </form>
          )}
        </Sheet>
      </div>

      {loading && (
        <motion.div className={styles.loading} initial={{ opacity: 0 }} animate={{ opacity: 1 }} role="status" aria-live="polite">
          <motion.div animate={{ rotate: [0, 14, -10, 0] }} transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}>
            <Logo size={88} />
          </motion.div>
          <p className="serif">Armando tu ruta…</p>
          <small>Esto puede tardar unos segundos.</small>
        </motion.div>
      )}
    </div>
  );
}
