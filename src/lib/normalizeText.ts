/**
 * Normalise une chaîne pour une comparaison insensible à la casse et aux
 * accents (utile pour chercher "Gatineau" avec ou sans accent, majuscules...).
 */
export function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}
