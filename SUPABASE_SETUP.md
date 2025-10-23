# Supabase Cloud Setup Guide

This guide will help you set up a Supabase project in the cloud and configure your local development environment.

## Prerequisites

- A Supabase account (sign up at [supabase.com](https://supabase.com))
- Supabase CLI installed (`npm install -g supabase`)

## Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in to your account
2. Click "New Project"
3. Choose your organization (or create one if needed)
4. Fill in the project details:
   - **Name**: `mcp-test` (or your preferred name)
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose the region closest to you
5. Click "Create new project"
6. Wait for the project to be created (this may take a few minutes)

## Step 2: Get Your Project Credentials

Once your project is ready:

1. Go to your project dashboard
2. Navigate to **Settings** → **API**
3. Copy the following values:
   - **Project URL** (looks like: `https://your-project-id.supabase.co`)
   - **anon public** key (starts with `eyJ...`)
   - **service_role** key (starts with `eyJ...`)

## Step 3: Configure Your Environment

1. Copy the example environment file:
   ```bash
   cp env.example .env
   ```

2. Update your `.env` file with your Supabase credentials:
   ```env
   # Supabase Configuration
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_ANON_KEY=your-anon-key-here
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   
   # Web App Configuration
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

## Step 4: Set Up Database Schema

1. Link your local project to your Supabase project:
   ```bash
   supabase link --project-ref your-project-id
   ```

2. Push your database schema:
   ```bash
   make db-migrate
   ```

3. (Optional) Seed your database with sample data:
   ```bash
   make db-seed
   ```

## Step 5: Configure Authentication (Optional)

If you plan to use authentication:

1. Go to **Authentication** → **Settings** in your Supabase dashboard
2. Configure your authentication providers
3. Set up your site URL (e.g., `http://localhost:3000` for development)
4. Configure email templates if needed

## Step 6: Set Up Storage (Optional)

If you plan to use file storage:

1. Go to **Storage** in your Supabase dashboard
2. Create storage buckets as needed
3. Configure bucket policies

## Step 7: Test Your Setup

1. Start your development environment:
   ```bash
   make dev
   ```

2. Check that everything is working:
   ```bash
   make health
   ```

## Environment Variables Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `SUPABASE_URL` | Your Supabase project URL | `https://abc123.supabase.co` |
| `SUPABASE_ANON_KEY` | Your anon/public key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Your service role key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |

### Frontend Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_SUPABASE_URL` | Same as SUPABASE_URL | `https://abc123.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Same as SUPABASE_ANON_KEY | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |

## Troubleshooting

### Common Issues

1. **"Invalid API key" error**
   - Double-check that you copied the keys correctly
   - Ensure you're using the right key (anon vs service_role)

2. **"Project not found" error**
   - Verify your project URL is correct
   - Make sure your project is fully initialized

3. **Database connection issues**
   - Check that your database password is correct
   - Ensure your project is not paused

4. **CORS errors in development**
   - Add your local development URL to the allowed origins in Supabase dashboard
   - Go to **Settings** → **API** → **CORS**

### Getting Help

- Check the [Supabase Documentation](https://supabase.com/docs)
- Visit the [Supabase Community](https://github.com/supabase/supabase/discussions)
- Use `make supabase-status` to check your local Supabase status

## Security Notes

- Never commit your `.env` file to version control
- Keep your service role key secure - it has admin access to your database
- Use environment-specific configurations for development, staging, and production
- Regularly rotate your API keys in production

## Next Steps

Once your Supabase setup is complete:

1. Start developing with `make dev`
2. Deploy your worker with `make deploy-worker`
3. Deploy your web app with `make deploy-web`

For more information, see the main [README.md](README.md) file.
