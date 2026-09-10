import L from 'leaflet';
import { CATEGORY_COLORS, type FijCategory } from '@/types/fij';

const iconCache = new Map<string, L.DivIcon>();

/**
 * Pin à glyphe, plus lisible qu'un simple point et visuellement proche des
 * repères cartographiques courants sans dépendre d'une image externe.
 */
export function getFijIcon(category: FijCategory, isSelected = false): L.DivIcon {
  const cacheKey = `${category}-${isSelected ? 'selected' : 'default'}`;
  const cached = iconCache.get(cacheKey);
  if (cached) return cached;

  const color = CATEGORY_COLORS[category];
  const size = isSelected ? 42 : 34;
  const glyph = category === 'Jeunes' ? '✦' : '●';

  const icon = L.divIcon({
    className: 'fij-marker-icon',
    html: `
      <span style="
        display:block;
        width:${size}px;
        height:${size}px;
        border-radius:50% 50% 50% 0;
        background:${color};
        border:3px solid #ffffff; color:#fff; font:800 ${Math.round(size * .48)}px Arial;
        text-align:center; line-height:${size - 6}px;
        box-shadow:0 5px 14px rgba(12,12,46,0.42);
        transform:rotate(-45deg) ${isSelected ? 'scale(1.15)' : 'scale(1)'};
        transition: transform 150ms ease;
      "><i style="display:block;font-style:normal;transform:rotate(45deg)">${glyph}</i></span>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });

  iconCache.set(cacheKey, icon);
  return icon;
}

/** Icône dédiée à la position de l'utilisateur (bleu, pulsation). */
export function getUserLocationIcon(): L.DivIcon {
  return L.divIcon({
    className: 'user-location-icon',
    html: `
      <span style="position:relative;display:block;width:18px;height:18px;">
        <span style="
          position:absolute; inset:-10px;
          border-radius:50%;
          background:rgba(46,110,255,0.25);
          animation:fij-pulse 1.8s ease-out infinite;
        "></span>
        <span style="
          display:block;width:18px;height:18px;border-radius:50%;
          background:#2e6eff;border:3px solid #ffffff;
          box-shadow:0 2px 6px rgba(12,12,46,0.4);
        "></span>
      </span>
      <style>
        @keyframes fij-pulse {
          0% { transform: scale(0.4); opacity: 0.8; }
          100% { transform: scale(1.6); opacity: 0; }
        }
      </style>
    `,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

/** Icône dédiée à une adresse recherchée manuellement (repère orange). */
export function getReferencePinIcon(): L.DivIcon {
  return L.divIcon({
    className: 'reference-pin-icon',
    html: `
      <svg width="30" height="40" viewBox="0 0 30 40" xmlns="http://www.w3.org/2000/svg">
        <path d="M15 0C6.7 0 0 6.7 0 15c0 11.3 15 25 15 25s15-13.7 15-25C30 6.7 23.3 0 15 0z" fill="#12123A"/>
        <circle cx="15" cy="15" r="6" fill="#FF6A2C"/>
      </svg>
    `,
    iconSize: [30, 40],
    iconAnchor: [15, 40],
    popupAnchor: [0, -40],
  });
}
