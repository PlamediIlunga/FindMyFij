'use client';

import dynamic from 'next/dynamic';
import type { Fij, ReferencePoint } from '@/types/fij';
import type { FlyToTarget } from './LeafletMap';
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
  /** Tracé réel (LocationIQ/OSRM) entre `referencePoint` et la FIJ la plus
   * proche — liste de [lat, lon]. `null` tant qu'il n'est pas encore
   * disponible (ou si le routage a échoué), auquel cas LeafletMap trace une
   * ligne droite de repli. */
  routeGeometry: [number, number][] | null;
  /** true pendant que le tracé réel est en cours de calcul — permet
   * d'afficher la ligne droite de repli en pointillé "provisoire". */
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