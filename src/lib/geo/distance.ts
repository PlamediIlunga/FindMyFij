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

/**
 * Formate une durée en secondes en "X min" ou "X h Y min" — utilisé pour les
 * temps de marche (LocationIQ/OSRM), pas pour la distance à vol d'oiseau
 * qui n'a pas de notion de durée.
 */
export function formatDuration(seconds: number): string {
  const totalMinutes = Math.max(1, Math.round(seconds / 60));
  if (totalMinutes < 60) return `${totalMinutes} min`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes > 0 ? `${hours} h ${minutes} min` : `${hours} h`;
}