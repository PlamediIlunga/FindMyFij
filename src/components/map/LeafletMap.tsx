'use client';

import { useEffect, useMemo, useRef, type MutableRefObject } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, ZoomControl } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import type { Fij, ReferencePoint } from '@/types/fij';
import { FIJDetails } from '@/components/fij/FIJDetails';
import { getFijIcon, getReferencePinIcon, getUserLocationIcon } from './fijMarkerIcon';

export interface FlyToTarget {
  latitude: number;
  longitude: number;
  zoom?: number;
  /** Incrémenté à chaque nouvelle demande pour forcer l'effet même si les coords sont identiques. */
  requestId: number;
}

interface LeafletMapProps {
  fijList: Fij[];
  selectedFijId: string | null;
  onSelectFij: (fij: Fij) => void;
  onViewFullFij?: (fij: Fij) => void;
  referencePoint: ReferencePoint | null;
  nearestFijId: string | null;
  routeGeometry: [number, number][] | null;
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
    // Léger délai pour laisser le flyTo démarrer / le cluster se dégrouper
    // avant d'ouvrir le popup (sinon Leaflet peut ignorer l'appel si le
    // marqueur n'est pas encore rattaché à la carte visible).
    const timeout = window.setTimeout(() => {
      marker.openPopup();
    }, 350);
    return () => window.clearTimeout(timeout);
  }, [selectedFijId, markerRefs]);
}

export default function LeafletMap({
  fijList,
  selectedFijId,
  onSelectFij,
  onViewFullFij,
  referencePoint,
  nearestFijId,
  routeGeometry,
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
      {referencePoint && nearestFijId && (() => {
        const nearest = fijList.find((fij) => fij.id === nearestFijId);
        if (!nearest) return null;

        const straightLine: [number, number][] = [
          [referencePoint.latitude, referencePoint.longitude],
          [nearest.latitude, nearest.longitude],
        ];

        // Tracé réel (suit les routes) une fois calculé par /api/routing ;
        // ligne droite en repli tant qu'il n'est pas prêt ou si le routage a
        // échoué (clé absente, service indisponible...). Le pointillé signale
        // dans les deux cas qu'il s'agit d'une estimation, pas d'un trajet
        // routier confirmé.
        const positions = routeGeometry ?? straightLine;
        const isApproximate = !routeGeometry;

        return (
          <Polyline
            key={isApproximate ? 'approx' : 'real'}
            positions={positions}
            pathOptions={{
              color: '#FF6A2C',
              weight: 4,
              opacity: isRoutingPath ? 0.55 : 0.85,
              dashArray: isApproximate ? '8 8' : undefined,
            }}
          />
        );
      })()}
    </MapContainer>
  );
}