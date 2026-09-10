# Carte des FIJ

Application web indépendante permettant de consulter les Familles d'Impact Jeune (FIJ) sur une carte interactive, de rechercher une FIJ ou une adresse, et de trouver les FIJ les plus proches d'une position.

## Stack technique

- **Next.js 14** (App Router) + **TypeScript strict**
- **React-Leaflet** + **OpenStreetMap** (carte, gratuit/open source) avec clustering (`react-leaflet-cluster`)
- **Nominatim** pour le géocodage d'adresses (gratuit)
- **Supabase (PostgreSQL)** comme base de données, via une couche de service isolée
- **SCSS Modules** (pas de Tailwind, pas de grosse librairie UI)
- Déployable sur **Vercel** sans backend séparé

## Démarrage local

```bash
npm install
npm run dev
```

L'application est utilisable **immédiatement**, sans aucune configuration : si les variables Supabase ne sont pas définies, elle bascule automatiquement sur les données de test (`src/data/mockFij.ts`, 25 FIJ autour de Gatineau, Ottawa et Montréal).

## Configuration Supabase (optionnelle mais recommandée)

1. Créez un projet sur [supabase.com](https://supabase.com).
2. Exécutez `supabase/schema.sql` dans l'éditeur SQL du projet.
3. Copiez `.env.example` vers `.env.local` et renseignez :

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

4. Redémarrez `npm run dev`. Les FIJ sont maintenant lues/écrites depuis Supabase.

Pour protéger `/admin/fij`, activez Supabase Auth (email/mot de passe suffit) et créez au moins un utilisateur : la policy RLS de `schema.sql` réserve déjà l'écriture aux utilisateurs authentifiés.

## Architecture

```
src/
├── app/
│   ├── page.tsx                 → page principale (Server Component)
│   ├── admin/fij/                → gestion simple des FIJ (liste, ajout)
│   └── api/geocoding/route.ts    → route API isolant l'appel à Nominatim
├── components/
│   ├── MapExplorer.tsx           → orchestrateur client (état global de l'UI)
│   ├── map/                      → Leaflet, clustering, icônes, popup
│   ├── search/SearchBar.tsx      → recherche FIJ + géocodage d'adresse
│   ├── filters/CategoryFilter.tsx
│   ├── location/                 → géolocalisation navigateur
│   ├── fij/                      → carte, liste, fiche détail, formulaire
│   └── layout/                   → Header, Sidebar (desktop), MobileBottomSheet
├── lib/
│   ├── geo/haversine.ts          → calcul de distance (formule de Haversine)
│   ├── geo/distance.ts           → tri + formatage des distances
│   ├── geocoding/nominatim.ts    → fournisseur de géocodage (remplaçable)
│   ├── maps/directions.ts        → lien "itinéraire" vers Google Maps
│   └── supabase/                 → clients Supabase (browser + server)
├── services/fij.service.ts       → SEUL point d'accès aux données FIJ
├── types/fij.ts                  → types centralisés
└── data/mockFij.ts               → données de test
```

La séparation clé : **aucun composant n'appelle Supabase directement**. Tout passe par `src/services/fij.service.ts`, qui peut être réécrit pour interroger une autre source de données sans toucher à l'UI.

## Fonctionnalités

- Carte avec clustering, marqueurs colorés par catégorie (🟠 Global, 🟢 Jeunes, ⚪ Jeunes Ados)
- Recherche par nom de FIJ, adresse, ville ou code postal
- Recherche d'adresse avec géocodage, utilisable comme point de référence
- Géolocalisation ("📍 Utiliser ma position") avec calcul des FIJ les plus proches (Haversine)
- Panneau latéral (desktop/tablette) et bottom sheet (mobile), synchronisés avec la carte
- Filtres par catégorie et par ville
- Fiche FIJ avec bouton "Voir l'itinéraire" (Google Maps)
- Interface d'ajout/suppression de FIJ dans `/admin/fij`, avec géocodage à la demande
- Mode sombre (bascule dans l'en-tête)
- Responsive : desktop, tablette, mobile

## Notes

- Le géocodage n'est jamais lancé automatiquement en masse : uniquement à la demande (recherche d'adresse ou bouton "Géocoder" dans le formulaire).
- Les catégories, couleurs et données de test sont centralisées dans `src/types/fij.ts` et `src/data/mockFij.ts` si vous voulez les adapter.
