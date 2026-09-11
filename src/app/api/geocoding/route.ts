import { NextResponse } from 'next/server';
import { geocodeAddress, geocodeStructuredAddress, type StructuredAddress } from '@/lib/geocoding/nominatim';

/**
 * POST /api/geocoding
 *
 * Deux modes, au choix :
 * 1) Texte libre :   { "address": "123 rue Principale, Gatineau", "countryCode": "ca" }
 * 2) Structuré (plus précis, à privilégier quand les champs sont connus séparément) :
 *    { "structured": { "street": "123 rue Principale", "city": "Gatineau", "state": "QC", "postalcode": "J8X 1A1", "country": "Canada" }, "countryCode": "ca" }
 */
export async function POST(request: Request) {
  let address: unknown;
  let countryCode: unknown;
  let structured: unknown;
  try {
    const body = await request.json();
    address = body.address;
    countryCode = body.countryCode;
    structured = body.structured;
  } catch {
    return NextResponse.json({ error: 'Corps de requête JSON invalide.' }, { status: 400 });
  }

  const resolvedCountryCode = typeof countryCode === 'string' ? countryCode : undefined;

  try {
    if (structured && typeof structured === 'object') {
      const fields = structured as StructuredAddress;
      const result = await geocodeStructuredAddress(fields, { countryCode: resolvedCountryCode });
      if (!result) {
        return NextResponse.json({ error: 'Aucune adresse correspondante trouvée.' }, { status: 404 });
      }
      return NextResponse.json(result);
    }

    if (typeof address !== 'string' || address.trim().length < 3) {
      return NextResponse.json(
        { error: 'Veuillez fournir une adresse d\'au moins 3 caractères.' },
        { status: 400 }
      );
    }

    const result = await geocodeAddress(address, { countryCode: resolvedCountryCode });
    if (!result) {
      return NextResponse.json({ error: 'Aucune adresse correspondante trouvée.' }, { status: 404 });
    }
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur de géocodage inconnue.';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}