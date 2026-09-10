'use client';

import { useEffect } from 'react';
import type { Fij } from '@/types/fij';
import { FIJDetails } from './FIJDetails';
import styles from './FijDetailModal.module.scss';

interface FijDetailModalProps {
  fij: Fij | null;
  onClose: () => void;
}

export function FijDetailModal({ fij, onClose }: FijDetailModalProps) {
  useEffect(() => {
    if (!fij) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [fij, onClose]);

  if (!fij) return null;

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="fij-detail-title"
      onClick={onClose}
    >
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <span className={styles.dragHandle} aria-hidden />
        <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Fermer">
          ×
        </button>
        <FIJDetails fij={fij} />
      </div>
    </div>
  );
}
