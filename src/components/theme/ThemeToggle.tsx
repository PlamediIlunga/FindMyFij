'use client';

import { useTheme } from './ThemeProvider';
import styles from './ThemeToggle.module.scss';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      className={styles.toggle}
      onClick={toggleTheme}
      aria-label={theme === 'light' ? 'Activer le mode sombre' : 'Activer le mode clair'}
    >
      {theme === 'light' ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M21 12.8A9 9 0 1111.2 3 7 7 0 0021 12.8z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
          <path
            d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      )}
    </button>
  );
}
