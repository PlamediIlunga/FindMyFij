import type { Fij } from '@/types/fij';
import { CATEGORY_COLORS } from '@/types/fij';
import { buildGoogleMapsDirectionsUrl } from '@/lib/maps/directions';
import styles from './FIJDetails.module.scss';

interface FIJDetailsProps {
  fij: Fij;
  /** Callback optionnel, ex: "Voir le FIJ" -> ouvrir une fiche complète ailleurs. */
  onViewFullPage?: (fij: Fij) => void;
}

/**
 * Fiche d'information d'une FIJ, utilisée dans le popup de la carte et dans
 * le panneau latéral lorsqu'un élément de la liste est sélectionné.
 */
export function FIJDetails({ fij, onViewFullPage }: FIJDetailsProps) {
  const directionsUrl = buildGoogleMapsDirectionsUrl(fij);

  return (
    <div className={styles.details}>
      <span
        className={styles.categoryTag}
        style={{ background: CATEGORY_COLORS[fij.category] }}
      >
        <span className={styles.categoryTagDot} aria-hidden />
        {fij.category}
      </span>
      <h3 className={styles.name}>{fij.name}</h3>
      {fij.status === 'closed' && <><span className={styles.closedBadge}>Fermé</span>{fij.statusNote && <p className={styles.statusNote}>{fij.statusNote}</p>}</>}
      <p className={styles.address}>
        <svg
          className={styles.pinIcon}
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
        >
          <path
            d="M12 22s7-7.58 7-12.5A7 7 0 0 0 5 9.5C5 14.42 12 22 12 22Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="9.5" r="2.4" stroke="currentColor" strokeWidth="1.8" />
        </svg>
        <span>
          {fij.address}{fij.unitNumber && <> · {fij.unitNumber}</>}
          <br />
          {fij.city}, {fij.province} {fij.postalCode}
          <br />
          {fij.country}
        </span>
      </p>
      {fij.phone && (
        <a className={styles.phone} href={`tel:${fij.phone.replace(/[^+\d]/g, '')}`}>
          ☎ {fij.phone}
        </a>
      )}
      <div className={styles.actions}>
        <a
          className={styles.buttonPrimary}
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          Voir l&apos;itinéraire
        </a>
        {onViewFullPage && (
          <button
            type="button"
            className={styles.buttonSecondary}
            onClick={() => onViewFullPage(fij)}
          >
            Voir la FIJ
          </button>
        )}
      </div>
    </div>
  );
}
