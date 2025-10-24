# MCP Test - AI + Database Integration

A complete stack for building AI-powered applications with Supabase, Cloudflare Workers, and React.

## 🏗️ Architecture

- **Database**: Supabase (PostgreSQL + pgvector)
- **MCP Server**: Cloudflare Workers (TypeScript)
- **Frontend**: React + Vite + TypeScript
- **Auth**: Supabase Auth with GitHub OAuth
- **Deployment**: GitHub Actions → Cloudflare

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- Supabase CLI (`npm install -g supabase`)
- Cloudflare account (for production)
- Supabase account (for cloud database)

### 1. Setup

```bash
# Clone and install dependencies
git clone <your-repo>
cd mcp-test
make setup

# Copy environment variables
cp env.example .env
# Edit .env with your API keys (see SUPABASE_SETUP.md)
```

### 2. Supabase Cloud Setup

**Important**: This project now uses Supabase Cloud instead of local Docker. Follow the detailed setup guide:

👉 **[See SUPABASE_SETUP.md for complete setup instructions](SUPABASE_SETUP.md)**

Quick steps:
1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Get your project URL and API keys
3. Update your `.env` file
4. Link your project: `make supabase-link`
5. Push your schema: `make supabase-push`

### 3. Local Development

```bash
# Start all development services
make dev

# Or start individually:
make dev-worker  # Cloudflare Worker
make dev-web     # React web app
```

### 4. Access Your Apps

- **Web App**: http://localhost:3000
- **Worker**: http://localhost:8787
- **Supabase Dashboard**: Your cloud project dashboard

## 📁 Project Structure

```
mcp-test/
├── supabase/           # Supabase configuration
│   ├── config.toml
│   ├── migrations/
│   └── seed.sql
├── worker/             # Cloudflare Worker (MCP Server)
│   ├── src/
│   ├── package.json
│   └── wrangler.toml
├── web/                # React frontend
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
├── .github/workflows/  # CI/CD
├── SUPABASE_SETUP.md   # Supabase cloud setup guide
└── Makefile           # Development commands
```

## 🔧 Configuration

### Environment Variables

Copy `env.example` to `.env` and configure:

```bash
# Supabase (cloud)
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenAI
OPENAI_API_KEY=sk-your-openai-key

# OpenAI Models (optional)
OPENAI_EMBEDDING_MODEL=text-embedding-ada-002
OPENAI_CHAT_MODEL=gpt-4o-mini

# Cloudflare (production)
CLOUDFLARE_API_TOKEN=your-token
CLOUDFLARE_ACCOUNT_ID=your-account-id

# CORS Configuration (production)
ALLOWED_ORIGINS=https://your-project.pages.dev,https://mcptest.bldhosting.com
```

### Supabase Setup

**Cloud Setup** (Recommended):
- Follow [SUPABASE_SETUP.md](SUPABASE_SETUP.md) for detailed instructions
- Create a Supabase project at [supabase.com](https://supabase.com)
- Link your project: `make supabase-link`
- Push schema: `make supabase-push`

## 🚀 Deployment

### GitHub Actions Setup

1. **Add secrets to your GitHub repository** (Settings → Secrets and variables → Actions):
   - `CLOUDFLARE_API_TOKEN` - Your Cloudflare API token
   - `CLOUDFLARE_ACCOUNT_ID` - Your Cloudflare account ID
   - `SUPABASE_URL` - Your Supabase project URL
   - `SUPABASE_ANON_KEY` - Your Supabase anon key
   - `OPENAI_API_KEY` - Your OpenAI API key
   - `WORKER_URL` - Your deployed worker URL (e.g., `https://mcp-server-production.your-subdomain.workers.dev`)
   - `ALLOWED_ORIGINS` - Comma-separated list of allowed domains (e.g., `https://mcp-web.pages.dev,https://mcp.bldhosting.com`)
   - `OPENAI_EMBEDDING_MODEL` (optional) - Default: `text-embedding-3-small`
   - `OPENAI_CHAT_MODEL` (optional) - Default: `gpt-5-nano`

2. **Push to main branch** to trigger deployment:
   ```bash
   git push origin main
   ```

3. **Monitor deployment** in the Actions tab of your GitHub repository

### Manual Deployment

```bash
# Deploy worker
cd worker
npm run deploy

# Deploy web app
cd web
npm run build
# Upload dist/ to Cloudflare Pages
```

### Automatic Deployment

The project uses GitHub Actions for automatic deployment:

- **Worker**: Deploys to Cloudflare Workers
- **Web App**: Deploys to Cloudflare Pages
- **Quality Checks**: TypeScript + ESLint + Build validation
- **Environment**: Worker URL from GitHub secrets

## 🧪 Testing

```bash
# Test the worker
curl http://localhost:8787/health

# Test embedding
curl -X POST http://localhost:8787/embed \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello world"}'

# Test search
curl -X POST http://localhost:8787/search \
  -H "Content-Type: application/json" \
  -d '{"query": "supabase", "limit": 5}'
```

## 📚 API Endpoints

### Worker Endpoints

- `GET /health` - Health check
- `POST /embed` - Generate embeddings
- `POST /search` - Search documents
- `POST /chat` - Chat with AI

### Database Schema

- `documents` - Store documents with embeddings
- `chat_sessions` - Chat conversation sessions
- `chat_messages` - Individual chat messages

## 🔐 Authentication & Security

The app uses Supabase Auth with GitHub OAuth:

1. Users sign in with GitHub
2. JWT tokens are used for API authentication
3. Row Level Security (RLS) protects user data

### Security Features

- **JWT Authentication**: All protected endpoints require valid tokens
- **Rate Limiting**: 10 requests per minute per IP
- **Input Validation**: XSS protection and length limits
- **CORS Protection**: Restricted to allowed origins
- **User Isolation**: Users can only access their own data

## 🛠️ Development

### Adding New Features

1. **Database**: Add migrations to `supabase/migrations/`
2. **Worker**: Add endpoints to `worker/src/index.ts`
3. **Frontend**: Add components to `web/src/`

### Development Commands

```bash
# Setup everything
npm run setup

# Development
npm run dev              # All services
npm run dev:worker       # Worker only
npm run dev:web          # Web app only

# Quality checks
npm run type-check       # TypeScript checking
npm run lint             # ESLint checking
npm run build            # Build everything
npm run check            # All quality checks
```

### Local Testing

```bash
# Test worker
make dev-worker

# Test frontend
make dev-web

# Check all services
make health
```

### Code Quality

```bash
# Type check everything
npm run type-check

# Lint everything
npm run lint

# Build everything
npm run build

# Check everything (type + lint + build)
npm run check
```

## 📖 Documentation

- [SUPABASE_SETUP.md](SUPABASE_SETUP.md) - Supabase cloud setup guide
- [OPENAI_SETUP.md](OPENAI_SETUP.md) - OpenAI API setup with cost-effective options
- [MODEL_CONFIGURATION.md](MODEL_CONFIGURATION.md) - Configurable OpenAI models with real pricing
- [RAG_ARCHITECTURE.md](RAG_ARCHITECTURE.md) - RAG & Context Engineering architecture
- [SECURITY_ANALYSIS.md](SECURITY_ANALYSIS.md) - Security analysis and recommendations
- [DEPLOYMENT.md](DEPLOYMENT.md) - Environment variables and deployment guide
- [CLOUDFLARE_DEPLOYMENT.md](CLOUDFLARE_DEPLOYMENT.md) - Cloudflare deployment guide
- [WEB_WORKER_CONNECTION.md](WEB_WORKER_CONNECTION.md) - How web app connects to worker
- [DOMAIN_OPTIONS.md](DOMAIN_OPTIONS.md) - Domain configuration options
- [Supabase Docs](https://supabase.com/docs)
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- [OpenAI API](https://platform.openai.com/docs)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run quality checks: `npm run check`
5. Test locally: `npm run dev`
6. Submit a pull request

### Development Workflow

```bash
# 1. Setup
git clone <your-fork>
cd mcp-test
npm run setup

# 2. Development
npm run dev

# 3. Quality checks
npm run check

# 4. Test
npm run dev:worker
npm run dev:web

# 5. Commit
git add .
git commit -m "feat: your changes"
git push origin your-branch
```

## 📄 License

MIT License - see LICENSE file for details.