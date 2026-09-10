'use server';

import { redirect } from 'next/navigation';
import { getSupabaseServerClient } from '@/lib/supabase/server';

interface LoginResult {
  error: string;
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