import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getFijById } from '@/services/fij.service';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { EditFijForm } from './EditFijForm';
import styles from '../../admin.module.scss';
import formStyles from '../../new/new.module.scss';

interface EditFijPageProps {
  params: { id: string };
}

export default async function EditFijPage({ params }: EditFijPageProps) {
  const fij = await getFijById(params.id);
  if (!fij) notFound();

  return (
    <div className={styles.page}>
      <header className={styles.topbar}>
        <div className={styles.brand}>
          <Link href="/" className={styles.brandLink}>
            <span className={styles.logoMark}>FIJ</span>
          </Link>
          <div>
            <p className={styles.title}>Modifier « {fij.name} »</p>
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
            <EditFijForm fij={fij} />
          </div>
          <aside className={formStyles.tips}>
            <p className={formStyles.tipsTitle}>Modifier une FIJ</p>
            <ol className={formStyles.tipsList}>
              <li>Corrigez les champs nécessaires.</li>
              <li>
                Si l&apos;adresse a changé, cliquez de nouveau sur « Géocoder
                l&apos;adresse » pour mettre à jour la position sur la carte.
              </li>
              <li>Les changements sont visibles immédiatement sur la carte publique.</li>
            </ol>
          </aside>
        </div>
      </main>
    </div>
  );
}
