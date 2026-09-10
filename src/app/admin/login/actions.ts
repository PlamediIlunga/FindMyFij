'use server';

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { getSupabaseServerClient } from '@/lib/supabase/server';

interface LoginResult {
  error: string;
}

function appOrigin(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? headers().get('origin') ?? 'http://localhost:3000';
}

export async function requestPasswordResetAction(formData: FormData): Promise<LoginResult | undefined> {
  const email = String(formData.get('email') ?? '').trim();
  if (!email) return { error: 'Veuillez renseigner votre adresse email.' };
  const { error } = await getSupabaseServerClient().auth.resetPasswordForEmail(email, {
    redirectTo: `${appOrigin()}/auth/callback?next=/admin/reset-password`,
  });
  if (error) return { error: 'Impossible d’envoyer le lien pour le moment. Réessayez plus tard.' };
  return { error: '' };
}

export async function updatePasswordAction(formData: FormData): Promise<LoginResult | undefined> {
  const password = String(formData.get('password') ?? '');
  const confirmation = String(formData.get('confirmation') ?? '');
  if (password.length < 8) return { error: 'Le mot de passe doit contenir au moins 8 caractères.' };
  if (password !== confirmation) return { error: 'Les mots de passe ne correspondent pas.' };
  const { error } = await getSupabaseServerClient().auth.updateUser({ password });
  if (error) return { error: 'Le lien est expiré ou invalide. Demandez un nouveau lien.' };
  redirect('/admin/fij');
}

export async function loginAction(formData: FormData): Promise<LoginResult | undefined> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const redirectTo = String(formData.get('redirectTo') ?? '/admin/fij');

  if (!email || !password) {
    return { error: 'Veuillez renseigner votre email et votre mot de passe.' };
  }

  const supabase = getSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: 'Email ou mot de passe incorrect.' };
  }

  redirect(redirectTo.startsWith('/admin') ? redirectTo : '/admin/fij');
}

export async function logoutAction(): Promise<void> {
  const supabase = getSupabaseServerClient();
  await supabase.auth.signOut();
  redirect('/admin/login');
}
