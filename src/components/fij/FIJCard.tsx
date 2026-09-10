'use client';

import type { Fij } from '@/types/fij';
import { CATEGORY_COLORS } from '@/types/fij';
import { formatDistance } from '@/lib/geo/distance';
import styles from './FIJCard.module.scss';

interface FIJCardProps {
  fij: Fij;
  distanceMeters?: number;
  isSelected: boolean;
  onSelect: (fij: Fij) => void;
}

export function FIJCard({ fij, distanceMeters, isSelected, onSelect }: FIJCardProps) {
  return (
    <button
      type="button"
      className={`${styles.card} ${isSelected ? styles.selected : ''}`}
      onClick={() => onSelect(fij)}
    >
      <span className={styles.dot} style={{ background: CATEGORY_COLORS[fij.category] }} />
      <span className={styles.info}>
        <span className={styles.name}>{fij.name}</span>
        <br />
        <span className={styles.city}>{fij.city}</span>
        {fij.status === 'closed' && <span className={styles.closed}> · Fermé</span>}
        {fij.status === 'closed' && fij.statusNote && <><br /><span className={styles.statusNote}>{fij.statusNote}</span></>}
      </span>
      {distanceMeters !== undefined && (
        <span className={styles.distance}>{formatDistance(distanceMeters)}</span>
      )}
    </button>
  );
}
