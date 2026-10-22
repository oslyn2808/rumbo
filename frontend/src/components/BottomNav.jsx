import { motion } from 'framer-motion';
import { Camera, Compass, Map, Route, User } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import styles from './BottomNav.module.css';

const ITEMS = [
  { to: '/explorar', label: 'Explorar', Icon: Compass },
  { to: '/mapa', label: 'Mapa', Icon: Map },
  { to: '/escanear', label: 'Escanear', Icon: Camera },
  { to: '/viajes', label: 'Viajes', Icon: Route },
  { to: '/perfil', label: 'Perfil', Icon: User },
];

export default function BottomNav() {
  return (
    <nav className={styles.nav} aria-label="Navegación principal">
      <ul className={styles.list}>
        {ITEMS.map(({ to, label, Icon }) => (
          <li key={to} className={styles.item}>
            <NavLink to={to} className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}>
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="nav-pill"
                      className={styles.pill}
                      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                    />
                  )}
                  <Icon size={20} strokeWidth={isActive ? 2.4 : 2} aria-hidden="true" className={styles.icon} />
                  <span className={styles.label}>{label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
