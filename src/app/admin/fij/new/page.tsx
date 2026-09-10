'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FIJForm } from '@/components/fij/FIJForm';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { createFijAction } from '../actions';
import type { FijInput } from '@/types/fij';
import styles from '../admin.module.scss';
import formStyles from './new.module.scss';

export default function NewFijPage() {
  const router = useRouter();

  async function handleSubmit(input: FijInput) {
    await createFijAction(input);
    router.push('/admin/fij');
    router.refresh();
  }

  return (
    <div className={styles.page}>
      <header className={styles.topbar}>
        <div className={styles.brand}>
          <Link href="/" className={styles.brandLink}>
            <span className={styles.logoMark}>FIJ</span>
          </Link>
          <div>
            <p className={styles.title}>Ajouter une FIJ</p>
            <div className={styles.subLinks}>
              <Link className={styles.subLink} href="/admin/fij">
                ← Retour à la liste
              </Link>
            </div>
          </div>
        </div>
        <div className={styles.headerActions}>
          <ThemeToggle />
        </div>
      </header>

      <main className={styles.content}>
        <div className={formStyles.layout}>
          <div className={formStyles.formCard}>
            <FIJForm submitLabel="Créer la FIJ" onSubmit={handleSubmit} />
          </div>
          <aside className={formStyles.tips}>
            <p className={formStyles.tipsTitle}>Avant de créer</p>
            <ol className={formStyles.tipsList}>
              <li>Choisissez la catégorie réelle (Jeunes ou Jeunes Ados) — « Global » n&apos;existe pas pour une FIJ, c&apos;est juste un filtre.</li>
              <li>Renseignez l&apos;adresse complète puis cliquez sur « Géocoder l&apos;adresse » pour positionner le marqueur.</li>
              <li>Vérifiez la position obtenue avant de créer — vous pourrez toujours l&apos;ajuster plus tard depuis la liste.</li>
            </ol>
          </aside>
        </div>
      </main>
    </div>
  );
}
