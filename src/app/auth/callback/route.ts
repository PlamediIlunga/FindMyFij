import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function GET(request: NextRequest) {
  const requestedNext = request.nextUrl.searchParams.get('next') ?? '/admin/fij';
  const next = requestedNext.startsWith('/') && !requestedNext.startsWith('//') ? requestedNext : '/admin/fij';
  const response = NextResponse.redirect(new URL(next, request.url));
  const code = request.nextUrl.searchParams.get('code');
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!code || !url || !key) return response;
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (values) => values.forEach(({ name, value, options }) => response.cookies.set(name, value, options)),
    },
  });
  await supabase.auth.exchangeCodeForSession(code);
  return response;
}
