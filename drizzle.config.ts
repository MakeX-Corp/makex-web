// drizzle.config.js
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/schema.ts',
  out: './src/drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgresql://postgres:QZuZT3A6UwRBNv4K@db.aljrjyhwwmjqfkgnbeiz.supabase.co:5432/postgres'
  },
  schemaFilter: ['public', 'auth'],
  verbose: true,
  strict: true,
});
