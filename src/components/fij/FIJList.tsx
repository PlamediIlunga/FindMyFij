'use client';

import type { Fij, FijWithDistance } from '@/types/fij';
import { FIJCard } from './FIJCard';
import styles from './FIJList.module.scss';

interface FIJListProps {
  title: string;
  fijList: Fij[] | FijWithDistance[];
  selectedFijId: string | null;
  onSelectFij: (fij: Fij) => void;
  emptyMessage?: string;
}

function hasDistance(fij: Fij | FijWithDistance): fij is FijWithDistance {
  return 'distanceMeters' in fij;
}

export function FIJList({
  title,
  fijList,
  selectedFijId,
  onSelectFij,
  emptyMessage = 'Aucune FIJ ne correspond à vos filtres.',
}: FIJListProps) {
  return (
    <div className={styles.section}>
      <p className={styles.sectionTitle}>{title}</p>
      {fijList.length === 0 ? (
        <p className={styles.emptyState}>{emptyMessage}</p>
      ) : (
        <div className={styles.list}>
          {fijList.map((fij) => (
            <FIJCard
              key={fij.id}
              fij={fij}
              distanceMeters={hasDistance(fij) ? fij.distanceMeters : undefined}
              isSelected={fij.id === selectedFijId}
              onSelect={onSelectFij}
            />
          ))}
        </div>
      )}
    </div>
  );
}
