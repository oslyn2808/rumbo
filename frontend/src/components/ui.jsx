import { CircleAlert, LoaderCircle } from 'lucide-react';
import { forwardRef, useId } from 'react';
import { Link } from 'react-router-dom';
import styles from './ui.module.css';

export function Button({ variant = 'primary', size, block, loading, children, to, className = '', disabled, ...rest }) {
  const classes = [
    styles.button,
    variant === 'mint' && styles.mint,
    variant === 'outline' && styles.outline,
    variant === 'ghost' && styles.ghost,
    variant === 'danger' && styles.danger,
    variant === 'ghostDanger' && styles.ghostDanger,
    size === 'small' && styles.small,
    block && styles.block,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  if (to) {
    return (
      <Link to={to} className={classes} {...rest}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" className={classes} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {loading && <LoaderCircle size={18} className={styles.spin} aria-hidden="true" />}
      {children}
    </button>
  );
}

export function Chip({ pressed, children, className = '', ...rest }) {
  return (
    <button type="button" className={`${styles.chip} ${className}`} aria-pressed={pressed} {...rest}>
      {children}
    </button>
  );
}

export const TextField = forwardRef(function TextField(
  { label, icon: Icon, error, trailing, id, className = '', ...rest },
  ref
) {
  const auto = useId();
  const inputId = id ?? auto;
  const errorId = `${inputId}-error`;
  return (
    <div className={`${styles.field} ${className}`}>
      <label className={styles.label} htmlFor={inputId}>
        {label}
      </label>
      <div className={styles.control}>
        {Icon && <Icon size={18} className="leading" aria-hidden="true" style={{ position: 'absolute', left: 14, color: 'var(--text-muted)', pointerEvents: 'none' }} />}
        <input
          ref={ref}
          id={inputId}
          className={`${styles.input} ${Icon ? '' : styles.plain}`}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? errorId : undefined}
          {...rest}
        />
        {trailing}
      </div>
      {error && (
        <p id={errorId} className={styles.error} role="alert">
          <CircleAlert size={14} aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
});

export function Sheet({ children, className = '', ...rest }) {
  return (
    <div className={`${styles.sheet} ${className}`} {...rest}>
      {children}
    </div>
  );
}

export function Badge({ tone, children }) {
  const tones = { good: styles.badgeGood, warn: styles.badgeWarn };
  return <span className={`${styles.badge} ${tones[tone] ?? ''}`}>{children}</span>;
}

export function Note({ icon: Icon, children }) {
  return (
    <div className={styles.note} role="note">
      {Icon && <Icon size={18} aria-hidden="true" style={{ flex: 'none', marginTop: 1 }} />}
      <div>{children}</div>
    </div>
  );
}

export const uiStyles = styles;
