'use client';

import { useState, useTransition } from 'react';
import { deleteFijAction } from '@/app/admin/fij/actions';
import styles from './admin.module.scss';

export function FijDeleteButton({ id, name }: { id: string; name: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    if (!window.confirm(`Supprimer définitivement « ${name} » ?`)) return;
    setError(null);
    startTransition(async () => {
      try {
        await deleteFijAction(id);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Suppression impossible.');
      }
    });
  }

  return (
    <>
      <button
        type="button"
        className={styles.deleteButton}
        onClick={handleDelete}
        disabled={isPending}
        aria-label={`Supprimer ${name}`}
        title="Supprimer"
      >
        {isPending ? (
          <span className={styles.deleteSpinner} aria-hidden />
        ) : (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M4 7h16M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2m2 0-1 13a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L6 7h12Z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>
      {error && <div className={styles.deleteError}>{error}</div>}
    </>
  );
}
