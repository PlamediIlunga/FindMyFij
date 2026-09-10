'use client';
import { useState, useTransition, type FormEvent } from 'react';
import { updatePasswordAction } from '../login/actions';
import styles from '../login/login.module.scss';
export function ResetPasswordForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(null); const data = new FormData(event.currentTarget);
    startTransition(async () => { const result = await updatePasswordAction(data); if (result?.error) setError(result.error); });
  }
  return <form className={styles.form} onSubmit={submit}><div className={styles.field}><label className={styles.label} htmlFor="password">Nouveau mot de passe</label><input id="password" name="password" type="password" minLength={8} className={styles.input} autoComplete="new-password" required /></div><div className={styles.field}><label className={styles.label} htmlFor="confirmation">Confirmer le mot de passe</label><input id="confirmation" name="confirmation" type="password" minLength={8} className={styles.input} autoComplete="new-password" required /></div>{error && <p className={styles.error}>{error}</p>}<button className={styles.submitButton} disabled={isPending}>{isPending ? 'Mise à jour…' : 'Enregistrer le mot de passe'}</button></form>;
}
