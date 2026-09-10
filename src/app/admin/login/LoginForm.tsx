'use client';

import { useState, useTransition, type FormEvent } from 'react';
import { loginAction, requestPasswordResetAction } from './actions';
import styles from './login.module.scss';

export function LoginForm({ redirectTo }: { redirectTo?: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await loginAction(formData);
      if (result?.error) setError(result.error);
    });
  }

  function handleReset() {
    const form = document.getElementById('login-form') as HTMLFormElement | null;
    if (!form) return;
    setError(null);
    startTransition(async () => {
      const result = await requestPasswordResetAction(new FormData(form));
      if (result?.error) setError(result.error);
      else setResetSent(true);
    });
  }

  return (
    <form id="login-form" className={styles.form} onSubmit={handleSubmit}>
      <input type="hidden" name="redirectTo" value={redirectTo ?? '/admin/fij'} />
      <div className={styles.field}>
        <label className={styles.label} htmlFor="email">Email</label>
        <input id="email" name="email" type="email" className={styles.input} autoComplete="email" required />
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="password">Mot de passe</label>
        <input id="password" name="password" type="password" className={styles.input} autoComplete="current-password" required />
      </div>
      {error && <p className={styles.error}>{error}</p>}
      <button type="submit" className={styles.submitButton} disabled={isPending}>
        {isPending ? 'Connexion…' : 'Se connecter'}
      </button>
      <button type="button" className={styles.textButton} onClick={handleReset} disabled={isPending}>Mot de passe oublié ?</button>
      {resetSent && <p className={styles.success}>Si cette adresse est associée à un compte, un lien vient d’être envoyé.</p>}
    </form>
  );
}
