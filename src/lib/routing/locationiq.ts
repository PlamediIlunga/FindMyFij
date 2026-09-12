// src/lib/routing/locationiq.ts
/**
 * Service de routage basé sur LocationIQ (moteur OSRM en coulisses).
 *
 * Contrairement à src/lib/geo/haversine.ts (distance à vol d'oiseau), les
 * fonctions ici suivent le réseau routier réel — donc pas de trajet qui
 * traverse des maisons ou des terrains privés.
 *
 * Réutilise la même clé que le géocodage (LOCATIONIQ_API_KEY) : mêmes
 * conditions gratuites, même compte, aucune inscription supplémentaire.
 *
 * Isolé dans ce fichier — seul src/app/api/routing/route.ts en dépend,
 * suivant le même principe que src/lib/geocoding/locationiq.ts.
 */

export interface LatLon {
  latitude: number;
  longitude: number;
}

export interface DrivingRoute {
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

export async function getDrivingRoute(origin: LatLon, destination: LatLon): Promise<DrivingRoute | null> {
  const apiKey = getApiKey();
  const coordinates = `${toLonLat(origin)};${toLonLat(destination)}`;

  const url = new URL(`${LOCATIONIQ_BASE_URL}/directions/driving/${coordinates}`);
  url.searchParams.set('key', apiKey);
  url.searchParams.set('overview', 'full');
  url.searchParams.set('geometries', 'geojson');
  url.searchParams.set('steps', 'false');

  const response = await fetch(url.toString(), { next: { revalidate: 0 } });
  if (!response.ok) {
    throw new Error(`Échec du routage LocationIQ (statut ${response.status})`);
  }

  const data = (await response.json()) as OsrmRouteResponse;
  const first = data.routes?.[0];
  if (!first) return null;

  return {
    distanceMeters: first.distance,
    durationSeconds: first.duration,
    geometry: first.geometry.coordinates.map(([lon, lat]) => [lat, lon]),
  };
}

const MATRIX_CHUNK_SIZE = 24;

export async function getDrivingDistances(
  origin: LatLon,
  destinations: LatLon[]
): Promise<(number | null)[]> {
  if (destinations.length === 0) return [];
  const apiKey = getApiKey();

  const results: (number | null)[] = [];

  for (let i = 0; i < destinations.length; i += MATRIX_CHUNK_SIZE) {
    const chunk = destinations.slice(i, i + MATRIX_CHUNK_SIZE);
    const coordinates = [origin, ...chunk].map(toLonLat).join(';');

    const url = new URL(`${LOCATIONIQ_BASE_URL}/matrix/driving/${coordinates}`);
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