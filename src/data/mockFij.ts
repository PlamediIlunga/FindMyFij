import type { Fij } from '@/types/fij';

/**
 * Données de test utilisées automatiquement quand Supabase n'est pas
 * configuré (voir src/services/fij.service.ts). Suffisamment nombreuses et
 * groupées pour que le clustering, la recherche et le calcul de proximité
 * soient réellement visibles.
 */
const MOCK_FIJ_DATA: Omit<Fij, 'status'>[] = [
  // --- Gatineau (secteur Hull) ---
  { id: 'fij-001', name: 'FIJ Espoir', category: 'Jeunes', address: '25 rue Laurier', city: 'Gatineau', province: 'QC', country: 'Canada', postalCode: 'J8X 3W3', latitude: 45.4290, longitude: -75.7173, createdAt: '2025-01-10T00:00:00Z', updatedAt: '2025-01-10T00:00:00Z' },
  { id: 'fij-002', name: 'FIJ Bethléem', category: 'Jeunes', address: '112 boul. Alexandre-Taché', city: 'Gatineau', province: 'QC', country: 'Canada', postalCode: 'J8Y 3S1', latitude: 45.4331, longitude: -75.7267, createdAt: '2025-01-10T00:00:00Z', updatedAt: '2025-01-10T00:00:00Z' },
  { id: 'fij-003', name: 'FIJ Siloé', category: 'Jeunes Ados', address: '58 rue Wright', city: 'Gatineau', province: 'QC', country: 'Canada', postalCode: 'J8X 2G7', latitude: 45.4305, longitude: -75.7145, createdAt: '2025-01-10T00:00:00Z', updatedAt: '2025-01-10T00:00:00Z' },
  { id: 'fij-004', name: 'FIJ Emmanuel', category: 'Jeunes Ados', address: '340 rue Notre-Dame', city: 'Gatineau', province: 'QC', country: 'Canada', postalCode: 'J8X 3T3', latitude: 45.4276, longitude: -75.7201, createdAt: '2025-01-10T00:00:00Z', updatedAt: '2025-01-10T00:00:00Z' },

  // --- Gatineau (secteur Aylmer) ---
  { id: 'fij-005', name: 'FIJ Sion', category: 'Jeunes', address: '470 boul. Wilfrid-Lavigne', city: 'Gatineau', province: 'QC', country: 'Canada', postalCode: 'J9J 2K1', latitude: 45.3892, longitude: -75.8231, createdAt: '2025-01-10T00:00:00Z', updatedAt: '2025-01-10T00:00:00Z' },
  { id: 'fij-006', name: 'FIJ Horeb', category: 'Jeunes Ados', address: '115 rue Principale', city: 'Gatineau', province: 'QC', country: 'Canada', postalCode: 'J9H 6A2', latitude: 45.3944, longitude: -75.8087, createdAt: '2025-01-10T00:00:00Z', updatedAt: '2025-01-10T00:00:00Z' },

  // --- Gatineau (secteur Gatineau / Buckingham) ---
  { id: 'fij-007', name: 'FIJ Nazareth', category: 'Jeunes', address: '870 boul. Maloney Est', city: 'Gatineau', province: 'QC', country: 'Canada', postalCode: 'J8P 1E7', latitude: 45.4614, longitude: -75.6291, createdAt: '2025-01-10T00:00:00Z', updatedAt: '2025-01-10T00:00:00Z' },
  { id: 'fij-008', name: 'FIJ Galilée', category: 'Jeunes', address: '203 rue Notre-Dame', city: 'Gatineau', province: 'QC', country: 'Canada', postalCode: 'J8L 2R8', latitude: 45.5936, longitude: -75.4172, createdAt: '2025-01-10T00:00:00Z', updatedAt: '2025-01-10T00:00:00Z' },

  // --- Ottawa (centre-ville / Rideau, cluster dense) ---
  { id: 'fij-009', name: 'FIJ Jeunesse', category: 'Jeunes', address: '305 Rideau Street', city: 'Ottawa', province: 'ON', country: 'Canada', postalCode: 'K1N 5Y3', latitude: 45.4285, longitude: -75.6900, createdAt: '2025-01-10T00:00:00Z', updatedAt: '2025-01-10T00:00:00Z' },
  { id: 'fij-010', name: 'FIJ Ados', category: 'Jeunes Ados', address: '311 Rideau Street', city: 'Ottawa', province: 'ON', country: 'Canada', postalCode: 'K1N 5Y3', latitude: 45.4288, longitude: -75.6894, createdAt: '2025-01-10T00:00:00Z', updatedAt: '2025-01-10T00:00:00Z' },
  { id: 'fij-011', name: 'FIJ Renaissance', category: 'Jeunes Ados', address: '150 Elgin Street', city: 'Ottawa', province: 'ON', country: 'Canada', postalCode: 'K2P 1L4', latitude: 45.4211, longitude: -75.6903, createdAt: '2025-01-10T00:00:00Z', updatedAt: '2025-01-10T00:00:00Z' },
  { id: 'fij-012', name: 'FIJ Lumière', category: 'Jeunes', address: '99 Bank Street', city: 'Ottawa', province: 'ON', country: 'Canada', postalCode: 'K1P 6B9', latitude: 45.4201, longitude: -75.6957, createdAt: '2025-01-10T00:00:00Z', updatedAt: '2025-01-10T00:00:00Z' },
  { id: 'fij-013', name: 'FIJ Grâce', category: 'Jeunes Ados', address: '223 Sparks Street', city: 'Ottawa', province: 'ON', country: 'Canada', postalCode: 'K1P 5T7', latitude: 45.4218, longitude: -75.6989, createdAt: '2025-01-10T00:00:00Z', updatedAt: '2025-01-10T00:00:00Z' },

  // --- Ottawa (Vanier / Est) ---
  { id: 'fij-014', name: 'FIJ Vanier', category: 'Jeunes', address: '281 rue Marier', city: 'Ottawa', province: 'ON', country: 'Canada', postalCode: 'K1L 6M7', latitude: 45.4372, longitude: -75.6698, createdAt: '2025-01-10T00:00:00Z', updatedAt: '2025-01-10T00:00:00Z' },
  { id: 'fij-015', name: 'FIJ Orléans', category: 'Jeunes', address: '1795 chemin Tenth Line', city: 'Ottawa', province: 'ON', country: 'Canada', postalCode: 'K4A 3N3', latitude: 45.4756, longitude: -75.5261, createdAt: '2025-01-10T00:00:00Z', updatedAt: '2025-01-10T00:00:00Z' },

  // --- Ottawa (Ouest / Kanata) ---
  { id: 'fij-016', name: 'FIJ Kanata', category: 'Jeunes Ados', address: '580 Terry Fox Drive', city: 'Ottawa', province: 'ON', country: 'Canada', postalCode: 'K2L 4C1', latitude: 45.3211, longitude: -75.9081, createdAt: '2025-01-10T00:00:00Z', updatedAt: '2025-01-10T00:00:00Z' },
  { id: 'fij-017', name: 'FIJ Nepean', category: 'Jeunes Ados', address: '3200 Greenbank Road', city: 'Ottawa', province: 'ON', country: 'Canada', postalCode: 'K2J 4M4', latitude: 45.2839, longitude: -75.7591, createdAt: '2025-01-10T00:00:00Z', updatedAt: '2025-01-10T00:00:00Z' },

  // --- Montréal (centre, cluster dense) ---
  { id: 'fij-018', name: 'FIJ Montréal Centre', category: 'Jeunes', address: '1250 rue Sainte-Catherine', city: 'Montréal', province: 'QC', country: 'Canada', postalCode: 'H3G 1P3', latitude: 45.5017, longitude: -73.5698, createdAt: '2025-01-10T00:00:00Z', updatedAt: '2025-01-10T00:00:00Z' },
  { id: 'fij-019', name: 'FIJ Plateau', category: 'Jeunes', address: '3675 avenue du Parc', city: 'Montréal', province: 'QC', country: 'Canada', postalCode: 'H2X 2H9', latitude: 45.5088, longitude: -73.5732, createdAt: '2025-01-10T00:00:00Z', updatedAt: '2025-01-10T00:00:00Z' },
  { id: 'fij-020', name: 'FIJ Rosemont', category: 'Jeunes Ados', address: '2985 rue Beaubien Est', city: 'Montréal', province: 'QC', country: 'Canada', postalCode: 'H1Y 1H3', latitude: 45.5477, longitude: -73.5794, createdAt: '2025-01-10T00:00:00Z', updatedAt: '2025-01-10T00:00:00Z' },
  { id: 'fij-021', name: 'FIJ Hochelaga', category: 'Jeunes Ados', address: '3819 rue Ontario Est', city: 'Montréal', province: 'QC', country: 'Canada', postalCode: 'H1W 1S5', latitude: 45.5461, longitude: -73.5468, createdAt: '2025-01-10T00:00:00Z', updatedAt: '2025-01-10T00:00:00Z' },
  { id: 'fij-022', name: 'FIJ Verdun', category: 'Jeunes', address: '5000 boul. LaSalle', city: 'Montréal', province: 'QC', country: 'Canada', postalCode: 'H4H 1B3', latitude: 45.4550, longitude: -73.5776, createdAt: '2025-01-10T00:00:00Z', updatedAt: '2025-01-10T00:00:00Z' },
  { id: 'fij-023', name: 'FIJ Anjou', category: 'Jeunes Ados', address: '7500 boul. Métropolitain Est', city: 'Montréal', province: 'QC', country: 'Canada', postalCode: 'H1K 1A2', latitude: 45.6067, longitude: -73.5601, createdAt: '2025-01-10T00:00:00Z', updatedAt: '2025-01-10T00:00:00Z' },
  { id: 'fij-024', name: 'FIJ Laval', category: 'Jeunes', address: '1600 boul. Le Corbusier', city: 'Laval', province: 'QC', country: 'Canada', postalCode: 'H7S 2K1', latitude: 45.5601, longitude: -73.7242, createdAt: '2025-01-10T00:00:00Z', updatedAt: '2025-01-10T00:00:00Z' },
  { id: 'fij-025', name: 'FIJ Longueuil', category: 'Jeunes', address: '825 rue Saint-Laurent Ouest', city: 'Longueuil', province: 'QC', country: 'Canada', postalCode: 'J4K 1C9', latitude: 45.5312, longitude: -73.5182, createdAt: '2025-01-10T00:00:00Z', updatedAt: '2025-01-10T00:00:00Z' },
];

export const MOCK_FIJ: Fij[] = MOCK_FIJ_DATA.map((fij) => ({ ...fij, status: 'open' }));
