export async function fetchDatasetMetadata(id: string) {
  const res = await fetch(`/api/datasets/${id}`);
  if (!res.ok) throw new Error(`Failed to load dataset ${id}`);
  return res.json();
}
