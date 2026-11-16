import { SearchQueryRequest, SearchQueryResponse } from '@/types';

export async function searchRecordsApi(req: SearchQueryRequest): Promise<SearchQueryResponse> {
  const res = await fetch(`/api/datasets/${req.datasetId}/records`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error('Search request failed');
  return res.json();
}

