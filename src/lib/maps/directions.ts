import type { Fij } from '@/types/fij';

/**
 * Construit une URL Google Maps pour obtenir l'itinéraire vers une FIJ.
 * On ne charge aucune librairie Google Maps : un simple lien externe suffit.
 */
export function buildGoogleMapsDirectionsUrl(fij: Fij): string {
  const destination = `${fij.address}, ${fij.city}, ${fij.province} ${fij.postalCode}`;
  const params = new URLSearchParams({
    api: '1',
    destination,
    destination_place_id: '',
  });
  // On préfère l'adresse texte aux coordonnées : Google Maps affiche alors
  // le nom de rue plutôt qu'un point brut, plus lisible pour l'utilisateur.
  params.delete('destination_place_id');
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}
