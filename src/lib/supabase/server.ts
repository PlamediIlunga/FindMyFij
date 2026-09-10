import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { isSupabaseConfigured } from './client';

export function getSupabaseServerClient(): SupabaseClient {
  if (!isSupabaseConfigured()) {
    throw new Error(
      'Supabase non configuré : définissez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.'
    );
  }

  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Component en lecture seule : sans conséquence, le
            // middleware rafraîchit la session à chaque requête.
          }
        },
      },
    }
  );
}