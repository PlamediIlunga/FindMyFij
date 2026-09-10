import { getAllFij } from '@/services/fij.service';
import { MapExplorer } from '@/components/MapExplorer';

export default async function HomePage() {
  const fijList = await getAllFij();

  return <MapExplorer initialFij={fijList} />;
}
