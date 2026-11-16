export async function queryAiSearchAssistant(prompt: string, datasetId: string) {
  const res = await fetch('/api/ai/search-assistant', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, datasetId }),
  });
  if (!res.ok) throw new Error('AI Assistant request failed');
  return res.json();
}
