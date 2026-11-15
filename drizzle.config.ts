// Drizzle configuration for migrations and schema introspection
export default {
  schema: './src/lib/db/schema.ts',
  out: './drizzle/migrations',
  dialect: 'postgresql' as const,
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_Kb9AgZ4jIBOd@ep-silent-smoke-ao9xf02q-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require',
  },
  verbose: true,
  strict: true,
};
