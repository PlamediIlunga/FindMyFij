'use client';

import { useState, useTransition, type FormEvent } from 'react';
import { loginAction } from './actions';
import styles from './login.module.scss';

export function LoginForm({ redirectTo }: { redirectTo?: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await loginAction(formData);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
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
    </form>
  );
}
