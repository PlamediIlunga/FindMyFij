import Link from 'next/link';
import styles from './AdminEntryButton.module.scss';

/** Accès discret en fin de liste, accessible au clavier et au toucher. */
export function AdminEntryButton() {
  return <footer className={styles.footer}>
    <Link href="/admin/fij" className={styles.link} aria-label="Accéder à l'administration">©</Link>
    <span>Familles d’Impact Jeune</span>
  </footer>;
}
