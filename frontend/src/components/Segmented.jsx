import styles from './ui.module.css';

export default function Segmented({ label, options, value, onChange }) {
  return (
    <div className={styles.field}>
      <span className={styles.label} id={`seg-${label}`}>
        {label}
      </span>
      <div className={styles.segmented} role="radiogroup" aria-labelledby={`seg-${label}`}>
        {options.map((o) => (
          <button key={o} type="button" role="radio" aria-checked={value === o} className={styles.segment} onClick={() => onChange(o)}>
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}
