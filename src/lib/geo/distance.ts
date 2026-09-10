import { calculateDistance } from './haversine';
import type { Fij, FijWithDistance, ReferencePoint } from '@/types/fij';

/**
 * Calcule la distance de chaque FIJ par rapport à un point de référence,
 * puis trie du plus proche au plus éloigné.
 */
export function sortFijByDistance(
  fijList: Fij[],
  reference: Pick<ReferencePoint, 'latitude' | 'longitude'>
): FijWithDistance[] {
  return fijList
    .map((fij) => ({
      ...fij,
      distanceMeters: calculateDistance(
        reference.latitude,
        reference.longitude,
        fij.latitude,
        fij.longitude
      ),
    }))
    .sort((a, b) => a.distanceMeters - b.distanceMeters);
}

/**
 * Formate une distance en mètres de façon lisible :
 * - en mètres si < 1 km
 * - en kilomètres avec une décimale sinon
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  const km = meters / 1000;
  return `${km.toFixed(1).replace('.', ',')} km`;
}
