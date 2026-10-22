import { useCallback, useEffect, useRef, useState } from 'react';
import { errorMessage } from '../api/client.js';

// Carga datos al montar (o al cambiar deps) y expone estado de carga, error y recarga.
export function useAsync(fn, deps = []) {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const run = useCallback(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));
    fnRef.current()
      .then((data) => !cancelled && setState({ data, error: null, loading: false }))
      .catch((err) => !cancelled && setState({ data: null, error: errorMessage(err), loading: false }));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => run(), [run, ...deps]); // eslint-disable-line react-hooks/exhaustive-deps
  return { ...state, reload: run, setData: (data) => setState((s) => ({ ...s, data })) };
}
