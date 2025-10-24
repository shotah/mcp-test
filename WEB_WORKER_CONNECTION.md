# How the Web App Finds the Worker

## 🔗 **Connection Flow**

### **1. Environment Variables**
The web app gets the worker URL from environment variables:

```typescript
// In web/src/App.tsx
const workerUrl = import.meta.env.VITE_WORKER_URL || 'http://localhost:8787'
```

### **2. Development vs Production**

#### **Development (Local)**
```bash
# In web/.env.local
VITE_WORKER_URL=http://localhost:8787
```

#### **Production (Deployed)**
```bash
# In GitHub Actions secrets
VITE_WORKER_URL=https://your-worker.your-subdomain.workers.dev
```

### **3. GitHub Actions Deployment**

The workflow passes environment variables to both:

#### **Worker Deployment**
```yaml
- name: Deploy Worker
  run: npx wrangler deploy --prefix worker --env production
  env:
    CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
    SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
    SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
    OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
    ALLOWED_ORIGINS: ${{ secrets.ALLOWED_ORIGINS }}  # ← Added for CORS
```

#### **Web App Build**
```yaml
- name: Build
  run: npm run build --prefix web
  env:
    VITE_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
    VITE_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
    VITE_WORKER_URL: ${{ secrets.WORKER_URL }}  # ← This tells web where worker is
```

### **4. How It Works**

1. **Web app builds** with `VITE_WORKER_URL` baked in
2. **Worker deploys** with `ALLOWED_ORIGINS` for CORS
3. **Web app makes requests** to the worker URL
4. **Worker validates CORS** against allowed origins

### **5. Required GitHub Secrets**

You need to set these in your GitHub repository settings:

```bash
# Required for deployment
CLOUDFLARE_API_TOKEN=your-cloudflare-api-token
CLOUDFLARE_ACCOUNT_ID=your-cloudflare-account-id

# Required for Supabase
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here

# Required for OpenAI
OPENAI_API_KEY=sk-your-openai-key-here

# Required for CORS (NEW!)
ALLOWED_ORIGINS=https://mcp-test.pages.dev,https://mcptest.bldhosting.com

# Required for web app to find worker
WORKER_URL=https://mcp-server-production.your-subdomain.workers.dev
```

### **6. Connection Example**

```typescript
// Web app makes request to worker
const response = await fetch(`${workerUrl}/chat`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    message: userMessage,
    sessionId: currentSession
  })
})
```

### **7. CORS Validation**

The worker checks if the request comes from an allowed origin:

```typescript
// In worker/src/index.ts
const corsHeaders = {
  'Access-Control-Allow-Origin': env.ALLOWED_ORIGINS || 'http://localhost:3000',
  // ... other headers
}
```

### **8. Troubleshooting**

#### **Web app can't find worker**
- Check `VITE_WORKER_URL` is set correctly
- Verify worker deployed successfully
- Check browser network tab for 404 errors

#### **CORS errors**
- Check `ALLOWED_ORIGINS` includes your web app domain
- Verify web app domain matches exactly
- Check browser console for CORS error messages

#### **Authentication errors**
- Check JWT token is being sent
- Verify Supabase auth is working
- Check worker logs for auth errors

### **9. Development Setup**

```bash
# 1. Start worker locally
cd worker
npm run dev  # Runs on http://localhost:8787

# 2. Start web app
cd web
npm run dev  # Runs on http://localhost:3000

# 3. Web app automatically connects to local worker
# VITE_WORKER_URL=http://localhost:8787 (default)
```

### **10. Production Setup**

```bash
# 1. Set GitHub secrets
ALLOWED_ORIGINS=https://mcp-test.pages.dev,https://mcptest.bldhosting.com
WORKER_URL=https://mcp-server-production.your-subdomain.workers.dev

# 2. Push to main branch
git push origin main

# 3. GitHub Actions deploys both
# - Worker to Cloudflare Workers
# - Web app to Cloudflare Pages

# 4. Web app automatically connects to deployed worker
```

## 🎯 **Summary**

The web app finds the worker through:
1. **Environment variable** `VITE_WORKER_URL` 
2. **GitHub Actions** passes it during build
3. **Worker URL** is baked into the web app build
4. **CORS** ensures only allowed domains can access the worker

**The key is setting `WORKER_URL` and `ALLOWED_ORIGINS` in your GitHub secrets!** 🔑
