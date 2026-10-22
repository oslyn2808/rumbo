import { AnimatePresence } from 'framer-motion';
import { useCallback, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './components/AppLayout.jsx';
import AppShell from './components/AppShell.jsx';
import { PublicOnly, RequireAuth } from './components/RouteGuards.jsx';
import Splash from './components/Splash.jsx';
import AuthPage from './pages/AuthPage.jsx';
import Destination from './pages/Destination.jsx';
import Home from './pages/Home.jsx';
import Intro from './pages/Intro.jsx';
import MapView from './pages/MapView.jsx';
import NewTrip from './pages/NewTrip.jsx';
import Profile from './pages/Profile.jsx';
import Scan from './pages/Scan.jsx';
import TripDetail from './pages/TripDetail.jsx';
import Trips from './pages/Trips.jsx';

const splashSeen = () => {
  try {
    return sessionStorage.getItem('rumbo.splash') === '1';
  } catch {
    return false;
  }
};

export default function App() {
  const [splashDone, setSplashDone] = useState(splashSeen);

  const finishSplash = useCallback(() => {
    try {
      sessionStorage.setItem('rumbo.splash', '1');
    } catch {
      /* sin almacenamiento: la animacion se repetira al recargar */
    }
    setSplashDone(true);
  }, []);

  return (
    <AppShell>
      <Routes>
        <Route element={<PublicOnly />}>
          <Route path="/welcome" element={<AuthPage />} />
        </Route>

        <Route element={<RequireAuth />}>
          <Route path="/intro" element={<Intro />} />
          <Route element={<AppLayout />}>
            <Route path="/explorar" element={<Home />} />
            <Route path="/mapa" element={<MapView />} />
            <Route path="/escanear" element={<Scan />} />
            <Route path="/viajes" element={<Trips />} />
            <Route path="/perfil" element={<Profile />} />
          </Route>
          <Route path="/destino/:id" element={<Destination />} />
          <Route path="/viajes/nuevo" element={<NewTrip />} />
          <Route path="/viajes/:id" element={<TripDetail />} />
        </Route>

        <Route path="*" element={<Navigate to="/explorar" replace />} />
      </Routes>
      <AnimatePresence>{!splashDone && <Splash key="splash" onDone={finishSplash} />}</AnimatePresence>
    </AppShell>
  );
}
