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

# Cloudflare (production)
CLOUDFLARE_API_TOKEN=your-token
CLOUDFLARE_ACCOUNT_ID=your-account-id
```

### Supabase Setup

**Cloud Setup** (Recommended):
- Follow [SUPABASE_SETUP.md](SUPABASE_SETUP.md) for detailed instructions
- Create a Supabase project at [supabase.com](https://supabase.com)
- Link your project: `make supabase-link`
- Push schema: `make supabase-push`

## 🚀 Deployment

### GitHub Actions Setup

1. Add secrets to your GitHub repository:
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `WORKER_URL`

2. Push to main branch:
   ```bash
   git push origin main
   ```

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

## 🔐 Authentication

The app uses Supabase Auth with GitHub OAuth:

1. Users sign in with GitHub
2. JWT tokens are used for API authentication
3. Row Level Security (RLS) protects user data

## 🛠️ Development

### Adding New Features

1. **Database**: Add migrations to `supabase/migrations/`
2. **Worker**: Add endpoints to `worker/src/index.ts`
3. **Frontend**: Add components to `web/src/`

### Local Testing

```bash
# Test worker
make dev-worker

# Test frontend
make dev-web

# Check all services
make health
```

## 📖 Documentation

- [SUPABASE_SETUP.md](SUPABASE_SETUP.md) - Supabase cloud setup guide
- [OPENAI_SETUP.md](OPENAI_SETUP.md) - OpenAI API setup with cost-effective options
- [RAG_ARCHITECTURE.md](RAG_ARCHITECTURE.md) - RAG & Context Engineering architecture
- [SECURITY_ANALYSIS.md](SECURITY_ANALYSIS.md) - Security analysis and recommendations
- [DEPLOYMENT.md](DEPLOYMENT.md) - Environment variables and deployment guide
- [Supabase Docs](https://supabase.com/docs)
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- [OpenAI API](https://platform.openai.com/docs)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.