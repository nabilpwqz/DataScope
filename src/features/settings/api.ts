export async function fetchUsersApi() {
  const res = await fetch('/api/users');
  if (!res.ok) throw new Error('Failed to fetch platform users');
  return res.json();
}

export async function updateUserRoleApi(userId: string, role: 'admin' | 'analyst' | 'viewer') {
  const res = await fetch('/api/users', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, role }),
  });
  if (!res.ok) throw new Error('Failed to update user role');
  return res.json();
}
