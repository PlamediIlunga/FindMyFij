'use server';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export async function registerAction(formData: FormData): Promise<{ error?: string; success?: boolean }> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  if (!email || password.length < 8) return { error: 'Indiquez un email et un mot de passe d’au moins 8 caractères.' };
  const supabase = getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Accès indisponible.' };
  const { error } = await supabase.auth.signUp({ email, password });
  return error ? { error: 'Impossible de créer ce compte.' } : { success: true };
}
