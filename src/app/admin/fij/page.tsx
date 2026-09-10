import Link from 'next/link';
import { getAllFij } from '@/services/fij.service';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { FijAdminDashboard } from './FijAdminDashboard';
import styles from './admin.module.scss';
import { LogoutButton } from '@/components/admin/LogoutButton';

export default async function AdminFijPage() {
  const fijList = await getAllFij();

  return (
    <div className={styles.page}>
      <header className={styles.topbar}>
        <div className={styles.brand}>
          <Link href="/" className={styles.brandLink}>
            <span className={styles.logoMark}>FIJ</span>
          </Link>
          <div>
            <p className={styles.title}>Gestion des FIJ</p>
            <div className={styles.subLinks}>
              <Link className={styles.subLink} href="/">
                ← Carte publique
              </Link>
              <span className={styles.subLinkDivider} aria-hidden>·</span>
              <LogoutButton className={styles.subLink} />
            </div>
          </div>
        </div>
        <div className={styles.headerActions}>
          <ThemeToggle />
          <Link className={styles.addButton} href="/admin/fij/new">
            <span aria-hidden>+</span> Ajouter une FIJ
          </Link>
        </div>
      </header>

      <main className={styles.content}>
        <FijAdminDashboard fijList={fijList} />
      </main>

      <footer className={styles.adminFooter}><Link href="/admin/register" aria-label="Ajouter un compte administrateur">©</Link></footer>

      <Link href="/admin/fij/new" className={styles.mobileFab} aria-label="Ajouter une FIJ">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </Link>
    </div>
  );
}
