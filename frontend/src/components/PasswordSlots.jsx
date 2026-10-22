import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Check, CircleAlert } from 'lucide-react';
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import ui from './ui.module.css';
import s from './PasswordSlots.module.css';

// Campo de contrasena con casillas (inspirado en CodeSlots de React Bits).
// Cada letra cae en su casilla con un resorte y a los pocos milisegundos se vuelve un punto.
// status="error" vacia las casillas de la ultima a la primera en rojo y luego borra la clave;
// status="success" las une en una sola franja con un check.
// Debajo hay un <input> real e invisible: teclado del celular, autocompletado y gestores de claves funcionan igual.

const VISIBLE = 8; // casillas que caben a la vez; si la clave es mas larga, la fila se desliza
const GAP = 6;
const SETTLE = 0.32; // segundos que tarda una letra en caer o vaciarse
const CASCADE = 0.03; // segundos entre casillas cuando entran o salen varias juntas
const REVEAL_MS = 450; // tiempo que la letra se ve antes de volverse punto

const commonPrefix = (a, b) => {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i += 1;
  return i;
};

function Slot({ char, landDelay, drainDelay, draining, reveal, active, reduce }) {
  const [shown, setShown] = useState(char);
  const [fresh, setFresh] = useState(false);

  useEffect(() => {
    if (!char) return undefined;
    setShown(char);
    setFresh(true);
    const t = setTimeout(() => setFresh(false), REVEAL_MS + landDelay * 1000);
    return () => clearTimeout(t);
    // Solo cuando cambia la letra de esta casilla.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [char]);

  const filled = Boolean(char) && !draining;
  const plain = reveal || fresh;
  const spring = (delay, bounce) => (reduce ? { duration: 0 } : { type: 'spring', duration: SETTLE, bounce, delay });

  return (
    <span className={s.slot} data-active={active ? '' : undefined} aria-hidden="true">
      <motion.span className={s.fill} initial={false} animate={{ scale: filled ? 1 : 0 }} transition={filled ? spring(landDelay, 0.35) : spring(draining ? drainDelay : 0, 0)} />
      <AnimatePresence initial={false}>
        {filled && (
          <motion.span
            key={plain ? `c-${shown}` : 'dot'}
            className={s.glyph}
            initial={{ y: plain ? 10 : 0, opacity: 0, scale: plain ? 0.7 : 0.4 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5, transition: { duration: reduce ? 0 : 0.12 } }}
            transition={spring(fresh ? landDelay : 0, 0.4)}
          >
            {plain ? shown : <span className={s.dot} />}
          </motion.span>
        )}
      </AnimatePresence>
      {active && <span className={s.caret} />}
    </span>
  );
}

export default function PasswordSlots({ label, value, onChange, status = 'idle', reveal = false, error, trailing, minSlots = VISIBLE, id, ...inputProps }) {
  const reduce = useReducedMotion();
  const auto = useId();
  const inputId = id ?? auto;
  const errorId = `${inputId}-error`;
  const viewRef = useRef(null);
  const [slotW, setSlotW] = useState(36);
  const [focused, setFocused] = useState(false);
  const [draining, setDraining] = useState(false);

  // Las letras nuevas (al escribir, pegar o autocompletar) caen en cascada desde la primera distinta.
  const prev = useRef(value);
  const from = commonPrefix(prev.current, value);
  useEffect(() => {
    prev.current = value;
  }, [value]);

  // Ancho de casilla para que entren VISIBLE casillas en el espacio disponible.
  useLayoutEffect(() => {
    const el = viewRef.current;
    if (!el) return undefined;
    const measure = () => setSlotW(Math.max(24, (el.clientWidth - (VISIBLE - 1) * GAP) / VISIBLE));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Error: vaciar de la ultima a la primera y despues borrar la clave.
  useEffect(() => {
    if (status !== 'error' || !value) return undefined;
    setDraining(true);
    const ms = reduce ? 200 : ((value.length - 1) * CASCADE + SETTLE) * 1000 + 120;
    const t = setTimeout(() => {
      setDraining(false);
      onChange('');
    }, ms);
    return () => clearTimeout(t);
    // Solo al entrar en estado de error.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const success = status === 'success';
  const count = Math.max(minSlots, value.length + 1);
  const pitch = slotW + GAP;
  const offset = Math.max(0, Math.min(value.length + 1, count) - VISIBLE);
  const activeIndex = focused && !success && !draining ? value.length : -1;

  // Siempre escribir al final: si el cursor se mueve sin seleccionar, vuelve al final.
  const keepCaretAtEnd = (e) => {
    const el = e.currentTarget;
    const n = el.value.length;
    if (el.selectionStart === el.selectionEnd && el.selectionStart !== n) el.setSelectionRange(n, n);
  };

  return (
    <div className={ui.field}>
      <label className={ui.label} htmlFor={inputId}>
        {label}
      </label>
      <div className={s.control}>
        <div ref={viewRef} className={s.view} data-status={draining ? 'error' : status} style={{ '--slot-w': `${slotW}px`, '--gap': `${GAP}px` }}>
          <motion.div className={s.track} initial={false} animate={{ x: -offset * pitch }} transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 380, damping: 34 }}>
            {Array.from({ length: count }, (_, i) => (
              <Slot
                key={i}
                char={value[i] ?? ''}
                landDelay={reduce || i < from ? 0 : (i - from) * CASCADE}
                drainDelay={(value.length - 1 - i) * CASCADE}
                draining={draining}
                reveal={reveal}
                active={i === activeIndex}
                reduce={reduce}
              />
            ))}
          </motion.div>

          <motion.span
            className={s.wash}
            aria-hidden="true"
            initial={false}
            animate={{ clipPath: success ? 'inset(0% 0% round 12px)' : 'inset(0% 50% round 12px)', opacity: success ? 1 : 0 }}
            transition={{ duration: reduce ? 0 : 0.3, ease: [0.23, 1, 0.32, 1] }}
          >
            <motion.span initial={false} animate={success ? { y: 0, scale: 1, opacity: 1 } : { y: 8, scale: 0.85, opacity: 0 }} transition={reduce ? { duration: 0 } : { type: 'spring', duration: 0.4, bounce: 0.35, delay: success ? 0.25 : 0 }}>
              <Check size={26} strokeWidth={2.6} />
            </motion.span>
          </motion.span>

          <input
            {...inputProps}
            id={inputId}
            className={s.input}
            type={reveal ? 'text' : 'password'}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onSelect={keepCaretAtEnd}
            readOnly={success || draining}
            spellCheck={false}
            autoCapitalize="none"
            aria-invalid={error || status === 'error' ? 'true' : undefined}
            aria-describedby={error ? errorId : undefined}
          />
        </div>
        {trailing}
      </div>
      {error && (
        <p id={errorId} className={ui.error} role="alert">
          <CircleAlert size={14} aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}

export const passwordSlotsStyles = s;
