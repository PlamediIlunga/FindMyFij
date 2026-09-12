/**
 * Service de routage basé sur LocationIQ (moteur OSRM en coulisses),
 * profils PIÉTON et VOITURE.
 *
 * La voiture n'est ici qu'à titre indicatif (distance/durée affichées à côté
 * du trajet à pied, qui reste prioritaire pour déterminer la FIJ "la plus
 * proche") : la navigation réelle en voiture reste déléguée à Google Maps
 * via le bouton "Voir l'itinéraire" (src/lib/maps/directions.ts), qui le
 * fait mieux que nous (trafic en temps réel, etc.).
 *
 * Contrairement à src/lib/geo/haversine.ts (distance à vol d'oiseau), les
 * fonctions ici suivent le réseau réel (piéton ou routier selon le profil)
 * — donc pas de trajet qui traverse des maisons ou des terrains privés.
 *
 * Réutilise la même clé que le géocodage (LOCATIONIQ_API_KEY) : mêmes
 * conditions gratuites, même compte, aucune inscription supplémentaire.
 *
 * Isolé dans ce fichier — seul src/app/api/routing/route.ts en dépend,
 * suivant le même principe que src/lib/geocoding/locationiq.ts.
 */

export type RoutingProfile = 'walking' | 'driving';

export interface LatLon {
  latitude: number;
  longitude: number;
}

export interface Route {
  distanceMeters: number;
  durationSeconds: number;
  geometry: [number, number][];
}

interface OsrmRouteResponse {
  code: string;
  routes?: {
    distance: number;
    duration: number;
    geometry: { type: 'LineString'; coordinates: [number, number][] };
  }[];
}

interface OsrmMatrixResponse {
  code: string;
  distances?: (number | null)[][];
}

const LOCATIONIQ_BASE_URL = 'https://us1.locationiq.com/v1';
// Au-delà, l'affichage devient illisible (comme Google Maps qui plafonne
// lui aussi le nombre de tracés alternatifs affichés).
const MAX_ROUTE_ALTERNATIVES = 3;
const MATRIX_CHUNK_SIZE = 24;

function toLonLat(point: LatLon): string {
  return `${point.longitude},${point.latitude}`;
}

function getApiKey(): string {
  const apiKey = process.env.LOCATIONIQ_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Routage indisponible : la variable d'environnement LOCATIONIQ_API_KEY n'est pas configurée."
    );
  }
  return apiKey;
}

/**
 * Calcule le ou les trajets entre deux points pour le profil donné, du plus
 * rapide au plus lent — comme les propositions "itinéraire 1 / 2 / 3" de
 * Google Maps. `alternatives=true` demande à OSRM de renvoyer plusieurs
 * tracés distincts quand ils existent (sinon un seul est retourné, ce qui
 * reste normal).
 */
export async function getRoutes(
  profile: RoutingProfile,
  origin: LatLon,
  destination: LatLon
): Promise<Route[]> {
  const apiKey = getApiKey();
  const coordinates = `${toLonLat(origin)};${toLonLat(destination)}`;

  const url = new URL(`${LOCATIONIQ_BASE_URL}/directions/${profile}/${coordinates}`);
  url.searchParams.set('key', apiKey);
  url.searchParams.set('overview', 'full');
  url.searchParams.set('geometries', 'geojson');
  url.searchParams.set('steps', 'false');
  url.searchParams.set('alternatives', 'true');

  const response = await fetch(url.toString(), { next: { revalidate: 0 } });
  if (!response.ok) {
    throw new Error(`Échec du routage LocationIQ (statut ${response.status})`);
  }

  const data = (await response.json()) as OsrmRouteResponse;
  const routes = data.routes ?? [];

  return routes
    .map((route) => ({
      distanceMeters: route.distance,
      durationSeconds: route.duration,
      geometry: route.geometry.coordinates.map(([lon, lat]) => [lat, lon] as [number, number]),
    }))
    // OSRM ne garantit pas l'ordre des alternatives : on trie par durée
    // croissante pour que "l'itinéraire recommandé" (le plus rapide) soit
    // toujours en premier, comme dans Google Maps.
    .sort((a, b) => a.durationSeconds - b.durationSeconds)
    .slice(0, MAX_ROUTE_ALTERNATIVES);
}

/** Calcule la distance (profil donné) entre une origine et plusieurs destinations. */
export async function getDistances(
  profile: RoutingProfile,
  origin: LatLon,
  destinations: LatLon[]
): Promise<(number | null)[]> {
  if (destinations.length === 0) return [];
  const apiKey = getApiKey();

  const results: (number | null)[] = [];

  for (let i = 0; i < destinations.length; i += MATRIX_CHUNK_SIZE) {
    const chunk = destinations.slice(i, i + MATRIX_CHUNK_SIZE);
    const coordinates = [origin, ...chunk].map(toLonLat).join(';');

    const url = new URL(`${LOCATIONIQ_BASE_URL}/matrix/${profile}/${coordinates}`);
    url.searchParams.set('key', apiKey);
    url.searchParams.set('sources', '0');
    url.searchParams.set('annotations', 'distance');

    const response = await fetch(url.toString(), { next: { revalidate: 0 } });
    if (!response.ok) {
      throw new Error(`Échec du calcul de distances LocationIQ (statut ${response.status})`);
    }

    const data = (await response.json()) as OsrmMatrixResponse;
    const row = data.distances?.[0] ?? [];
    results.push(...row.slice(1));
  }

  return results;
}