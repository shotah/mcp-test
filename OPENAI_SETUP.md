# OpenAI API Setup Guide

This guide covers setting up OpenAI API access for development and production, with cost-effective options for learning and exploration.

## 🎯 For Learning & Development (Low Cost)

### Option 1: OpenAI Free Tier + Pay-As-You-Go

**Best for**: Learning, testing, small projects

1. **Sign up at [platform.openai.com](https://platform.openai.com/)**
2. **Get $5 free credit** (new accounts)
3. **Set usage limits**:
   - Go to Settings → Usage limits
   - Set monthly limit to $5-10
   - Enable email alerts

**Costs**:
- **Embeddings**: ~$0.0001 per 1K tokens (very cheap)
- **Chat completions**: ~$0.002 per 1K tokens
- **$5 credit** = ~2.5M tokens for embeddings or ~250K tokens for chat

### Option 2: OpenAI API with Budget Controls

**Best for**: Serious development with cost control

1. **Add payment method** (required for API access)
2. **Set strict limits**:
   - Monthly limit: $10-20
   - Daily limit: $2-5
   - Hard limit: $25
3. **Monitor usage** in dashboard

**Estimated monthly costs for this project**:
- Development/testing: $2-5/month
- Light production: $10-20/month
- Heavy production: $50-100/month

## 🚀 Production Recommendations

### Tier 1: Small Production (< 1K users)

**OpenAI Plan**: Pay-as-you-go with limits
- **Monthly budget**: $25-50
- **Usage monitoring**: Essential
- **Features**: Standard API access

### Tier 2: Medium Production (1K-10K users)

**OpenAI Plan**: Pay-as-you-go with higher limits
- **Monthly budget**: $100-500
- **Usage monitoring**: Critical
- **Features**: Priority support, higher rate limits

### Tier 3: Large Production (10K+ users)

**OpenAI Plan**: Enterprise or dedicated capacity
- **Monthly budget**: $500+
- **Usage monitoring**: Advanced analytics
- **Features**: Custom models, dedicated support

## 🔧 Setup Instructions

### Step 1: Create OpenAI Account

1. Go to [platform.openai.com](https://platform.openai.com/)
2. Sign up with email
3. Verify your email
4. Complete phone verification

### Step 2: Get API Key

1. Go to **API Keys** section
2. Click **"Create new secret key"**
3. Name it: `mcp-test-dev`
4. Copy the key (starts with `sk-`)
5. **Save it securely** - you won't see it again!

### Step 3: Set Usage Limits

1. Go to **Settings** → **Usage limits**
2. Set **Monthly limit**: $10 (for learning)
3. Set **Daily limit**: $2
4. Enable **Email alerts**
5. Add **Payment method** (required for API access)

### Step 4: Test Your Key

```bash
# Test in your terminal
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer sk-your-key-here"
```

### Step 5: Add to Your Project

```bash
# Add to your .env file
OPENAI_API_KEY=sk-your-actual-key-here
```

## 💰 Cost Breakdown for This Project

### Development Phase (Learning)

| Feature | Usage | Cost |
|---------|-------|------|
| Embeddings | 100 docs × 1K tokens | $0.01 |
| Chat completions | 50 conversations | $0.50 |
| **Total per month** | | **~$2-5** |

### Production Phase

| Feature | Usage | Cost |
|---------|-------|------|
| Embeddings | 1K docs × 1K tokens | $0.10 |
| Chat completions | 500 conversations | $5.00 |
| **Total per month** | | **~$10-20** |

## 🛡️ Cost Control Strategies

### 1. Usage Monitoring

```bash
# Check your usage
curl https://api.openai.com/v1/usage \
  -H "Authorization: Bearer sk-your-key-here"
```

### 2. Rate Limiting in Code

```typescript
// Add rate limiting to your worker
const RATE_LIMIT = 10; // requests per minute
const requests = new Map();

export default {
  async fetch(request: Request, env: Env) {
    const clientIP = request.headers.get('CF-Connecting-IP');
    const now = Date.now();
    
    // Simple rate limiting
    if (requests.has(clientIP)) {
      const lastRequest = requests.get(clientIP);
      if (now - lastRequest < 60000 / RATE_LIMIT) {
        return new Response('Rate limited', { status: 429 });
      }
    }
    
    requests.set(clientIP, now);
    // ... rest of your code
  }
};
```

### 3. Caching Responses

```typescript
// Cache expensive AI responses
const cache = new Map();

export default {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);
    const cacheKey = url.searchParams.toString();
    
    // Check cache first
    if (cache.has(cacheKey)) {
      return new Response(cache.get(cacheKey));
    }
    
    // Make API call
    const response = await openai.chat.completions.create({
      // ... your request
    });
    
    // Cache the response
    cache.set(cacheKey, JSON.stringify(response));
    
    return new Response(JSON.stringify(response));
  }
};
```

## 🔄 Alternative: Free Development Options

### Option 1: Mock Responses (Free)

```typescript
// For development, mock the AI responses
const mockEmbedding = async (text: string) => {
  // Generate a fake embedding vector
  return Array.from({length: 1536}, () => Math.random());
};

const mockChat = async (message: string) => {
  return {
    content: `Mock response to: ${message}`,
    role: 'assistant'
  };
};
```

### Option 2: Hugging Face Free API

```typescript
// Alternative to OpenAI (free tier available)
const huggingFaceEmbedding = async (text: string) => {
  const response = await fetch('https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2', {
    headers: { 'Authorization': 'Bearer hf_your_token' },
    method: 'POST',
    body: JSON.stringify({ inputs: text })
  });
  return response.json();
};
```

## 📊 Monitoring & Alerts

### Set Up Usage Alerts

1. **OpenAI Dashboard**: Set up email alerts at 50%, 80%, 100% of limit
2. **GitHub Actions**: Add usage monitoring to your CI/CD
3. **Custom Dashboard**: Track usage in your app

### Example Usage Monitoring

```typescript
// Add to your worker
const trackUsage = async (tokens: number, cost: number) => {
  // Log to your database
  await supabase.from('usage_logs').insert({
    tokens,
    cost,
    timestamp: new Date().toISOString()
  });
};
```

## 🚨 Emergency Cost Control

### If You Exceed Budget

1. **Immediate**: Disable API key in OpenAI dashboard
2. **Check**: Review usage logs
3. **Fix**: Add rate limiting and caching
4. **Re-enable**: With stricter limits

### Cost Optimization Tips

1. **Use cheaper models** for development
2. **Cache responses** aggressively
3. **Implement rate limiting**
4. **Monitor usage** daily
5. **Set hard limits** in code

## 🎯 Recommended Setup for Learning

**For your learning project, I recommend**:

1. **Start with $5 free credit**
2. **Set $10 monthly limit**
3. **Enable all alerts**
4. **Use caching and rate limiting**
5. **Monitor usage daily**

This setup will cost you **$0-10/month** for learning and give you plenty of room to explore!

## 🔗 Next Steps

1. **Get your OpenAI API key**
2. **Add it to your `.env` file**
3. **Test locally**: `make dev-worker`
4. **Deploy**: `git push origin main`
5. **Monitor usage** in OpenAI dashboard

## 📚 Additional Resources

- [OpenAI Pricing](https://openai.com/pricing)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Usage Limits Guide](https://platform.openai.com/docs/guides/rate-limits)
- [Cost Optimization Tips](https://platform.openai.com/docs/guides/production-best-practices)
