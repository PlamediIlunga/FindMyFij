'use client';

import { useRouter } from 'next/navigation';
import { FIJForm } from '@/components/fij/FIJForm';
import { updateFijAction } from '../../actions';
import type { Fij, FijInput } from '@/types/fij';

interface EditFijFormProps {
  fij: Fij;
}

export function EditFijForm({ fij }: EditFijFormProps) {
  const router = useRouter();

  async function handleSubmit(input: FijInput) {
    await updateFijAction(fij.id, input);
    router.push('/admin/fij');
    router.refresh();
  }

  return <FIJForm initialData={fij} submitLabel="Enregistrer les modifications" onSubmit={handleSubmit} />;
}
