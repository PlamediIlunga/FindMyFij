/**
 * Calcul de distance géographique via la formule de Haversine.
 * Ne jamais traiter lat/lng comme des coordonnées cartésiennes : la distance
 * "à vol d'oiseau" entre deux points sur une sphère nécessite cette formule.
 */

const EARTH_RADIUS_METERS = 6_371_000;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Retourne la distance en mètres entre deux points GPS.
 */
export function calculateDistance(
  userLatitude: number,
  userLongitude: number,
  targetLatitude: number,
  targetLongitude: number
): number {
  const dLat = toRadians(targetLatitude - userLatitude);
  const dLon = toRadians(targetLongitude - userLongitude);

  const lat1 = toRadians(userLatitude);
  const lat2 = toRadians(targetLatitude);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_METERS * c;
}
