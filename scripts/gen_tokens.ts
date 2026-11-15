import { signToken } from '../src/lib/auth/jwt';

async function generateTokens() {
  const adminToken = await signToken({
    id: 'usr-admin-01',
    name: 'Elena Rostova',
    email: 'admin@datascope.io',
    role: 'admin',
    department: 'Enterprise Architecture',
  });

  const analystToken = await signToken({
    id: 'usr-analyst-01',
    name: 'Marcus Vance',
    email: 'analyst@datascope.io',
    role: 'analyst',
    department: 'Strategic Intelligence',
  });

  const viewerToken = await signToken({
    id: 'usr-viewer-01',
    name: 'Sarah Lin',
    email: 'viewer@datascope.io',
    role: 'viewer',
    department: 'Product Operations',
  });

  console.log('ADMIN_TOKEN:', adminToken);
  console.log('ANALYST_TOKEN:', analystToken);
  console.log('VIEWER_TOKEN:', viewerToken);
}

generateTokens();

