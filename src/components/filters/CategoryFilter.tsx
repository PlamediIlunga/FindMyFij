'use client';

import {
  FIJ_CATEGORIES,
  CATEGORY_COLORS,
  CATEGORY_DOTS,
  GLOBAL_COLOR,
  GLOBAL_DOT,
  type FijCategory,
} from '@/types/fij';
import styles from './CategoryFilter.module.scss';

interface CategoryFilterProps {
  activeCategories: Set<FijCategory>;
  onToggleCategory: (category: FijCategory) => void;
  /**
   * « Global » n'est pas une vraie catégorie : c'est un raccourci qui
   * sélectionne/désélectionne Jeunes + Jeunes Ados en un clic.
   */
  onToggleGlobal: () => void;
  cities: string[];
  activeCity: string | 'all';
  onChangeCity: (city: string | 'all') => void;
  /**
   * 'list' (défaut) : cases à cocher empilées, utilisées dans la sidebar
   * desktop et la feuille mobile étendue.
   * 'chips' : pastilles cliquables sur une seule ligne défilante, pour la
   * barre flottante mobile (façon filtres Google Maps sous la recherche).
   */
  variant?: 'list' | 'chips';
}

export function CategoryFilter({
  activeCategories,
  onToggleCategory,
  onToggleGlobal,
  cities,
  activeCity,
  onChangeCity,
  variant = 'list',
}: CategoryFilterProps) {
  const isGlobalActive = FIJ_CATEGORIES.every((category) => activeCategories.has(category));

  if (variant === 'chips') {
    return (
      <div className={styles.chipRow}>
        <button
          type="button"
          className={`${styles.chip} ${isGlobalActive ? styles.chipActive : ''}`}
          style={isGlobalActive ? { ['--chip-color' as string]: GLOBAL_COLOR } : undefined}
          onClick={onToggleGlobal}
          aria-pressed={isGlobalActive}
        >
          <span className={styles.chipDot} aria-hidden>
            {GLOBAL_DOT}
          </span>
          Global
        </button>
        {FIJ_CATEGORIES.map((category) => {
          const isActive = activeCategories.has(category);
          return (
            <button
              key={category}
              type="button"
              className={`${styles.chip} ${isActive ? styles.chipActive : ''}`}
              style={isActive ? { ['--chip-color' as string]: CATEGORY_COLORS[category] } : undefined}
              onClick={() => onToggleCategory(category)}
              aria-pressed={isActive}
            >
              <span className={styles.chipDot} aria-hidden>
                {CATEGORY_DOTS[category]}
              </span>
              {category}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <>
      <div className={styles.section}>
        <p className={styles.sectionTitle}>Catégories</p>
        <div className={styles.list}>
          <label className={`${styles.option} ${styles.optionGlobal}`}>
            <input
              type="checkbox"
              className={styles.checkbox}
              style={{ ['--dot-color' as string]: GLOBAL_COLOR }}
              checked={isGlobalActive}
              onChange={onToggleGlobal}
            />
            <span aria-hidden>{GLOBAL_DOT}</span>
            <span className={styles.label}>Global</span>
            <span className={styles.hintBadge}>Jeunes + Jeunes Ados</span>
          </label>
          {FIJ_CATEGORIES.map((category) => (
            <label key={category} className={styles.option}>
              <input
                type="checkbox"
                className={styles.checkbox}
                style={{ ['--dot-color' as string]: CATEGORY_COLORS[category] }}
                checked={activeCategories.has(category)}
                onChange={() => onToggleCategory(category)}
              />
              <span aria-hidden>{CATEGORY_DOTS[category]}</span>
              <span className={styles.label}>{category}</span>
            </label>
          ))}
        </div>
      </div>

      {cities.length > 1 && (
        <div className={styles.section}>
          <p className={styles.sectionTitle}>Ville</p>
          <select
            className={styles.citySelect}
            value={activeCity}
            onChange={(event) => onChangeCity(event.target.value)}
          >
            <option value="all">Toutes les villes</option>
            {cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>
      )}
    </>
  );
}
