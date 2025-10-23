# Deployment Guide

This document explains how environment variables flow from your local `.env` file to production deployment.

## Environment Variable Flow

### 1. Local Development

**File**: `.env` (in project root)
```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key
OPENAI_API_KEY=sk-your-openai-key
```

**How it works**:
- Wrangler automatically loads variables from `.env` file
- No need to modify `wrangler.toml` for local development
- Variables are available in your worker code via `env.SUPABASE_URL`, etc.

### 2. Production Deployment

**GitHub Actions** (`.github/workflows/deploy.yml`):
```yaml
- name: Deploy Worker
  run: npx wrangler deploy --prefix worker --env production
  env:
    SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
    SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
    OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
```

**How it works**:
- GitHub Actions reads from repository secrets
- Variables are passed to Wrangler during deployment
- Wrangler sets them as environment variables in the worker

## Required GitHub Secrets

Add these secrets to your GitHub repository (Settings → Secrets and variables → Actions):

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `SUPABASE_URL` | Your Supabase project URL | `https://abc123.supabase.co` |
| `SUPABASE_ANON_KEY` | Your Supabase anon key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `OPENAI_API_KEY` | Your OpenAI API key | `sk-...` |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token | `your-token` |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID | `your-account-id` |
| `WORKER_URL` | Your deployed worker URL | `https://mcp-server.your-subdomain.workers.dev` |

## Development vs Production

### Local Development
```bash
# Start worker with local .env
make dev-worker
# or
cd worker && npm run dev
```

### Production Deployment
```bash
# Deploy via GitHub Actions (automatic on push to main)
git push origin main

# Or deploy manually
cd worker
wrangler deploy --env production
```

## Troubleshooting

### "Environment variable not found" error
- **Local**: Check your `.env` file exists and has the right variable names
- **Production**: Verify GitHub secrets are set correctly

### "Invalid API key" error
- **Local**: Check your `.env` values match your Supabase project
- **Production**: Verify GitHub secrets match your production values

### Worker not connecting to Supabase
- Check that `SUPABASE_URL` points to your cloud project (not localhost)
- Verify `SUPABASE_ANON_KEY` is the correct anon key from your project

## Security Notes

- Never commit `.env` files to git
- Use different API keys for development vs production
- Rotate production keys regularly
- Use least-privilege access for API keys

## Quick Setup Checklist

1. ✅ Create `.env` file with your values
2. ✅ Test locally: `make dev-worker`
3. ✅ Add GitHub secrets
4. ✅ Push to main branch
5. ✅ Verify deployment in Cloudflare dashboard
