import Link from 'next/link';
import { ResetPasswordForm } from './ResetPasswordForm';
import styles from '../login/login.module.scss';
export default function ResetPasswordPage() { return <main className={styles.formSide}><div className={styles.card}><p className={styles.title}>Nouveau mot de passe</p><p className={styles.subtitle}>Choisissez un mot de passe d’au moins 8 caractères.</p><ResetPasswordForm /><Link href="/admin/login" className={styles.backLink}>← Retour à la connexion</Link></div></main>; }
