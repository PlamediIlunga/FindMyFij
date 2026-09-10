import type { GeocodeResult } from '@/types/fij';

/**
 * Service de géocodage basé sur Nominatim (OpenStreetMap), gratuit.
 *
 * Isolé dans ce fichier afin de pouvoir le remplacer par un autre fournisseur
 * (Mapbox, Google Geocoding, etc.) sans toucher au reste de l'application —
 * seul src/services/fij.service.ts et la route API en dépendent.
 *
 * ATTENTION : Nominatim impose une limite d'1 requête/seconde et demande un
 * User-Agent identifiable. Ne jamais boucler dessus pour géocoder en masse.
 *
 * LIMITE CONNUE : Nominatim s'appuie sur OpenStreetMap, une carte alimentée
 * par des contributeurs bénévoles. Sa couverture des numéros civiques
 * précis est inégale au Canada : une adresse réelle peut ne renvoyer aucun
 * résultat simplement parce qu'elle n'est pas cartographiée dans OSM, même
 * si elle existe bel et bien. C'est pour cette raison que l'appelant
 * (voir src/components/fij/FIJForm.tsx) réessaie avec une adresse de plus
 * en plus générale si la recherche précise échoue.
 */

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org/search';
const USER_AGENT = 'fij-carte/1.0 (application de cartographie communautaire)';

interface NominatimResponseItem {
  lat: string;
  lon: string;
  display_name: string;
}

interface GeocodeOptions {
  /** Code pays ISO 3166-1 alpha-2 (ex: 'ca') pour limiter/prioriser les résultats. */
  countryCode?: string;
}

/**
 * Géocode une adresse en coordonnées GPS.
 * Retourne `null` si aucune correspondance n'est trouvée.
 */
export async function geocodeAddress(
  query: string,
  options: GeocodeOptions = {}
): Promise<GeocodeResult | null> {
  const trimmed = query.trim();
  if (!trimmed) return null;

  const url = new URL(NOMINATIM_BASE_URL);
  url.searchParams.set('q', trimmed);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '1');
  url.searchParams.set('addressdetails', '0');
  if (options.countryCode) {
    url.searchParams.set('countrycodes', options.countryCode);
  }

  const response = await fetch(url.toString(), {
    headers: { 'User-Agent': USER_AGENT },
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    throw new Error(`Échec du géocodage Nominatim (statut ${response.status})`);
  }

  const results = (await response.json()) as NominatimResponseItem[];
  const first = results[0];
  if (!first) return null;

  return {
    latitude: parseFloat(first.lat),
    longitude: parseFloat(first.lon),
    displayName: first.display_name,
  };
}