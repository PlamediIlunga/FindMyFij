'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { getProvinceName } from '@/data/canadaLocations';
import { CATEGORY_COLORS, FIJ_CATEGORIES, type Fij, type FijGroupBy } from '@/types/fij';
import { FijDeleteButton } from './FijDeleteButton';
import { normalizeText } from '@/lib/normalizeText';
import styles from './FijAdminDashboard.module.scss';

interface FijAdminDashboardProps {
  fijList: Fij[];
}

const GROUP_LABELS: Record<FijGroupBy, string> = {
  category: 'Catégorie',
  city: 'Ville',
  province: 'Province',
  country: 'Pays',
};

function getGroupKey(fij: Fij, groupBy: FijGroupBy): string {
  switch (groupBy) {
    case 'category':
      return fij.category;
    case 'city':
      return fij.city;
    case 'province':
      return fij.province;
    case 'country':
      return fij.country;
  }
}

function formatGroupLabel(key: string, groupBy: FijGroupBy): string {
  if (groupBy === 'province') {
    return getProvinceName(key);
  }
  return key;
}

export function FijAdminDashboard({ fijList }: FijAdminDashboardProps) {
  const [groupBy, setGroupBy] = useState<FijGroupBy>('category');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterCity, setFilterCity] = useState<string>('all');
  const [filterProvince, setFilterProvince] = useState<string>('all');
  const [filterCountry, setFilterCountry] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const uniqueCities = useMemo(
    () => Array.from(new Set(fijList.map((f) => f.city))).sort((a, b) => a.localeCompare(b, 'fr')),
    [fijList]
  );
  const uniqueProvinces = useMemo(
    () =>
      Array.from(new Set(fijList.map((f) => f.province))).sort((a, b) =>
        a.localeCompare(b, 'fr')
      ),
    [fijList]
  );
  const uniqueCountries = useMemo(
    () =>
      Array.from(new Set(fijList.map((f) => f.country))).sort((a, b) => a.localeCompare(b, 'fr')),
    [fijList]
  );

  const categoryCounts = useMemo(
    () =>
      FIJ_CATEGORIES.map((category) => ({
        category,
        count: fijList.filter((f) => f.category === category).length,
      })),
    [fijList]
  );

  const filteredList = useMemo(
    () =>
      fijList.filter((fij) => {
        const searchable = normalizeText(`${fij.name} ${fij.address} ${fij.city} ${fij.postalCode}`);
        if (searchQuery && !searchable.includes(normalizeText(searchQuery))) return false;
        if (filterCategory !== 'all' && fij.category !== filterCategory) return false;
        if (filterCity !== 'all' && fij.city !== filterCity) return false;
        if (filterProvince !== 'all' && fij.province !== filterProvince) return false;
        if (filterCountry !== 'all' && fij.country !== filterCountry) return false;
        return true;
      }),
    [fijList, filterCategory, filterCity, filterProvince, filterCountry, searchQuery]
  );

  const grouped = useMemo(() => {
    const map = new Map<string, Fij[]>();
    for (const fij of filteredList) {
      const key = getGroupKey(fij, groupBy);
      const existing = map.get(key) ?? [];
      existing.push(fij);
      map.set(key, existing);
    }

    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b, 'fr'))
      .map(([key, items]) => ({
        key,
        label: formatGroupLabel(key, groupBy),
        items: items.sort((a, b) => a.name.localeCompare(b.name, 'fr')),
      }));
  }, [filteredList, groupBy]);

  const secondaryBreakdown = useMemo(() => {
    const otherDimensions: FijGroupBy[] = ['category', 'city', 'province', 'country'].filter(
      (d) => d !== groupBy
    ) as FijGroupBy[];

    return grouped.map((group) => {
      const breakdowns = otherDimensions.map((dimension) => {
        const counts = new Map<string, number>();
        for (const fij of group.items) {
          const key = getGroupKey(fij, dimension);
          counts.set(key, (counts.get(key) ?? 0) + 1);
        }
        return {
          dimension,
          counts: Array.from(counts.entries())
            .sort(([a], [b]) => a.localeCompare(b, 'fr'))
            .map(([key, count]) => ({
              key,
              label: formatGroupLabel(key, dimension),
              count,
            })),
        };
      });
      return { ...group, breakdowns };
    });
  }, [grouped, groupBy]);

  if (fijList.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p className={styles.emptyTitle}>Aucune FIJ enregistrée pour le moment.</p>
        <p className={styles.emptyText}>
          Ajoutez la première FIJ pour qu&apos;elle apparaisse ici et sur la carte publique.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      <div className={styles.statStrip}>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{fijList.length}</span>
          <span className={styles.statLabel}>FIJ au total</span>
        </div>
        {categoryCounts.map(({ category, count }) => (
          <div key={category} className={styles.statCard}>
            <span className={styles.statValue}>
              <span className={styles.statDot} style={{ background: CATEGORY_COLORS[category] }} />
              {count}
            </span>
            <span className={styles.statLabel}>{category}</span>
          </div>
        ))}
      </div>

      <div className={styles.controls}>
        <div className={styles.searchGroup}>
          <label className={styles.controlLabel} htmlFor="adminSearch">Rechercher une FIJ</label>
          <input id="adminSearch" className={styles.searchInput} value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Nom, adresse, ville ou code postal" />
        </div>
        <div className={styles.controlGroup}>
          <label className={styles.controlLabel} htmlFor="groupBy">
            Grouper par
          </label>
          <select
            id="groupBy"
            className={styles.select}
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value as FijGroupBy)}
          >
            {(Object.keys(GROUP_LABELS) as FijGroupBy[]).map((key) => (
              <option key={key} value={key}>
                {GROUP_LABELS[key]}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.filters}>
          <div className={styles.controlGroup}>
            <label className={styles.controlLabel} htmlFor="filterCategory">
              Catégorie
            </label>
            <select
              id="filterCategory"
              className={styles.select}
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="all">Toutes ({fijList.length})</option>
              {FIJ_CATEGORIES.map((cat) => {
                const count = fijList.filter((f) => f.category === cat).length;
                return (
                  <option key={cat} value={cat}>
                    {cat} ({count})
                  </option>
                );
              })}
            </select>
          </div>

          <div className={styles.controlGroup}>
            <label className={styles.controlLabel} htmlFor="filterProvince">
              Province
            </label>
            <select
              id="filterProvince"
              className={styles.select}
              value={filterProvince}
              onChange={(e) => setFilterProvince(e.target.value)}
            >
              <option value="all">Toutes ({fijList.length})</option>
              {uniqueProvinces.map((prov) => {
                const count = fijList.filter((f) => f.province === prov).length;
                return (
                  <option key={prov} value={prov}>
                    {getProvinceName(prov)} ({count})
                  </option>
                );
              })}
            </select>
          </div>

          <div className={styles.controlGroup}>
            <label className={styles.controlLabel} htmlFor="filterCity">
              Ville
            </label>
            <select
              id="filterCity"
              className={styles.select}
              value={filterCity}
              onChange={(e) => setFilterCity(e.target.value)}
            >
              <option value="all">Toutes ({fijList.length})</option>
              {uniqueCities.map((city) => {
                const count = fijList.filter((f) => f.city === city).length;
                return (
                  <option key={city} value={city}>
                    {city} ({count})
                  </option>
                );
              })}
            </select>
          </div>

          <div className={styles.controlGroup}>
            <label className={styles.controlLabel} htmlFor="filterCountry">
              Pays
            </label>
            <select
              id="filterCountry"
              className={styles.select}
              value={filterCountry}
              onChange={(e) => setFilterCountry(e.target.value)}
            >
              <option value="all">Tous ({fijList.length})</option>
              {uniqueCountries.map((country) => {
                const count = fijList.filter((f) => f.country === country).length;
                return (
                  <option key={country} value={country}>
                    {country} ({count})
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </div>

      <p className={styles.summary}>
        {filteredList.length} FIJ affichée{filteredList.length > 1 ? 's' : ''} sur {fijList.length}{' '}
        — regroupées par {GROUP_LABELS[groupBy].toLowerCase()}
      </p>

      <div className={styles.groups}>
        {secondaryBreakdown.map((group) => (
          <section key={group.key} className={styles.group}>
            <header className={styles.groupHeader}>
              <h3 className={styles.groupTitle}>
                {group.label}
                <span className={styles.groupCount}>{group.items.length}</span>
              </h3>
              <div className={styles.breakdowns}>
                {group.breakdowns.map((breakdown) => (
                  <div key={breakdown.dimension} className={styles.breakdown}>
                    <span className={styles.breakdownLabel}>
                      {GROUP_LABELS[breakdown.dimension]} :
                    </span>
                    {breakdown.counts.map(({ key, label, count }) => (
                      <span key={key} className={styles.breakdownChip}>
                        {label} ({count})
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            </header>

            <div className={styles.tableScroll}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Catégorie</th>
                  <th>Ville</th>
                  <th>Province</th>
                  <th>Pays</th>
                  <th>Statut</th>
                  <th aria-label="Actions"></th>
                </tr>
              </thead>
              <tbody>
                {group.items.map((fij) => (
                  <tr key={fij.id}>
                    <td>{fij.name}</td>
                    <td>
                      <span
                        className={styles.categoryTag}
                        style={{ background: CATEGORY_COLORS[fij.category] }}
                      >
                        {fij.category}
                      </span>
                    </td>
                    <td>{fij.city}</td>
                    <td>{getProvinceName(fij.province)}</td>
                    <td>{fij.country}</td>
                    <td>{fij.status === 'open' ? 'Ouvert' : <>Fermé{fij.statusNote && <><br /><small>{fij.statusNote}</small></>}</>}</td>
                    <td className={styles.actionsCell}>
                      <Link
                        href={`/admin/fij/${fij.id}/edit`}
                        className={styles.editButton}
                        aria-label={`Modifier ${fij.name}`}
                        title="Modifier"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
                          <path
                            d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5Z"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </Link>
                      <FijDeleteButton id={fij.id} name={fij.name} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}