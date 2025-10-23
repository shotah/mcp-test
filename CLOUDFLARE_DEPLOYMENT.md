# Cloudflare Deployment Guide

## 🚀 **Deploying to Cloudflare Workers**

### 1. **Environment Variables Setup**

Add these to your Cloudflare Worker environment variables:

```bash
# Required
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
OPENAI_API_KEY=sk-your-openai-key-here

# CORS Configuration
# For Cloudflare Pages: https://your-project.pages.dev
# For custom domains: https://mcptest.bldhosting.com
# For multiple domains: https://your-project.pages.dev,https://mcptest.bldhosting.com
ALLOWED_ORIGINS=https://your-project.pages.dev,https://mcptest.bldhosting.com
```

### 2. **CORS Configuration**

The worker now uses environment-specific CORS:

```typescript
// Development
ALLOWED_ORIGINS=http://localhost:3000

// Production
ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com
```

### 3. **Deployment Steps**

#### Option A: Using Wrangler CLI
```bash
# Install Wrangler globally
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Deploy
cd worker
wrangler deploy
```

#### Option B: Using GitHub Actions (Recommended)
The existing `.github/workflows/deploy.yml` will handle this automatically when you push to main.

### 4. **Environment Variables in Cloudflare**

1. Go to Cloudflare Dashboard → Workers & Pages
2. Select your worker
3. Go to Settings → Variables
4. Add the environment variables listed above

### 5. **CORS Examples**

#### Cloudflare Pages Dev Domain
```bash
ALLOWED_ORIGINS=https://mcp-test.pages.dev
```

#### Custom Domain
```bash
ALLOWED_ORIGINS=https://mcptest.bldhosting.com
```

#### Multiple Domains (Dev + Custom)
```bash
ALLOWED_ORIGINS=https://mcp-test.pages.dev,https://mcptest.bldhosting.com
```

#### Development + Production
```bash
ALLOWED_ORIGINS=http://localhost:3000,https://mcp-test.pages.dev,https://mcptest.bldhosting.com
```

### 6. **Testing Deployment**

```bash
# Test your deployed worker
curl -X GET https://your-worker.your-subdomain.workers.dev/health

# Should return: {"status":"ok"}
```

### 7. **Security Considerations**

- ✅ **CORS**: Restricted to your domains only
- ✅ **Authentication**: JWT validation required
- ✅ **Rate Limiting**: 10 requests/minute per IP
- ✅ **Input Validation**: XSS protection
- ✅ **User Isolation**: Users can only access their own data

### 8. **Production Checklist**

- [ ] Set `ALLOWED_ORIGINS` to your production domains
- [ ] Verify Supabase cloud project is linked
- [ ] Test authentication flow
- [ ] Test rate limiting
- [ ] Monitor Cloudflare analytics
- [ ] Set up error alerts

### 9. **Common Issues**

#### CORS Errors
```
Access to fetch at 'https://your-worker.workers.dev/chat' from origin 'https://your-domain.com' has been blocked by CORS policy
```
**Solution**: Add your domain to `ALLOWED_ORIGINS`

#### Authentication Errors
```
401 Unauthorized
```
**Solution**: Ensure your web app is sending JWT tokens in the Authorization header

#### Rate Limiting
```
429 Rate limited
```
**Solution**: This is working correctly - wait 1 minute or implement exponential backoff

### 10. **Monitoring**

- **Cloudflare Analytics**: View request metrics
- **Error Logs**: Check Cloudflare dashboard for errors
- **Rate Limiting**: Monitor 429 responses
- **Authentication**: Track 401 responses

## 🎯 **Quick Deployment**

1. **Set environment variables** in Cloudflare dashboard
2. **Deploy**: `wrangler deploy` or push to main
3. **Test**: Verify `/health` endpoint works
4. **Update web app**: Point to your worker URL
5. **Test authentication**: Verify login flow works

Your MCP setup is now production-ready on Cloudflare! 🚀
