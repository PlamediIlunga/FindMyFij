import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { RegisterForm } from './RegisterForm';
import styles from '../login/login.module.scss';
export default async function RegisterPage() {
  const { data: { user } } = await getSupabaseServerClient().auth.getUser();
  if (!user) redirect('/');
  return <main className={styles.formSide}><div className={styles.card}><p className={styles.title}>Ajouter un accès</p><p className={styles.subtitle}>Tout compte créé donne accès à l’administration des FIJ.</p><RegisterForm /><Link href="/admin/fij" className={styles.backLink}>← Retour à l’administration</Link></div></main>;
}
