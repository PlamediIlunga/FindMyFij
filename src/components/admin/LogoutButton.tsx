'use client';

import { useState, useTransition } from 'react';
import { logoutAction } from '@/app/admin/login/actions';

/**
 * À insérer dans le header de tes pages /admin (ex: admin/fij/page.tsx),
 * là où tu veux afficher le bouton de déconnexion :
 *
 *   import { LogoutButton } from '@/components/admin/LogoutButton';
 *   ...
 *   <LogoutButton />
 *
 * Sans className imposée : reprend le style ambiant du bouton/lien via
 * `className` optionnel, pour s'adapter à ton admin.module.scss actuel.
 */
export function LogoutButton({ className }: { className?: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      try {
        await logoutAction();
      } catch (err) {
        // logoutAction() redirige en cas de succès (ce qui "throw" une
        // erreur spéciale NEXT_REDIRECT, normal et déjà géré par Next) —
        // on ne capture ici qu'une vraie erreur inattendue.
        if (err instanceof Error && !err.message.includes('NEXT_REDIRECT')) {
          setError('Déconnexion impossible.');
        }
      }
    });
  }

  return (
    <>
      <button type="button" className={className} onClick={handleClick} disabled={isPending}>
        {isPending ? 'Déconnexion…' : 'Se déconnecter'}
      </button>
      {error && <span style={{ color: '#e8394a', fontSize: '0.75rem', marginLeft: '0.5rem' }}>{error}</span>}
    </>
  );
}
