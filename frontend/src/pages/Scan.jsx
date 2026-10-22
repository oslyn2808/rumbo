import { AnimatePresence, motion } from 'framer-motion';
import { Bookmark, BookmarkCheck, Camera, Image as ImageIcon, Info, ScanLine, TriangleAlert } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { errorMessage } from '../api/client.js';
import { monumentsApi } from '../api/endpoints.js';
import { Badge, Button, Note, Sheet } from '../components/ui.jsx';
import { useToast } from '../context/ToastContext.jsx';
import page from '../styles/page.module.css';
import { getPosition, prepareImage } from '../utils/image.js';
import styles from './Scan.module.css';

export default function Scan() {
  const toast = useToast();
  const cameraRef = useRef(null);
  const galleryRef = useRef(null);

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [useGps, setUseGps] = useState(true);
  const [busy, setBusy] = useState('');
  const [result, setResult] = useState(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!file) return undefined;
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const pick = (event) => {
    const chosen = event.target.files?.[0];
    event.target.value = '';
    if (!chosen) return;
    setFile(chosen);
    setResult(null);
    setSaved(false);
    setError('');
  };

  async function identify() {
    setError('');
    setResult(null);
    setSaved(false);
    try {
      setBusy('Preparando la foto');
      const blob = await prepareImage(file).catch(() => {
        throw new Error('No se pudo leer esa imagen. Prueba con una foto JPG o PNG.');
      });

      const form = new FormData();
      form.append('photo', blob, 'foto.jpg');
      if (useGps) {
        setBusy('Obteniendo tu ubicación');
        const pos = await getPosition();
        if (pos) {
          form.append('lat', String(pos.lat));
          form.append('lon', String(pos.lon));
        }
      }
      setBusy('Analizando el monumento');
      setResult(await monumentsApi.identify(form));
    } catch (err) {
      setError(err.response ? errorMessage(err) : err.message || errorMessage(err));
    } finally {
      setBusy('');
    }
  }

  async function save() {
    try {
      await monumentsApi.save({ name: result.name, location: result.location, info: result });
      setSaved(true);
      toast.show('Guardado en tu diario.');
    } catch (err) {
      toast.show(errorMessage(err), 'error');
    }
  }

  const reset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError('');
  };

  return (
    <div className={page.page}>
      <header className={page.hero}>
        <h1 className={`${page.heroTitle} serif`}>Escanear</h1>
        <p className={page.heroSub}>Toma una foto de un monumento y conoce su historia.</p>
      </header>

      <Sheet className={page.grow}>
        <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={pick} />
        <input ref={galleryRef} type="file" accept="image/*" hidden onChange={pick} />

        {!preview ? (
          <div className={styles.start}>
            <motion.button type="button" className={styles.shutter} onClick={() => cameraRef.current?.click()} whileTap={{ scale: 0.94 }} aria-label="Tomar una foto">
              <span className={styles.ring} aria-hidden="true" />
              <Camera size={38} aria-hidden="true" />
            </motion.button>
            <p className={styles.startText}>Toca para abrir la cámara</p>
            <Button variant="outline" onClick={() => galleryRef.current?.click()}>
              <ImageIcon size={18} aria-hidden="true" />
              Elegir de la galería
            </Button>
          </div>
        ) : (
          <>
            <div className={styles.frame}>
              <img src={preview} alt="Foto seleccionada" className={styles.photo} />
              {busy && <motion.span className={styles.scanLine} animate={{ top: ['4%', '92%', '4%'] }} transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }} aria-hidden="true" />}
            </div>

            <label className={styles.switchRow}>
              <input type="checkbox" checked={useGps} onChange={(e) => setUseGps(e.target.checked)} disabled={Boolean(busy)} />
              <span>
                <strong>Usar mi ubicación</strong>
                <small>Ayuda a identificar el lugar con más precisión.</small>
              </span>
            </label>

            <div className={styles.actions}>
              <Button block loading={Boolean(busy)} onClick={identify}>
                <ScanLine size={18} aria-hidden="true" />
                {busy || 'Identificar'}
              </Button>
              <Button variant="outline" onClick={reset} disabled={Boolean(busy)}>
                Otra foto
              </Button>
            </div>
          </>
        )}

        {error && (
          <p className={styles.error} role="alert">
            <TriangleAlert size={18} aria-hidden="true" />
            {error}
          </p>
        )}

        <AnimatePresence>
          {result && (
            <motion.article className={styles.result} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} aria-live="polite">
              {result.demo && <Note icon={Info}>Resultado de ejemplo del modo demo. Activa la IA para identificar tus propias fotos.</Note>}

              {!result.identified ? (
                <>
                  <h2 className={`${styles.name} serif`}>No pude identificar el lugar</h2>
                  <p>{result.summary || 'Prueba con otra foto, más cercana y con buena luz.'}</p>
                </>
              ) : (
                <>
                  <div className={styles.badges}>
                    <Badge tone={result.confidence === 'alta' ? 'good' : result.confidence === 'baja' ? 'warn' : undefined}>Confianza {result.confidence}</Badge>
                    {result.yearBuilt && <Badge>{result.yearBuilt}</Badge>}
                    {result.style && <Badge>{result.style}</Badge>}
                  </div>
                  <h2 className={`${styles.name} serif`}>{result.name}</h2>
                  {result.location && <p className={page.muted}>{result.location}</p>}
                  {result.confidence === 'baja' && <Note icon={TriangleAlert}>No estoy seguro de este resultado. Verifica los datos antes de confiar en ellos.</Note>}
                  {result.summary && <p>{result.summary}</p>}
                  {result.history && (
                    <>
                      <h3 className={styles.h3}>Historia</h3>
                      <p>{result.history}</p>
                    </>
                  )}
                  {result.funFacts.length > 0 && (
                    <>
                      <h3 className={styles.h3}>Datos curiosos</h3>
                      <ul className={styles.list}>
                        {result.funFacts.map((f) => (
                          <li key={f}>{f}</li>
                        ))}
                      </ul>
                    </>
                  )}
                  {result.visitTips && (
                    <>
                      <h3 className={styles.h3}>Para visitar</h3>
                      <p>{result.visitTips}</p>
                    </>
                  )}
                  <Button block variant={saved ? 'outline' : 'primary'} onClick={save} disabled={saved}>
                    {saved ? <BookmarkCheck size={18} aria-hidden="true" /> : <Bookmark size={18} aria-hidden="true" />}
                    {saved ? 'Guardado en tu diario' : 'Guardar en mi diario'}
                  </Button>
                </>
              )}
            </motion.article>
          )}
        </AnimatePresence>
      </Sheet>
    </div>
  );
}
