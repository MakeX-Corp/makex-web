# makex-landing

## Local Development Setup

### Prerequisites

1. **Docker Desktop** - Required for running Supabase locally
   - Download and install from: https://docs.docker.com/desktop
   - Make sure Docker Desktop is running before proceeding

2. **Supabase CLI** - Install if not already available
   ```bash
   # macOS
   brew install supabase/tap/supabase
   
   # Other platforms: https://supabase.com/docs/guides/cli/getting-started
   ```

### 🚀 Quick Start - Local Supabase

#### 1. Start Local Supabase Instance
```bash
# Make sure Docker Desktop is running first!
supabase start
```

This will:
- Pull necessary Docker images (first time takes a few minutes)
- Start all Supabase services locally
- Display connection details and access URLs

#### 2. Pull Production Schema
Sync your local database with the production schema:

```bash
# Pull the current production schema
supabase db pull

# Apply the schema to your local database
supabase db reset
```

#### 3. Update Environment Variables
Update your `.env.local` file to point to local Supabase:

**Replace these 3 lines:**
```bash
# Change from production URLs to local:
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
```

#### 4. Access Local Services

Once running, you'll have access to:

- **🎨 Supabase Studio (Database UI)**: http://127.0.0.1:54323
- **🔌 API Endpoint**: http://127.0.0.1:54321
- **📊 GraphQL**: http://127.0.0.1:54321/graphql/v1
- **💾 S3 Storage**: http://127.0.0.1:54321/storage/v1/s3
- **📧 Email Testing (Inbucket)**: http://127.0.0.1:54324
- **🗄️ Direct Database**: `postgresql://postgres:postgres@127.0.0.1:54322/postgres`

### 🛠️ Useful Commands

```bash
# Check service status
supabase status

# Stop all services
supabase stop

# Reset database to initial state
supabase db reset

# View service logs
supabase logs

# Check for schema differences
supabase db diff --schema public

# Pull latest schema changes from production
supabase db pull && supabase db reset
```

### 🔄 Keeping Local Updated

When production schema changes:
```bash
supabase db pull    # Pull new schema changes
supabase db reset   # Apply them locally
```

### 🚨 Troubleshooting

**Docker not running:**
```
Error: Cannot connect to the Docker daemon
```
→ Start Docker Desktop and wait for it to fully initialize

**Port conflicts:**
```
Error: Port 54321 already in use
```
→ Stop other services or change ports in `supabase/config.toml`

**Schema out of sync:**
```bash
# Reset everything and pull fresh schema
supabase stop
supabase start
supabase db pull
supabase db reset
```

---

Your local development environment now perfectly mirrors production! 🎉
