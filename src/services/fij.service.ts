import { isSupabaseConfigured } from '@/lib/supabase/client';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { DEFAULT_COUNTRY } from '@/data/canadaLocations';
import { MOCK_FIJ } from '@/data/mockFij';
import type { Fij, FijInput, FijUpdateInput } from '@/types/fij';

/**
 * Couche de service : point d'entrée UNIQUE pour lire/écrire des FIJ.
 * Aucun composant ne doit appeler Supabase directement — tout passe ici.
 * Cela permet de remplacer Supabase par une autre source de données
 * (une API REST, un autre SGBD, etc.) sans toucher à l'UI.
 *
 * Tant que Supabase n'est pas configuré (voir .env.example), le service
 * retourne les données de test de src/data/mockFij.ts afin que le projet
 * reste utilisable immédiatement après un `npm install && npm run dev`.
 */

interface FijRow {
  id: string;
  name: string;
  category: Fij['category'];
  address: string;
  city: string;
  province: string;
  country: string;
  postal_code: string;
  latitude: number;
  longitude: number;
  created_at: string;
  updated_at: string;
}

function rowToFij(row: FijRow): Fij {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    address: row.address,
    city: row.city,
    province: row.province,
    country: row.country ?? DEFAULT_COUNTRY,
    postalCode: row.postal_code,
    latitude: row.latitude,
    longitude: row.longitude,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Récupère toutes les FIJ. */
export async function getAllFij(): Promise<Fij[]> {
  if (!isSupabaseConfigured()) {
    return MOCK_FIJ;
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from('fij')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw new Error(`Impossible de charger les FIJ : ${error.message}`);
  return (data as FijRow[]).map(rowToFij);
}

/** Récupère une FIJ par son identifiant. */
export async function getFijById(id: string): Promise<Fij | null> {
  if (!isSupabaseConfigured()) {
    return MOCK_FIJ.find((fij) => fij.id === id) ?? null;
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.from('fij').select('*').eq('id', id).maybeSingle();

  if (error) throw new Error(`Impossible de charger la FIJ : ${error.message}`);
  return data ? rowToFij(data as FijRow) : null;
}

/** Crée une nouvelle FIJ (les coordonnées doivent déjà être géocodées). */
export async function createFij(input: FijInput): Promise<Fij> {
  if (!isSupabaseConfigured()) {
    throw new Error(
      'Supabase non configuré : impossible de créer une FIJ en mode démo. Configurez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    );
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from('fij')
    .insert({
      name: input.name,
      category: input.category,
      address: input.address,
      city: input.city,
      province: input.province,
      country: input.country,
      postal_code: input.postalCode,
      latitude: input.latitude,
      longitude: input.longitude,
    })
    .select('*')
    .single();

  if (error) throw new Error(`Impossible de créer la FIJ : ${error.message}`);
  return rowToFij(data as FijRow);
}

/** Met à jour une FIJ existante. */
export async function updateFij(id: string, input: FijUpdateInput): Promise<Fij> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase non configuré : impossible de modifier une FIJ en mode démo.');
  }

  const supabase = getSupabaseServerClient();
  const patch: Partial<FijRow> = {};
  if (input.name !== undefined) patch.name = input.name;
  if (input.category !== undefined) patch.category = input.category;
  if (input.address !== undefined) patch.address = input.address;
  if (input.city !== undefined) patch.city = input.city;
  if (input.province !== undefined) patch.province = input.province;
  if (input.country !== undefined) patch.country = input.country;
  if (input.postalCode !== undefined) patch.postal_code = input.postalCode;
  if (input.latitude !== undefined) patch.latitude = input.latitude;
  if (input.longitude !== undefined) patch.longitude = input.longitude;

  const { data, error } = await supabase
    .from('fij')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw new Error(`Impossible de modifier la FIJ : ${error.message}`);
  return rowToFij(data as FijRow);
}

/** Supprime une FIJ. */
export async function deleteFij(id: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase non configuré : impossible de supprimer une FIJ en mode démo.');
  }

  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from('fij').delete().eq('id', id);
  if (error) throw new Error(`Impossible de supprimer la FIJ : ${error.message}`);
}
