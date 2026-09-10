'use client';

import styles from './Header.module.scss';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { AdminEntryButton } from './AdminEntryButton';

export function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <span className={styles.logo}>FIJ</span>
        <div>
          <p className={styles.title}>Carte des FIJ</p>
          <p className={styles.subtitle}>Familles d&apos;Impact Jeune</p>
        </div>
      </div>
      <div className={styles.right_header_icons}>
        <ThemeToggle />
        <AdminEntryButton variant="inline" />
      </div>
    </header>
  );
}
