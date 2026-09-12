import { NextResponse } from 'next/server';
import { getDrivingRoute, getDrivingDistances, type LatLon } from '@/lib/routing/locationiq';

function isLatLon(value: unknown): value is LatLon {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as LatLon).latitude === 'number' &&
    typeof (value as LatLon).longitude === 'number'
  );
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Corps de requête JSON invalide.' }, { status: 400 });
  }

  const { origin, destination, destinations } = body as {
    origin?: unknown;
    destination?: unknown;
    destinations?: unknown;
  };

  if (!isLatLon(origin)) {
    return NextResponse.json(
      { error: "Le champ 'origin' ({ latitude, longitude }) est requis." },
      { status: 400 }
    );
  }

  try {
    if (destination !== undefined) {
      if (!isLatLon(destination)) {
        return NextResponse.json(
          { error: "Le champ 'destination' ({ latitude, longitude }) est invalide." },
          { status: 400 }
        );
      }
      const route = await getDrivingRoute(origin, destination);
      if (!route) {
        return NextResponse.json({ error: 'Aucun itinéraire trouvé.' }, { status: 404 });
      }
      return NextResponse.json(route);
    }

    if (Array.isArray(destinations) && destinations.every(isLatLon)) {
      const distances = await getDrivingDistances(origin, destinations);
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