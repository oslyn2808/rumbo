import { useCallback, useEffect, useRef, useState } from 'react';
import { errorMessage } from '../api/client';

// Carga datos al montar (o al cambiar deps) y expone estado de carga, error y recarga.
export function useAsync(fn, deps = []) {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const alive = useRef(0);

  const run = useCallback(() => {
    const call = ++alive.current;
    setState((s) => ({ ...s, loading: true, error: null }));
    return fnRef
      .current()
      .then((data) => call === alive.current && setState({ data, error: null, loading: false }))
      .catch((err) => call === alive.current && setState({ data: null, error: errorMessage(err), loading: false }));
  }, []);

  useEffect(() => {
    run();
    return () => {
      alive.current += 1;
    };
  }, [run, ...deps]); // eslint-disable-line react-hooks/exhaustive-deps

  const setData = useCallback((data) => setState((s) => ({ ...s, data })), []);
  return { ...state, reload: run, setData };
}
