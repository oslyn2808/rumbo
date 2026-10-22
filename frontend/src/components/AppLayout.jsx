import { useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import BottomNav from './BottomNav.jsx';
import styles from './AppLayout.module.css';

// Estructura de las pantallas con barra inferior: contenido con scroll propio + barra flotante.
export default function AppLayout() {
  const ref = useRef(null);
  const { pathname } = useLocation();

  useEffect(() => {
    ref.current?.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <div className={styles.layout}>
      <div className={styles.scroll} ref={ref}>
        <Outlet />
      </div>
      <BottomNav />
    </div>
  );
}
