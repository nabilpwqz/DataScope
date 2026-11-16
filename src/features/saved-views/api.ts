import { SavedView } from '@/types';

export async function fetchSavedViewsApi(datasetId: string): Promise<SavedView[]> {
  const res = await fetch(`/api/saved-views?datasetId=${encodeURIComponent(datasetId)}`);
  if (!res.ok) throw new Error('Failed to fetch saved views');
  return res.json();
}

export async function createSavedViewApi(payload: Partial<SavedView>): Promise<SavedView> {
  const res = await fetch('/api/saved-views', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to create saved view');
  return res.json();
}

export async function deleteSavedViewApi(id: string): Promise<{ success: boolean }> {
  const res = await fetch(`/api/saved-views/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete saved view');
  return res.json();
}
