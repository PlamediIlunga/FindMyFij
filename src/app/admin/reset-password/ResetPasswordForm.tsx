'use client';
import { useEffect, useState, type FormEvent } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import styles from '../login/login.module.scss';
export function ResetPasswordForm() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => { if (event === 'PASSWORD_RECOVERY') setReady(true); });
    supabase.auth.getSession().then(({ data }) => { if (data.session && window.location.hash.includes('access_token')) setReady(true); });
    return () => subscription.unsubscribe();
  }, []);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget); const password = String(data.get('password') ?? ''); const confirmation = String(data.get('confirmation') ?? '');
    if (password.length < 8) { setError('Le mot de passe doit contenir au moins 8 caractères.'); return; }
    if (password !== confirmation) { setError('Les mots de passe ne correspondent pas.'); return; }
    setError(null); setIsPending(true);
    getSupabaseBrowserClient().auth.updateUser({ password }).then(({ error: updateError }) => { if (updateError) setError('Le lien est expiré ou invalide. Demandez un nouveau lien.'); else window.location.assign('/admin/fij'); }).finally(() => setIsPending(false));
  }
  return <form className={styles.form} onSubmit={submit}><div className={styles.field}><label className={styles.label} htmlFor="password">Nouveau mot de passe</label><input id="password" name="password" type="password" minLength={8} className={styles.input} autoComplete="new-password" required disabled={!ready} /></div><div className={styles.field}><label className={styles.label} htmlFor="confirmation">Confirmer le mot de passe</label><input id="confirmation" name="confirmation" type="password" minLength={8} className={styles.input} autoComplete="new-password" required disabled={!ready} /></div>{!ready && <p className={styles.hint}>Vérification du lien de réinitialisation…</p>}{error && <p className={styles.error}>{error}</p>}<button className={styles.submitButton} disabled={isPending || !ready}>{isPending ? 'Mise à jour…' : 'Enregistrer le mot de passe'}</button></form>;
}
