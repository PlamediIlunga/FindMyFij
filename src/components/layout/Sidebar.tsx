import type { ReactNode } from 'react';
import styles from './Sidebar.module.scss';

interface SidebarProps {
  children: ReactNode;
}

/**
 * Conteneur de layout pour le panneau latéral desktop/tablette.
 * Le contenu (recherche, filtres, liste) est injecté par le composant
 * parent afin que Sidebar reste un simple bloc de mise en page réutilisable.
 */
export function Sidebar({ children }: SidebarProps) {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.content}>{children}</div>
    </aside>
  );
}
