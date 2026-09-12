import { NextResponse } from 'next/server';
import { geocodeAddress } from '@/lib/geocoding/locationiq';

/**
 * POST /api/geocoding
 * Body: { "address": "123 rue Principale, Gatineau", "countryCode": "ca" }
 */
export async function POST(request: Request) {
  let address: unknown;
  let countryCode: unknown;
  try {
    const body = await request.json();
    address = body.address;
    countryCode = body.countryCode;
  } catch {
    return NextResponse.json({ error: 'Corps de requête JSON invalide.' }, { status: 400 });
  }

  if (typeof address !== 'string' || address.trim().length < 3) {
    return NextResponse.json(
      { error: 'Veuillez fournir une adresse d\'au moins 3 caractères.' },
      { status: 400 }
    );
  }

  try {
    const result = await geocodeAddress(address, {
      countryCode: typeof countryCode === 'string' ? countryCode : undefined,
    });
    if (!result) {
      return NextResponse.json({ error: 'Aucune adresse correspondante trouvée.' }, { status: 404 });
    }
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur de géocodage inconnue.';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}