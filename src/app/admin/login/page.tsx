import Link from 'next/link';
import { LoginForm } from './LoginForm';
import styles from './login.module.scss';

export default function AdminLoginPage({ searchParams }: { searchParams: { redirectTo?: string } }) {
  return (
    <div className={styles.page}>
      <div className={styles.hero}>
        <Link href="/" className={styles.heroLogo}>
          <span className={styles.logoMark}>FIJ</span>
          Carte des FIJ
        </Link>
        <div className={styles.heroBody}>
          <p className={styles.heroTitle}>
            Administration des<br />Familles d&apos;Impact Jeune
          </p>
          <p className={styles.heroText}>
            Ajoutez, modifiez et retirez des FIJ de la carte publique. Chaque
            changement est visible immédiatement par les familles qui
            cherchent la ressource la plus proche.
          </p>
        </div>
        <p className={styles.heroFoot}>Accès réservé à l&apos;équipe FIJ.</p>
      </div>

      <div className={styles.formSide}>
        <div className={styles.card}>
          <p className={styles.title}>Connexion</p>
          <p className={styles.subtitle}>Connectez-vous pour gérer les FIJ.</p>
          <LoginForm redirectTo={searchParams.redirectTo} />
          <p className={styles.hint}>
            Aucun compte ? Créez-en un dans Supabase (Authentication → Users).
          </p>
          <Link href="/" className={styles.backLink}>
            ← Retour à la carte
          </Link>
        </div>
      </div>
    </div>
  );
}
