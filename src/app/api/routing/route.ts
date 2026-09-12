import { NextResponse } from 'next/server';
import { getRoutes, getDistances, type LatLon, type RoutingProfile } from '@/lib/routing/locationiq';

function isLatLon(value: unknown): value is LatLon {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as LatLon).latitude === 'number' &&
    typeof (value as LatLon).longitude === 'number'
  );
}

function resolveProfile(value: unknown): RoutingProfile {
  return value === 'driving' ? 'driving' : 'walking';
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Corps de requête JSON invalide.' }, { status: 400 });
  }

  const { origin, destination, destinations, profile } = body as {
    origin?: unknown;
    destination?: unknown;
    destinations?: unknown;
    profile?: unknown;
  };

  if (!isLatLon(origin)) {
    return NextResponse.json(
      { error: "Le champ 'origin' ({ latitude, longitude }) est requis." },
      { status: 400 }
    );
  }

  const resolvedProfile = resolveProfile(profile);

  try {
    if (destination !== undefined) {
      if (!isLatLon(destination)) {
        return NextResponse.json(
          { error: "Le champ 'destination' ({ latitude, longitude }) est invalide." },
          { status: 400 }
        );
      }
      const routes = await getRoutes(resolvedProfile, origin, destination);
      if (routes.length === 0) {
        return NextResponse.json({ error: 'Aucun itinéraire trouvé.' }, { status: 404 });
      }
      return NextResponse.json({ routes });
    }

    if (Array.isArray(destinations) && destinations.every(isLatLon)) {
      const distances = await getDistances(resolvedProfile, origin, destinations);
      return NextResponse.json({ distances });
    }

    return NextResponse.json(
      { error: "Fournissez soit 'destination', soit 'destinations' (tableau)." },
      { status: 400 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur de routage inconnue.';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}