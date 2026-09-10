'use server';

import { revalidatePath } from 'next/cache';
import { createFij, createManyFij, deleteFij, updateFij } from '@/services/fij.service';
import type { FijInput } from '@/types/fij';

export async function createFijAction(input: FijInput): Promise<void> {
  await createFij(input);
  revalidatePath('/admin/fij');
  revalidatePath('/');
}

export async function createManyFijAction(inputs: FijInput[]): Promise<void> {
  await createManyFij(inputs);
  revalidatePath('/admin/fij');
  revalidatePath('/');
}

export async function updateFijAction(id: string, input: FijInput): Promise<void> {
  await updateFij(id, input);
  revalidatePath('/admin/fij');
  revalidatePath(`/admin/fij/${id}/edit`);
  revalidatePath('/');
}

export async function deleteFijAction(id: string): Promise<void> {
  await deleteFij(id);
  revalidatePath('/admin/fij');
  revalidatePath('/');
}
