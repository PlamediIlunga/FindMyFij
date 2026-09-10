'use client';

import { useMemo, useState } from 'react';
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

  const nearbyFij = useMemo(
    () => (referencePoint ? sortFijByDistance(filteredFij, referencePoint) : []),
    [filteredFij, referencePoint]
  );

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
    // Si la FIJ trouvée (recherche, liste...) appartient à une catégorie
    // actuellement masquée par les filtres, on la réactive : sans ça, la
    // carte se déplace bien vers le bon point mais aucun marqueur n'y est
    // visible, ce qui donne l'impression que « rien ne se passe ».
    setActiveCategories((previous) => {
      if (previous.has(fij.category)) return previous;
      const next = new Set(previous);
      next.add(fij.category);
      return next;
    });
    setActiveCity((previous) => (previous === 'all' || previous === fij.city ? previous : 'all'));
    setSelectedFijId(fij.id);
    flyTo(fij.latitude, fij.longitude);
    // Sur mobile, on replie la feuille pour laisser voir le marqueur choisi ;
    // la mini-fiche prend le relais en tête de feuille.
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
    // Une recherche d'adresse sert à comparer les FIJ proches : sur mobile,
    // ouvrir directement la feuille à mi-hauteur rend le résultat visible.
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

  const listTitle = referencePoint ? 'FIJ à proximité' : 'Toutes les FIJ';
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
            nearestFijId={nearbyFij[0]?.id ?? null}
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
