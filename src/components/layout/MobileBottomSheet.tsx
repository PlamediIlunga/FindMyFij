'use client';

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import styles from './MobileBottomSheet.module.scss';

export type SheetSnap = 'peek' | 'half' | 'full';

/** Même idée que `FlyToTarget` ailleurs dans le projet : un `requestId`
 * incrémenté force l'effet même si le palier demandé est déjà actif. */
export interface SheetSnapRequest {
  snap: SheetSnap;
  requestId: number;
}

interface MobileBottomSheetProps {
  title: string;
  count: number;
  /** Contenu affiché en tête de feuille, au-dessus de la liste (ex: mini-fiche). */
  headerExtra?: ReactNode;
  /** Contenu affiché seulement à mi-hauteur/plein écran (filtres, liste...). */
  children: ReactNode;
  snapRequest?: SheetSnapRequest | null;
  onSnapChange?: (snap: SheetSnap) => void;
}

const PEEK_HEIGHT = 132;
const HALF_RATIO = 0.5;
const FULL_RATIO = 0.92;
const NEXT_SNAP: Record<SheetSnap, SheetSnap> = { peek: 'half', half: 'full', full: 'peek' };

/**
 * Feuille inférieure mobile façon Google Maps : trois paliers (aperçu,
 * mi-hauteur, plein écran) contrôlables au doigt via la poignée, ou en tapant
 * dessus pour faire défiler les paliers sans geste.
 */
export function MobileBottomSheet({
  title,
  count,
  headerExtra,
  children,
  snapRequest,
  onSnapChange,
}: MobileBottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const [snap, setSnap] = useState<SheetSnap>('peek');
  const [isDragging, setIsDragging] = useState(false);
  const dragState = useRef<{ pointerId: number; startY: number; startTranslate: number; moved: boolean } | null>(
    null
  );
  const viewportHeight = useRef(0);

  useEffect(() => {
    function updateViewport() {
      viewportHeight.current = window.innerHeight;
    }
    updateViewport();
    window.addEventListener('resize', updateViewport);
    return () => window.removeEventListener('resize', updateViewport);
  }, []);

  function heightFor(target: SheetSnap): number {
    const vh = viewportHeight.current || window.innerHeight;
    if (target === 'peek') return PEEK_HEIGHT;
    if (target === 'half') return vh * HALF_RATIO;
    return vh * FULL_RATIO;
  }

  function translateFor(target: SheetSnap): number {
    return heightFor('full') - heightFor(target);
  }

  function applyTranslate(value: number) {
    if (sheetRef.current) {
      sheetRef.current.style.transform = `translateY(${value}px)`;
    }
  }

  function goToSnap(target: SheetSnap) {
    setSnap(target);
    applyTranslate(translateFor(target));
    onSnapChange?.(target);
  }

  // Applique un palier demandé depuis le parent (ex: sélection d'une FIJ sur
  // la carte -> repli en aperçu pour laisser voir le marqueur).
  useEffect(() => {
    if (!snapRequest) return;
    goToSnap(snapRequest.snap);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapRequest?.requestId]);

  useEffect(() => {
    applyTranslate(translateFor(snap));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    dragState.current = {
      pointerId: event.pointerId,
      startY: event.clientY,
      startTranslate: translateFor(snap),
      moved: false,
    };
    setIsDragging(true);
    (event.target as HTMLElement).setPointerCapture?.(event.pointerId);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragState.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const delta = event.clientY - drag.startY;
    if (Math.abs(delta) > 4) drag.moved = true;

    const minTranslate = translateFor('full');
    const maxTranslate = translateFor('peek') + 60; // légère résistance en bas
    const next = Math.min(maxTranslate, Math.max(minTranslate, drag.startTranslate + delta));
    applyTranslate(next);
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragState.current;
    setIsDragging(false);
    if (!drag) return;

    if (!drag.moved) {
      // Simple tap sur la poignée : on fait défiler les paliers.
      goToSnap(NEXT_SNAP[snap]);
      dragState.current = null;
      return;
    }

    const currentTranslate =
      sheetRef.current && sheetRef.current.style.transform
        ? parseFloat(sheetRef.current.style.transform.replace(/[^\d.-]/g, ''))
        : translateFor(snap);

    const candidates: SheetSnap[] = ['full', 'half', 'peek'];
    const nearest = candidates.reduce((best, candidate) => {
      const bestDelta = Math.abs(translateFor(best) - currentTranslate);
      const candidateDelta = Math.abs(translateFor(candidate) - currentTranslate);
      return candidateDelta < bestDelta ? candidate : best;
    }, 'peek' as SheetSnap);

    goToSnap(nearest);
    dragState.current = null;
  }

  return (
    <div
      ref={sheetRef}
      className={`${styles.sheet} ${isDragging ? styles.dragging : ''}`}
      style={{ height: `${FULL_RATIO * 100}dvh` }}
    >
      <div
        className={styles.handleArea}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        role="button"
        tabIndex={0}
        aria-label="Faire glisser pour agrandir ou réduire la liste des FIJ"
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') goToSnap(NEXT_SNAP[snap]);
        }}
      >
        <span className={styles.handle} />
        <div className={styles.headerRow}>
          <p className={styles.title}>{title}</p>
          <span className={styles.count}>{count} FIJ</span>
        </div>
      </div>

      {headerExtra && <div className={styles.headerExtra}>{headerExtra}</div>}

      <div className={styles.body}>{children}</div>
    </div>
  );
}
