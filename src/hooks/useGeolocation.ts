'use client';

import { useCallback, useState } from 'react';

interface GeolocationState {
  isLocating: boolean;
  error: string | null;
}

interface UseGeolocationResult extends GeolocationState {
  /** Demande la position GPS ; résout avec {latitude, longitude} ou lève une erreur lisible. */
  locate: () => Promise<{ latitude: number; longitude: number } | null>;
}

/**
 * Encapsule la géolocalisation du navigateur avec des messages d'erreur en
 * français, prêts à afficher à l'utilisateur.
 */
export function useGeolocation(): UseGeolocationResult {
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const locate = useCallback(async () => {
    if (!('geolocation' in navigator)) {
      setError("La géolocalisation n'est pas supportée par ce navigateur.");
      return null;
    }

    setIsLocating(true);
    setError(null);

    return new Promise<{ latitude: number; longitude: number } | null>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setIsLocating(false);
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (positionError) => {
          setIsLocating(false);
          const message =
            positionError.code === positionError.PERMISSION_DENIED
              ? "Accès à la position refusé. Vous pouvez rechercher une adresse manuellement."
              : 'Impossible de récupérer votre position pour le moment.';
          setError(message);
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 10_000 }
      );
    });
  }, []);

  return { isLocating, error, locate };
}
