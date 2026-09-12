import type { GeocodeResult } from '@/types/fij';

/**
 * Service de géocodage basé sur LocationIQ.
 *
 * LocationIQ combine plusieurs jeux de données (OpenStreetMap, OpenAddresses,
 * Geonames), ce qui comble une partie des trous de couverture d'OSM seul sur
 * les numéros civiques canadiens — tout en restant gratuit, sans carte
 * bancaire, avec une simple inscription par courriel :
 * https://locationiq.com/register
 *
 * Isolé dans ce fichier, comme l'étaient les implémentations précédentes
 * (voir src/lib/geocoding/nominatim.ts, conservé pour référence) — seul
 * src/app/api/geocoding/route.ts en dépend.
 *
 * Son format de requête/réponse est volontairement compatible avec
 * Nominatim (mêmes noms de champs `lat`, `lon`, `display_name`), donc le
 * portage depuis l'ancienne implémentation est quasi direct.
 *
 * Palier gratuit : 5 000 requêtes/jour, largement suffisant pour une carte
 * communautaire comme celle-ci.
 */

const LOCATIONIQ_BASE_URL = 'https://us1.locationiq.com/v1/search';

interface LocationIqResponseItem {
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

  const apiKey = process.env.LOCATIONIQ_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Géocodage indisponible : la variable d'environnement LOCATIONIQ_API_KEY n'est pas configurée."
    );
  }

  const url = new URL(LOCATIONIQ_BASE_URL);
  url.searchParams.set('key', apiKey);
  url.searchParams.set('q', trimmed);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '1');
  if (options.countryCode) {
    url.searchParams.set('countrycodes', options.countryCode);
  }

  const response = await fetch(url.toString(), {
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    throw new Error(`Échec du géocodage LocationIQ (statut ${response.status})`);
  }

  const results = (await response.json()) as LocationIqResponseItem[];
  const first = results[0];
  if (!first) return null;

  return {
    latitude: parseFloat(first.lat),
    longitude: parseFloat(first.lon),
    displayName: first.display_name,
  };
}