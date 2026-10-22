import { motion, useAnimationControls } from 'framer-motion';
import { Eye, EyeOff, Mail, User } from 'lucide-react';
import { useState } from 'react';
import { errorMessage, fieldErrors } from '../api/client.js';
import Topography from '../components/Topography.jsx';
import Logo from '../components/Logo.jsx';
import PasswordSlots, { passwordSlotsStyles } from '../components/PasswordSlots.jsx';
import { Button, TextField } from '../components/ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import styles from './AuthPage.module.css';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const SUCCESS_MS = 900; // tiempo para ver el check antes de entrar
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function validate(mode, v) {
  const e = {};
  if (mode === 'register' && v.name.trim().length < 2) e.name = 'Escribe tu nombre.';
  if (!EMAIL.test(v.email.trim())) e.email = 'Escribe un correo válido.';
  if (mode === 'register' ? v.password.length < 8 : v.password.length < 1) {
    e.password = mode === 'register' ? 'Usa al menos 8 caracteres.' : 'Escribe tu contraseña.';
  }
  return e;
}

export default function AuthPage() {
  const { login, register } = useAuth();
  const toast = useToast();
  const shake = useAnimationControls();

  const [mode, setMode] = useState('login');
  const [values, setValues] = useState({ name: '', email: '', password: '' });
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);
  // Estado de las casillas de la clave: idle | error (se vacian en rojo) | success (check).
  const [passStatus, setPassStatus] = useState('idle');

  const set = (key) => (event) => {
    setValues((v) => ({ ...v, [key]: event.target.value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const setPassword = (password) => {
    setValues((v) => ({ ...v, password }));
    if (errors.password) setErrors((e) => ({ ...e, password: undefined }));
    setPassStatus('idle');
  };

  const switchMode = (next) => {
    setMode(next);
    setPassStatus('idle');
    setErrors({});
    setFormError('');
  };

  const fail = (fields, message = '') => {
    setErrors(fields);
    setFormError(message);
    shake.start({ x: [0, -9, 9, -6, 6, 0], transition: { duration: 0.4 } });
  };

  async function onSubmit(event) {
    event.preventDefault();
    const found = validate(mode, values);
    if (Object.keys(found).length) {
      if (found.password && values.password) setPassStatus('error');
      return fail(found);
    }

    setLoading(true);
    setFormError('');
    try {
      const payload = { name: values.name.trim(), email: values.email.trim(), password: values.password, remember };
      const beforeEnter = async () => {
        setPassStatus('success');
        await wait(SUCCESS_MS);
      };
      if (mode === 'login') await login(payload, { beforeEnter });
      else await register(payload, { beforeEnter });
      // La navegacion la hace PublicOnly al detectar la sesion.
    } catch (err) {
      const fields = fieldErrors(err);
      fail(fields, Object.keys(fields).length ? '' : errorMessage(err));
      // Al entrar, un fallo casi siempre es la clave; al registrarse, solo si el error es de la clave.
      if (mode === 'login' || fields.password) setPassStatus('error');
      setLoading(false);
    }
  }

  const soon = () => toast.show('Disponible pronto.');
  const isLogin = mode === 'login';

  return (
    <div className={styles.page}>
      <div className={styles.glow} aria-hidden="true">
        <Topography className={styles.contours} color="#5bd6ac" lineCount={20} glow={0.55} speed={0.2} tilt={30} fog={0.45} depthOfField={0.3} intro={false} dpr={1} />
      </div>
      <header className={styles.header}>
        <div className={styles.brand}>
          <Logo size={34} />
          <span className="serif">Rumbo</span>
        </div>
        <motion.h1 className={`${styles.title} serif`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.6 }}>
          {isLogin ? 'Qué bueno verte.' : 'Empecemos tu ruta.'}
        </motion.h1>
        <motion.p className={styles.sub} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3, duration: 0.6 }}>
          {isLogin ? 'Tus viajes guardados te están esperando.' : 'Crea tu cuenta para guardar viajes y monumentos.'}
        </motion.p>
      </header>

      <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 120, damping: 20, delay: 0.1 }} className={styles.sheetWrap}>
        <motion.div animate={shake} className={`${styles.sheet} ${isLogin ? '' : styles.registering}`}>
          <div className={styles.tabs} role="tablist" aria-label="Acceso">
            {[
              ['login', 'Entrar'],
              ['register', 'Registro'],
            ].map(([key, label]) => (
              <button key={key} type="button" role="tab" id={`tab-${key}`} aria-selected={mode === key} aria-controls="auth-panel" className={`${styles.tab} ${mode === key ? styles.tabActive : ''}`} onClick={() => switchMode(key)}>
                {mode === key && <motion.span layoutId="auth-tab" className={styles.tabPill} transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
                <span className={styles.tabLabel}>{label}</span>
              </button>
            ))}
          </div>

          <form id="auth-panel" role="tabpanel" aria-labelledby={`tab-${mode}`} onSubmit={onSubmit} noValidate className={styles.form}>
            {!isLogin && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ overflow: 'hidden' }}>
                <TextField label="Nombre" icon={User} value={values.name} onChange={set('name')} error={errors.name} autoComplete="name" placeholder="Ingresa tu nombre" />
              </motion.div>
            )}
            <TextField label="Correo electrónico" icon={Mail} type="email" inputMode="email" value={values.email} onChange={set('email')} error={errors.email} autoComplete="email" placeholder="Ingresa tu correo electrónico" />
            <PasswordSlots
              label={isLogin ? 'Contraseña' : 'Contraseña (mínimo 8 caracteres)'}
              value={values.password}
              onChange={setPassword}
              status={passStatus}
              reveal={showPassword}
              error={errors.password}
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              trailing={
                <button type="button" className={passwordSlotsStyles.toggle} onClick={() => setShowPassword((s) => !s)} aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              }
            />

            <div className={styles.row}>
              <label className={styles.check}>
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                <span>Mantener sesión iniciada</span>
              </label>
              {isLogin && (
                <button type="button" className={styles.link} onClick={soon}>
                  ¿Olvidaste tu clave?
                </button>
              )}
            </div>

            {formError && (
              <p className={styles.formError} role="alert">
                {formError}
              </p>
            )}

            <Button type="submit" block loading={loading}>
              {isLogin ? 'Iniciar sesión' : 'Crear cuenta'}
            </Button>
          </form>

          <div className={styles.divider}>
            <span>O CONTINÚA CON</span>
          </div>
          <div className={styles.social}>
            <Button variant="outline" onClick={soon}>
              Google
            </Button>
            <Button variant="outline" onClick={soon}>
              Apple
            </Button>
          </div>

          <p className={styles.switch}>
            {isLogin ? '¿Primera vez en Rumbo? ' : '¿Ya tienes cuenta? '}
            <button type="button" className={styles.link} onClick={() => switchMode(isLogin ? 'register' : 'login')}>
              {isLogin ? 'Crea una cuenta' : 'Inicia sesión'}
            </button>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
