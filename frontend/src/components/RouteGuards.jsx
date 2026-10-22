import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Logo from './Logo.jsx';

export const introSeen = () => {
  try {
    return localStorage.getItem('rumbo.intro') === '1';
  } catch {
    return true;
  }
};
export const markIntroSeen = () => {
  try {
    localStorage.setItem('rumbo.intro', '1');
  } catch {
    /* sin almacenamiento: la introduccion se mostrara de nuevo */
  }
};

function Loading() {
  return (
    <div style={{ display: 'grid', placeItems: 'center', height: '100%', color: 'var(--text-on-dark)' }} role="status" aria-label="Cargando">
      <Logo size={64} />
    </div>
  );
}

// Rutas que requieren sesion.
export function RequireAuth() {
  const { user, checking } = useAuth();
  const location = useLocation();
  if (checking) return <Loading />;
  if (!user) return <Navigate to="/welcome" replace state={{ from: location.pathname }} />;
  if (!introSeen() && location.pathname !== '/intro') return <Navigate to="/intro" replace />;
  return <Outlet />;
}

// Rutas solo para quien aun no inicio sesion.
export function PublicOnly() {
  const { user, checking } = useAuth();
  if (checking) return <Loading />;
  if (user) return <Navigate to={introSeen() ? '/explorar' : '/intro'} replace />;
  return <Outlet />;
}
