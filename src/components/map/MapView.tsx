'use client';

import dynamic from 'next/dynamic';
import type { Fij, ReferencePoint } from '@/types/fij';
import type { FlyToTarget, RouteOption } from './LeafletMap';
import styles from './MapView.module.scss';

// Leaflet manipule `window`/`document` dès son import : le rendu doit être
// désactivé côté serveur pour éviter les erreurs de build/SSR de Next.js.
const LeafletMap = dynamic(() => import('./LeafletMap'), {
  ssr: false,
  loading: () => (
    <div className={styles.loadingState}>
      <span className={styles.spinner} aria-hidden />
      <span>Chargement de la carte…</span>
    </div>
  ),
});

interface MapViewProps {
  fijList: Fij[];
  selectedFijId: string | null;
  onSelectFij: (fij: Fij) => void;
  onViewFullFij?: (fij: Fij) => void;
  referencePoint: ReferencePoint | null;
  nearestFijId: string | null;
  /** Trajet à pied réel (prioritaire) — `null` tant qu'il n'est pas encore
   * disponible, auquel cas LeafletMap affiche une ligne droite de repli. */
  walkingRoute: RouteOption | null;
  /** Trajet en voiture réel (indicatif) — `null` s'il n'est pas disponible. */
  drivingRoute: RouteOption | null;
  /** true pendant que les trajets sont en cours de calcul. */
  isRoutingPath: boolean;
  flyToTarget: FlyToTarget | null;
}

export function MapView(props: MapViewProps) {
  return (
    <div className={styles.mapWrapper}>
      <LeafletMap {...props} />
    </div>
  );
}