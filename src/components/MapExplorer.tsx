'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Fij, FijCategory, GeocodeResult, ReferencePoint } from '@/types/fij';
import { FIJ_CATEGORIES } from '@/types/fij';
import { sortFijByDistance } from '@/lib/geo/distance';
import type { FlyToTarget, RouteOption } from '@/components/map/LeafletMap';
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

// On ne calcule les distances/trajets réels que pour les N FIJ les plus
// proches à vol d'oiseau : largement suffisant pour une liste "à proximité"
// fiable, et beaucoup plus léger/rapide qu'interroger TOUTES les FIJ
// filtrées à chaque recherche (ce qui multipliait aussi les risques de
// dépasser la limite de débit de l'offre gratuite LocationIQ).
const ROUTING_CANDIDATE_LIMIT = 12;

/**
 * Appelle /api/routing avec un ré-essai automatique en cas d'échec.
 * Notre propre route API transforme TOUTE erreur LocationIQ (429 "trop de
 * requêtes" compris) en 502 avant de nous la renvoyer — on ne peut donc pas
 * distinguer un vrai 429 d'un 502, et on ré-essaie sur n'importe quel échec,
 * pas seulement 429. Backoff croissant (450ms puis 900ms), 2 tentatives max.
 */
async function fetchRouting<T>(body: unknown, attempt = 0): Promise<T | null> {
  try {
    const response = await fetch('/api/routing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      if (attempt < 2) {
        await new Promise((resolve) => setTimeout(resolve, 450 * (attempt + 1)));
        return fetchRouting<T>(body, attempt + 1);
      }
      return null;
    }
    return (await response.json()) as T;
  } catch {
    return null;
  }
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

  // --- Routage réel (LocationIQ/OSRM) : à pied en priorité (détermine la
  // FIJ "la plus proche" et le tri de la liste), voiture à titre indicatif
  // uniquement (la navigation réelle en voiture reste déléguée à Google
  // Maps via le bouton "Voir l'itinéraire"). ---
  const [walkingDistances, setWalkingDistances] = useState<Map<string, number> | null>(null);
  const [walkingRoute, setWalkingRoute] = useState<RouteOption | null>(null);
  const [drivingRoute, setDrivingRoute] = useState<RouteOption | null>(null);
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

  const haversineNearbyFij = useMemo(
    () => (referencePoint ? sortFijByDistance(filteredFij, referencePoint) : []),
    [filteredFij, referencePoint]
  );

  useEffect(() => {
    if (!referencePoint || filteredFij.length === 0) {
      setWalkingDistances(null);
      setWalkingRoute(null);
      setDrivingRoute(null);
      return;
    }

    let cancelled = false;
    setIsRoutingDistances(true);
    setIsRoutingPath(true);

    (async () => {
      const candidates = sortFijByDistance(filteredFij, referencePoint).slice(
        0,
        ROUTING_CANDIDATE_LIMIT
      );

      // 1) Distances à pied vers chaque candidat -> détermine la FIJ la
      // plus proche (priorité à la marche, comme demandé).
      const matrixData = await fetchRouting<{ distances?: (number | null)[] }>({
        profile: 'walking',
        origin: { latitude: referencePoint.latitude, longitude: referencePoint.longitude },
        destinations: candidates.map((fij) => ({
          latitude: fij.latitude,
          longitude: fij.longitude,
        })),
      });

      if (cancelled) return;

      const distanceMap = new Map<string, number>();
      candidates.forEach((fij, index) => {
        const distance = matrixData?.distances?.[index];
        if (typeof distance === 'number') distanceMap.set(fij.id, distance);
      });
      setWalkingDistances(distanceMap.size > 0 ? distanceMap : null);
      setIsRoutingDistances(false);

      const confirmedNearest = candidates
        .map((fij) => ({ ...fij, distanceMeters: distanceMap.get(fij.id) ?? fij.distanceMeters }))
        .sort((a, b) => a.distanceMeters - b.distanceMeters)[0];

      if (!confirmedNearest) {
        if (!cancelled) {
          setWalkingRoute(null);
          setDrivingRoute(null);
          setIsRoutingPath(false);
        }
        return;
      }

      // 2) Trajet à pied détaillé vers cette FIJ (pour le tracé sur la carte).
      // Petite pause : l'offre gratuite LocationIQ limite le débit à
      // quelques requêtes/seconde.
      await new Promise((resolve) => setTimeout(resolve, 300));
      if (cancelled) return;

      const walkingData = await fetchRouting<{ routes?: RouteOption[] }>({
        profile: 'walking',
        origin: { latitude: referencePoint.latitude, longitude: referencePoint.longitude },
        destination: {
          latitude: confirmedNearest.latitude,
          longitude: confirmedNearest.longitude,
        },
      });
      if (!cancelled) {
        setWalkingRoute(walkingData?.routes?.[0] ?? null);
        setIsRoutingPath(false);
      }

      // 3) Trajet en voiture vers la même FIJ, à titre indicatif.
      await new Promise((resolve) => setTimeout(resolve, 300));
      if (cancelled) return;

      const drivingData = await fetchRouting<{ routes?: RouteOption[] }>({
        profile: 'driving',
        origin: { latitude: referencePoint.latitude, longitude: referencePoint.longitude },
        destination: {
          latitude: confirmedNearest.latitude,
          longitude: confirmedNearest.longitude,
        },
      });
      if (!cancelled) {
        setDrivingRoute(drivingData?.routes?.[0] ?? null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [referencePoint, filteredFij]);

  const nearbyFij = useMemo(() => {
    if (!referencePoint) return [];
    if (!walkingDistances) return haversineNearbyFij;

    return haversineNearbyFij
      .map((fij) => ({
        ...fij,
        distanceMeters: walkingDistances.get(fij.id) ?? fij.distanceMeters,
      }))
      .sort((a, b) => a.distanceMeters - b.distanceMeters);
  }, [haversineNearbyFij, referencePoint, walkingDistances]);

  const nearestFij = nearbyFij[0] ?? null;

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
    ? isRoutingDistances && !walkingDistances
      ? 'FIJ à proximité (calcul des distances à pied…)'
      : 'FIJ à proximité (à pied)'
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
            walkingRoute={walkingRoute}
            drivingRoute={drivingRoute}
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