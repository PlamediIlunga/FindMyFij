/**
 * Types centralisés pour le domaine "FIJ" (Famille d'Impact Jeune).
 * Toute l'application dépend de ces types plutôt que du schéma brut Supabase.
 */

/**
 * Catégories RÉELLES d'une FIJ (celles qui peuvent être stockées en base).
 * « Global » n'est PAS une catégorie à part entière : c'est un regroupement
 * virtuel qui représente l'ensemble « Jeunes + Jeunes Ados ». Il n'est donc
 * jamais assigné à une FIJ individuelle — uniquement utilisé côté UI comme
 * raccourci de filtre (voir GLOBAL_FILTER_KEY dans CategoryFilter.tsx).
 */
export type FijCategory = 'Jeunes' | 'Jeunes Ados';
export type FijStatus = 'open' | 'closed';

export const FIJ_CATEGORIES: FijCategory[] = ['Jeunes', 'Jeunes Ados'];

/** Couleur d'accent associée à chaque catégorie (utilisée pour marqueurs + UI). */
export const CATEGORY_COLORS: Record<FijCategory, string> = {
  Jeunes: '#2FA86B',
  'Jeunes Ados': '#8C8FA3',
};

/** Petit emoji de secours utilisé dans les listes / textes courts. */
export const CATEGORY_DOTS: Record<FijCategory, string> = {
  Jeunes: '🟢',
  'Jeunes Ados': '⚪',
};

/** Couleur/emoji du raccourci « Global » (Jeunes + Jeunes Ados combinés). */
export const GLOBAL_COLOR = '#FF6A2C';
export const GLOBAL_DOT = '🟠';

export interface Fij {
  id: string;
  name: string;
  category: FijCategory;
  address: string;
  city: string;
  province: string;
  country: string;
  postalCode: string;
  /** Informations de contact facultatives. */
  phone?: string;
  unitNumber?: string;
  /** Une FIJ fermée reste visible afin d'éviter un déplacement inutile. */
  status: FijStatus;
  latitude: number;
  longitude: number;
  createdAt: string;
  updatedAt: string;
}

/** Dimensions disponibles pour le regroupement dans l'admin. */
export type FijGroupBy = 'category' | 'city' | 'province' | 'country';

/** Champs nécessaires pour créer une FIJ (id/dates générés par la base). */
export type FijInput = Omit<Fij, 'id' | 'createdAt' | 'updatedAt'>;

/** Champs modifiables lors d'une mise à jour. */
export type FijUpdateInput = Partial<FijInput>;

/** Une FIJ enrichie d'une distance calculée par rapport à un point de référence. */
export interface FijWithDistance extends Fij {
  distanceMeters: number;
}

/** Résultat d'un géocodage d'adresse (via Nominatim ou un autre fournisseur). */
export interface GeocodeResult {
  latitude: number;
  longitude: number;
  displayName: string;
}

/** Point de référence choisi par l'utilisateur (GPS ou adresse recherchée). */
export interface ReferencePoint {
  latitude: number;
  longitude: number;
  label: string;
  source: 'gps' | 'address';
}
