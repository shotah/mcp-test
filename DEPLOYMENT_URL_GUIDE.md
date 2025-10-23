# How to Get Worker URL from Deployment

## 🔍 **Current Options**

### **Option 1: Manual (Simplest)**
1. **Deploy worker** → Get URL from Cloudflare dashboard
2. **Set GitHub secret** `WORKER_URL` manually
3. **Redeploy web app** → Uses the worker URL

### **Option 2: Automatic (Complex)**
The GitHub Actions workflow can capture the worker URL, but it's tricky because:
- Wrangler doesn't always output the URL clearly
- We need to construct it from the account ID and worker name

## 🚀 **Recommended Approach**

### **Step 1: Deploy Worker First**
```bash
# Deploy worker manually to get the URL
cd worker
npx wrangler deploy --env production
```

### **Step 2: Get Worker URL**
The worker URL will be:
```
https://mcp-server.{your-account-id}.workers.dev
```

### **Step 3: Set GitHub Secret**
1. Go to GitHub → Settings → Secrets and variables → Actions
2. Add secret: `WORKER_URL` = `https://mcp-server.{your-account-id}.workers.dev`

### **Step 4: Deploy Web App**
```bash
# Push to main - web app will use the worker URL
git push origin main
```

## 🔧 **Alternative: Use Environment Variables**

Instead of capturing the URL, you can set it in your environment:

### **In `.env` (Development)**
```bash
VITE_WORKER_URL=http://localhost:8787
```

### **In GitHub Secrets (Production)**
```bash
WORKER_URL=https://mcp-server.{your-account-id}.workers.dev
```

## 📝 **Quick Setup**

1. **Deploy worker**: `npx wrangler deploy --prefix worker --env production`
2. **Copy worker URL** from Cloudflare dashboard
3. **Set GitHub secret**: `WORKER_URL` = your worker URL
4. **Push to main**: Web app will automatically use the worker URL

## 🎯 **Why This Works**

- **Worker deploys** with a predictable URL format
- **GitHub Actions** passes the URL to web app build
- **Web app** gets the URL baked in during build
- **No manual intervention** needed after initial setup

**The key is setting the `WORKER_URL` secret once, then everything works automatically!** 🔑
