'use client';

import { useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Tooltip, useMap, ZoomControl } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import type { Fij, ReferencePoint } from '@/types/fij';
import { FIJDetails } from '@/components/fij/FIJDetails';
import { formatDistance, formatDuration } from '@/lib/geo/distance';
import { getFijIcon, getReferencePinIcon, getUserLocationIcon } from './fijMarkerIcon';

export interface FlyToTarget {
  latitude: number;
  longitude: number;
  zoom?: number;
  /** Incrémenté à chaque nouvelle demande pour forcer l'effet même si les coords sont identiques. */
  requestId: number;
}

/** Un trajet (à pied ou en voiture) entre le point de référence et une FIJ —
 * voir src/lib/routing/locationiq.ts (Route) dont la forme est identique. */
export interface RouteOption {
  distanceMeters: number;
  durationSeconds: number;
  geometry: [number, number][];
}

interface LeafletMapProps {
  fijList: Fij[];
  selectedFijId: string | null;
  onSelectFij: (fij: Fij) => void;
  onViewFullFij?: (fij: Fij) => void;
  referencePoint: ReferencePoint | null;
  nearestFijId: string | null;
  /** Trajet à pied réel (prioritaire par défaut) vers la FIJ la plus proche —
   * `null` tant qu'il n'est pas disponible, auquel cas une ligne droite de
   * repli est affichée à sa place. */
  walkingRoute: RouteOption | null;
  /** Trajet en voiture réel (indicatif) vers la même FIJ — `null` s'il n'est
   * pas (encore) disponible. */
  drivingRoute: RouteOption | null;
  /** true pendant que les trajets sont en cours de calcul — affiche la
   * ligne droite de repli (à pied) en pointillé "provisoire". */
  isRoutingPath: boolean;
  flyToTarget: FlyToTarget | null;
}

const DEFAULT_CENTER: [number, number] = [45.45, -75.65]; // entre Gatineau/Ottawa
const DEFAULT_ZOOM = 10;

/** Composant interne qui déplace la carte quand `target` change. */
function FlyToController({ target }: { target: FlyToTarget | null }) {
  const map = useMap();
  useEffect(() => {
    if (!target) return;
    map.flyTo([target.latitude, target.longitude], target.zoom ?? 15, {
      duration: 0.8,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target?.requestId]);
  return null;
}

/**
 * Ouvre automatiquement le popup du marqueur sélectionné (recherche, liste
 * ou clic direct) : sans ça, choisir une FIJ hors du champ visible actuel
 * recentre bien la carte mais ne montre aucun retour visuel immédiat une
 * fois arrivé, ce qui peut donner l'impression que rien ne s'est passé.
 */
function useOpenSelectedPopup(
  selectedFijId: string | null,
  markerRefs: MutableRefObject<Record<string, L.Marker | null>>
) {
  useEffect(() => {
    if (!selectedFijId) return;
    const marker = markerRefs.current[selectedFijId];
    if (!marker) return;
    const timeout = window.setTimeout(() => {
      marker.openPopup();
    }, 350);
    return () => window.clearTimeout(timeout);
  }, [selectedFijId, markerRefs]);
}

type RouteMode = 'walking' | 'driving';

/**
 * Trace les deux trajets vers la FIJ la plus proche, façon Google Maps :
 * celui actuellement mis en avant en trait plein orange, l'autre en gris —
 * cliquer sur l'un ou l'autre bascule lequel est mis en avant. À pied est
 * actif par défaut (voir `useState` ci-dessous), mais rien n'empêche de
 * consulter la voiture d'un clic ; la navigation réelle en voiture reste de
 * toute façon déléguée à Google Maps via le bouton "Voir l'itinéraire".
 */
function RouteLayer({
  referencePoint,
  nearestFij,
  walkingRoute,
  drivingRoute,
  isRoutingPath,
}: {
  referencePoint: ReferencePoint;
  nearestFij: Fij;
  walkingRoute: RouteOption | null;
  drivingRoute: RouteOption | null;
  isRoutingPath: boolean;
}) {
  const [activeMode, setActiveMode] = useState<RouteMode>('walking');

  const straightLine: [number, number][] = [
    [referencePoint.latitude, referencePoint.longitude],
    [nearestFij.latitude, nearestFij.longitude],
  ];

  const walkingElement = walkingRoute ? (
    <Polyline
      key="walking"
      positions={walkingRoute.geometry}
      eventHandlers={{ click: () => setActiveMode('walking') }}
      pathOptions={{
        color: activeMode === 'walking' ? '#FF6A2C' : '#9AA0B4',
        weight: activeMode === 'walking' ? 5 : 4,
        opacity: activeMode === 'walking' ? 0.9 : 0.65,
      }}
    >
      <Tooltip sticky opacity={0.95}>
        {activeMode === 'walking' ? 'À pied — ' : 'Cliquer pour voir à pied — '}
        {formatDuration(walkingRoute.durationSeconds)} ({formatDistance(walkingRoute.distanceMeters)})
      </Tooltip>
    </Polyline>
  ) : (
    <Polyline
      key="walking-fallback"
      positions={straightLine}
      pathOptions={{
        color: '#FF6A2C',
        weight: 4,
        opacity: isRoutingPath ? 0.55 : 0.85,
        dashArray: '8 8',
      }}
    />
  );

  const drivingElement = drivingRoute ? (
    <Polyline
      key="driving"
      positions={drivingRoute.geometry}
      eventHandlers={{ click: () => setActiveMode('driving') }}
      pathOptions={{
        color: activeMode === 'driving' ? '#FF6A2C' : '#9AA0B4',
        weight: activeMode === 'driving' ? 5 : 4,
        opacity: activeMode === 'driving' ? 0.9 : 0.65,
      }}
    >
      <Tooltip sticky opacity={0.95}>
        {activeMode === 'driving' ? 'En voiture — ' : 'Cliquer pour voir en voiture — '}
        {formatDuration(drivingRoute.durationSeconds)} ({formatDistance(drivingRoute.distanceMeters)})
      </Tooltip>
    </Polyline>
  ) : null;

  // Le tracé actif est dessiné en dernier (donc par-dessus) pour rester
  // visuellement au premier plan ; celui du dessous reste cliquable sur
  // toute portion où les deux trajets ne se superposent pas exactement.
  const elements =
    activeMode === 'walking' ? [drivingElement, walkingElement] : [walkingElement, drivingElement];

  return <>{elements}</>;
}

export default function LeafletMap({
  fijList,
  selectedFijId,
  onSelectFij,
  onViewFullFij,
  referencePoint,
  nearestFijId,
  walkingRoute,
  drivingRoute,
  isRoutingPath,
  flyToTarget,
}: LeafletMapProps) {
  const markerRefs = useRef<Record<string, L.Marker | null>>({});
  useOpenSelectedPopup(selectedFijId, markerRefs);

  const clusterIconCreate = useMemo(
    () => (cluster: { getChildCount: () => number }) => {
      const count = cluster.getChildCount();
      return L.divIcon({
        html: `<div>${count}</div>`,
        className: 'marker-cluster-fij',
        iconSize: L.point(40, 40, true),
      });
    },
    []
  );

  const nearestFij = nearestFijId ? fijList.find((fij) => fij.id === nearestFijId) ?? null : null;

  return (
    <MapContainer
      center={DEFAULT_CENTER}
      zoom={DEFAULT_ZOOM}
      style={{ height: '100%', width: '100%' }}
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <ZoomControl position="bottomright" />
      <FlyToController target={flyToTarget} />

      <MarkerClusterGroup
        chunkedLoading
        iconCreateFunction={clusterIconCreate}
        maxClusterRadius={55}
        spiderfyOnMaxZoom
      >
        {fijList.map((fij) => (
          <Marker
            key={fij.id}
            position={[fij.latitude, fij.longitude]}
            icon={getFijIcon(fij.category, fij.id === selectedFijId)}
            eventHandlers={{ click: () => onSelectFij(fij) }}
            ref={(ref) => {
              markerRefs.current[fij.id] = ref;
            }}
          >
            <Popup>
              <FIJDetails fij={fij} onViewFullPage={onViewFullFij} />
            </Popup>
          </Marker>
        ))}
      </MarkerClusterGroup>

      {referencePoint && (
        <Marker
          position={[referencePoint.latitude, referencePoint.longitude]}
          icon={
            referencePoint.source === 'gps' ? getUserLocationIcon() : getReferencePinIcon()
          }
        />
      )}

      {referencePoint && nearestFij && (
        <RouteLayer
          // Remonte l'état "tracé actif" à pied par défaut à chaque nouvelle
          // FIJ ciblée (nouvelle recherche) plutôt que de garder le choix
          // "voiture" d'une recherche précédente.
          key={nearestFij.id}
          referencePoint={referencePoint}
          nearestFij={nearestFij}
          walkingRoute={walkingRoute}
          drivingRoute={drivingRoute}
          isRoutingPath={isRoutingPath}
        />
      )}
    </MapContainer>
  );
}