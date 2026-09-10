'use client';
import { useState, useTransition, type FormEvent } from 'react';
import { registerAction } from './actions';
import styles from '../login/login.module.scss';
export function RegisterForm() {
  const [pending, startTransition] = useTransition(); const [message, setMessage] = useState<string | null>(null); const [error, setError] = useState<string | null>(null);
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setError(null); setMessage(null); const data = new FormData(event.currentTarget); startTransition(async () => { const result = await registerAction(data); if (result.error) setError(result.error); if (result.success) setMessage('Compte créé. La personne peut maintenant se connecter.'); }); }
  return <form className={styles.form} onSubmit={submit}><div className={styles.field}><label className={styles.label} htmlFor="email">Email</label><input id="email" name="email" type="email" className={styles.input} required /></div><div className={styles.field}><label className={styles.label} htmlFor="password">Mot de passe temporaire</label><input id="password" name="password" type="password" minLength={8} className={styles.input} required /></div>{error && <p className={styles.error}>{error}</p>}{message && <p className={styles.success}>{message}</p>}<button className={styles.submitButton} disabled={pending}>{pending ? 'Création…' : 'Créer le compte'}</button></form>;
}
