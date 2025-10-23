# Rate Limiting Test

## 🧪 **Test Your Rate Limiting**

### Test 1: Normal Usage (Should Work)
```bash
# First 10 requests should work fine
for i in {1..10}; do
  curl -X POST http://localhost:8787/health
  echo "Request $i"
done
```

### Test 2: Rate Limiting (Should Block)
```bash
# 11th request should be rate limited
curl -X POST http://localhost:8787/health
# Should return: Rate limited (429)
```

### Test 3: Rate Limit Reset (Should Work After 1 Minute)
```bash
# Wait 1 minute, then this should work again
curl -X POST http://localhost:8787/health
# Should return: {"status":"ok"}
```

## 📊 **Rate Limiting Configuration**

- **Limit**: 10 requests per minute per IP
- **Window**: 60 seconds (1 minute)
- **Response**: HTTP 429 "Rate limited"
- **Reset**: Automatic after 1 minute

## 🔍 **IP Detection Strategy**

### **Known IPs**
- Uses `CF-Connecting-IP` (Cloudflare)
- Falls back to `X-Forwarded-For` (proxies)
- Falls back to `X-Real-IP` (nginx)
- Falls back to `X-Client-IP` (other proxies)

### **Unknown IPs**
- **Problem**: All unknown IPs shared the same rate limit
- **Solution**: Each unknown request gets a unique identifier
- **Format**: `unknown-{timestamp}-{random}`
- **Benefit**: Each unknown request gets its own rate limit

### **Example IPs**
```
192.168.1.100          # Known IP - gets its own rate limit
203.0.113.45           # Known IP - gets its own rate limit  
unknown-1703123456-abc123  # Unknown IP - gets its own rate limit
unknown-1703123457-def456  # Different unknown IP - separate rate limit
```

## 🎯 **Expected Behavior**

1. **First 10 requests**: ✅ Success (200 OK)
2. **11th+ requests**: ❌ Rate limited (429)
3. **After 1 minute**: ✅ Success again (200 OK)

## 🚀 **Production Benefits**

- **Prevents abuse**: No more unlimited API calls
- **Cost control**: Protects against unexpected OpenAI bills
- **DoS protection**: Blocks rapid-fire requests
- **Fair usage**: Ensures all users get equal access

## 📝 **Notes**

- Rate limiting is per IP address
- Different IPs have separate limits
- Limits reset every minute
- Only applies to actual requests (not OPTIONS preflight)
