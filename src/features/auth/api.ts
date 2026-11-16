export async function fetchMe() {
  const res = await fetch('/api/auth/me');
  if (!res.ok) throw new Error('Failed to fetch authenticated profile');
  return res.json();
}
