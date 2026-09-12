'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Fij, FijCategory, GeocodeResult, ReferencePoint } from '@/types/fij';
import { FIJ_CATEGORIES } from '@/types/fij';
import { sortFijByDistance } from '@/lib/geo/distance';
import type { FlyToTarget } from '@/components/map/LeafletMap';
import { MapView } from '@/components/map/MapView';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileBottomSheet, type SheetSnapRequest } from '@/components/layout/MobileBottomSheet';
import { SearchBar } from '@/components/search/SearchBar';
import { CategoryFilter } from '@/components/filters/CategoryFilter';
import { LocationButton } from '@/components/location/LocationButton';
import { FIJList } from '@/components/fij/FIJList';
import { FijDetailModal } from '@/components/fij/FijDetailModal';
import { FijMiniCard } from '@/components/fij/FijMiniCard';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { AdminEntryButton } from '@/components/layout/AdminEntryButton';
import styles from './MapExplorer.module.scss';

interface MapExplorerProps {
  initialFij: Fij[];
}

export function MapExplorer({ initialFij }: MapExplorerProps) {
  const [allFij] = useState<Fij[]>(initialFij);
  const [activeCategories, setActiveCategories] = useState<Set<FijCategory>>(
    () => new Set(FIJ_CATEGORIES)
  );
  const [activeCity, setActiveCity] = useState<string | 'all'>('all');
  const [selectedFijId, setSelectedFijId] = useState<string | null>(null);
  const [detailFij, setDetailFij] = useState<Fij | null>(null);
  const [referencePoint, setReferencePoint] = useState<ReferencePoint | null>(null);
  const [flyToTarget, setFlyToTarget] = useState<FlyToTarget | null>(null);
  const [sheetSnapRequest, setSheetSnapRequest] = useState<SheetSnapRequest | null>(null);

  // --- Routage réel (LocationIQ/OSRM) ---
  // `drivingDistances` : distances routières (mètres) par id de FIJ, calculées
  // via /api/routing (matrix). Tant que l'appel n'a pas répondu (ou échoue),
  // on retombe sur la distance à vol d'oiseau pour ne jamais bloquer l'UI.
  const [drivingDistances, setDrivingDistances] = useState<Map<string, number> | null>(null);
  // `routeGeometry` : tracé réel (liste de [lat, lon]) entre le point de
  // référence et la FIJ la plus proche, à afficher à la place d'une ligne
  // droite dans LeafletMap.
  const [routeGeometry, setRouteGeometry] = useState<[number, number][] | null>(null);
  const [isRoutingDistances, setIsRoutingDistances] = useState(false);
  const [isRoutingPath, setIsRoutingPath] = useState(false);

  const cities = useMemo(
    () => Array.from(new Set(allFij.map((fij) => fij.city))).sort((a, b) => a.localeCompare(b)),
    [allFij]
  );

  const filteredFij = useMemo(
    () =>
      allFij.filter(
        (fij) =>
          activeCategories.has(fij.category) &&
          (activeCity === 'all' || fij.city === activeCity)
      ),
    [allFij, activeCategories, activeCity]
  );

  // Tri à vol d'oiseau : calcul instantané, utilisé tel quel tant que les
  // distances routières réelles n'ont pas encore répondu, et comme repli si
  // l'appel échoue (clé manquante, service indisponible, etc.).
  const haversineNearbyFij = useMemo(
    () => (referencePoint ? sortFijByDistance(filteredFij, referencePoint) : []),
    [filteredFij, referencePoint]
  );

  // Récupère les distances routières réelles pour toutes les FIJ filtrées
  // dès qu'un point de référence existe (adresse recherchée ou position GPS).
  useEffect(() => {
    if (!referencePoint || filteredFij.length === 0) {
      setDrivingDistances(null);
      return;
    }

    let cancelled = false;
    setIsRoutingDistances(true);

    (async () => {
      try {
        const response = await fetch('/api/routing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            origin: { latitude: referencePoint.latitude, longitude: referencePoint.longitude },
            destinations: filteredFij.map((fij) => ({
              latitude: fij.latitude,
              longitude: fij.longitude,
            })),
          }),
        });
        if (!response.ok) {
          if (!cancelled) setDrivingDistances(null);
          return;
        }
        const data = (await response.json()) as { distances?: (number | null)[] };
        if (cancelled) return;

        const next = new Map<string, number>();
        filteredFij.forEach((fij, index) => {
          const distance = data.distances?.[index];
          if (typeof distance === 'number') next.set(fij.id, distance);
        });
        setDrivingDistances(next.size > 0 ? next : null);
      } catch {
        if (!cancelled) setDrivingDistances(null);
      } finally {
        if (!cancelled) setIsRoutingDistances(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [referencePoint, filteredFij]);

  // Liste "à proximité" finale : distances routières réelles quand elles
  // sont disponibles, sinon repli sur le tri à vol d'oiseau.
  const nearbyFij = useMemo(() => {
    if (!referencePoint) return [];
    if (!drivingDistances) return haversineNearbyFij;

    return haversineNearbyFij
      .map((fij) => ({
        ...fij,
        distanceMeters: drivingDistances.get(fij.id) ?? fij.distanceMeters,
      }))
      .sort((a, b) => a.distanceMeters - b.distanceMeters);
  }, [haversineNearbyFij, referencePoint, drivingDistances]);

  const nearestFij = nearbyFij[0] ?? null;

  // Récupère le tracé réel (suit les routes) entre le point de référence et
  // la FIJ la plus proche, pour remplacer la ligne droite dans LeafletMap.
  useEffect(() => {
    if (!referencePoint || !nearestFij) {
      setRouteGeometry(null);
      return;
    }

    let cancelled = false;
    setIsRoutingPath(true);

    (async () => {
      try {
        const response = await fetch('/api/routing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            origin: { latitude: referencePoint.latitude, longitude: referencePoint.longitude },
            destination: { latitude: nearestFij.latitude, longitude: nearestFij.longitude },
          }),
        });
        if (!response.ok) {
          if (!cancelled) setRouteGeometry(null);
          return;
        }
        const data = (await response.json()) as { geometry?: [number, number][] };
        if (!cancelled) setRouteGeometry(data.geometry ?? null);
      } catch {
        if (!cancelled) setRouteGeometry(null);
      } finally {
        if (!cancelled) setIsRoutingPath(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // On ne redéclenche que si le point de référence ou la FIJ la plus
    // proche change réellement — pas à chaque recalcul de `nearbyFij`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [referencePoint, nearestFij?.id]);

  const selectedFij = useMemo(
    () => allFij.find((fij) => fij.id === selectedFijId) ?? null,
    [allFij, selectedFijId]
  );

  const selectedDistanceMeters = useMemo(() => {
    if (!selectedFij) return undefined;
    return nearbyFij.find((fij) => fij.id === selectedFij.id)?.distanceMeters;
  }, [nearbyFij, selectedFij]);

  function requestSheetSnap(snap: SheetSnapRequest['snap']) {
    setSheetSnapRequest((previous) => ({ snap, requestId: (previous?.requestId ?? 0) + 1 }));
  }

  function flyTo(latitude: number, longitude: number, zoom = 15) {
    setFlyToTarget((previous) => ({
      latitude,
      longitude,
      zoom,
      requestId: (previous?.requestId ?? 0) + 1,
    }));
  }

  function handleSelectFij(fij: Fij) {
    setActiveCategories((previous) => {
      if (previous.has(fij.category)) return previous;
      const next = new Set(previous);
      next.add(fij.category);
      return next;
    });
    setActiveCity((previous) => (previous === 'all' || previous === fij.city ? previous : 'all'));
    setSelectedFijId(fij.id);
    flyTo(fij.latitude, fij.longitude);
    requestSheetSnap('peek');
  }

  function handleToggleGlobal() {
    setActiveCategories((previous) => {
      const allActive = FIJ_CATEGORIES.every((category) => previous.has(category));
      return allActive ? new Set() : new Set(FIJ_CATEGORIES);
    });
  }

  function handleViewFullFij(fij: Fij) {
    setSelectedFijId(fij.id);
    setDetailFij(fij);
    flyTo(fij.latitude, fij.longitude);
  }

  function handleDeselect() {
    setSelectedFijId(null);
  }

  function handleToggleCategory(category: FijCategory) {
    setActiveCategories((previous) => {
      const next = new Set(previous);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }

  function handleAddressGeocoded(result: GeocodeResult, label: string) {
    setReferencePoint({
      latitude: result.latitude,
      longitude: result.longitude,
      label,
      source: 'address',
    });
    flyTo(result.latitude, result.longitude, 13);
    requestSheetSnap('half');
  }

  function handleLocated(position: { latitude: number; longitude: number }) {
    setReferencePoint({
      latitude: position.latitude,
      longitude: position.longitude,
      label: 'Ma position',
      source: 'gps',
    });
    flyTo(position.latitude, position.longitude, 13);
  }

  const listTitle = referencePoint
    ? isRoutingDistances && !drivingDistances
      ? 'FIJ à proximité (distances estimées…)'
      : 'FIJ à proximité'
    : 'Toutes les FIJ';
  const listData = referencePoint ? nearbyFij : filteredFij;

  return (
    <div className={styles.app}>
      <div className={styles.desktopOnly}>
        <Header />
      </div>

      <div className={styles.body}>
        <div className={styles.desktopOnly} style={{ display: 'flex' }}>
          <Sidebar>
            <SearchBar
              fijList={allFij}
              onSelectFij={handleSelectFij}
              onAddressGeocoded={handleAddressGeocoded}
            />
            <CategoryFilter
              activeCategories={activeCategories}
              onToggleCategory={handleToggleCategory}
              onToggleGlobal={handleToggleGlobal}
              cities={cities}
              activeCity={activeCity}
              onChangeCity={setActiveCity}
            />
            <LocationButton onLocated={handleLocated} />
            <FIJList
              title={listTitle}
              fijList={listData}
              selectedFijId={selectedFijId}
              onSelectFij={handleSelectFij}
            />
          </Sidebar>
        </div>

        <div className={styles.mapArea}>
          <div className={styles.mobileTopBar}>
            <div className={styles.mobileSearchRow}>
              <div className={styles.mobileSearchGrow}>
                <SearchBar
                  fijList={allFij}
                  onSelectFij={handleSelectFij}
                  onAddressGeocoded={handleAddressGeocoded}
                />
              </div>
              <ThemeToggle />
              <AdminEntryButton />
            </div>
            <CategoryFilter
              variant="chips"
              activeCategories={activeCategories}
              onToggleCategory={handleToggleCategory}
              onToggleGlobal={handleToggleGlobal}
              cities={cities}
              activeCity={activeCity}
              onChangeCity={setActiveCity}
            />
          </div>

          <div className={styles.mobileFabStack}>
            <LocationButton onLocated={handleLocated} variant="fab" />
          </div>

          <MapView
            fijList={filteredFij}
            selectedFijId={selectedFijId}
            onSelectFij={handleSelectFij}
            onViewFullFij={handleViewFullFij}
            referencePoint={referencePoint}
            nearestFijId={nearestFij?.id ?? null}
            routeGeometry={routeGeometry}
            isRoutingPath={isRoutingPath}
            flyToTarget={flyToTarget}
          />
        </div>
      </div>

      <div className={styles.mobileOnly}>
        <MobileBottomSheet
          title={listTitle}
          count={listData.length}
          snapRequest={sheetSnapRequest}
          headerExtra={
            selectedFij ? (
              <FijMiniCard
                fij={selectedFij}
                distanceMeters={selectedDistanceMeters}
                onViewDetails={handleViewFullFij}
                onClose={handleDeselect}
              />
            ) : undefined
          }
        >
          <FIJList
            title=""
            fijList={listData}
            selectedFijId={selectedFijId}
            onSelectFij={handleSelectFij}
          />
        </MobileBottomSheet>
      </div>

      <FijDetailModal fij={detailFij} onClose={() => setDetailFij(null)} />
    </div>
  );
}