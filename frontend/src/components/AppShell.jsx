import styles from './AppShell.module.css';

// En el celular ocupa toda la pantalla; en computadora se muestra como un dispositivo centrado.
export default function AppShell({ children }) {
  return (
    <div className={styles.stage}>
      <div className={styles.device} id="device">
        {children}
      </div>
    </div>
  );
}
