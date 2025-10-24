# Model Configuration Guide

## 🤖 **Configurable Models**

Your MCP setup now supports configurable OpenAI models via environment variables!

### **Environment Variables**

```bash
# Embedding model for vector search
OPENAI_EMBEDDING_MODEL=text-embedding-ada-002

# Chat model for responses  
OPENAI_CHAT_MODEL=gpt-5-nano
```

## 💰 **Model Cost Comparison**

### **Embedding Models**
| Model | Cost per 1M tokens | Quality | Use Case |
|-------|-------------------|---------|----------|
| `text-embedding-ada-002` | $0.10 | Good | Default, reliable |
| `text-embedding-3-small` | $0.02 | Good | Cost-optimized |
| `text-embedding-3-large` | $0.13 | Better | High-quality search |

### **Chat Models**
| Model | Input Cost | Output Cost | Context | Quality | Use Case |
|-------|------------|-------------|---------|---------|----------|
| `gpt-4o-mini` | $0.15/1M | $0.60/1M | 128K | Good | Cost-optimized, default |
| `gpt-4o` | $3.00/1M | $10.00/1M | 128K | Excellent | High-quality responses |
| `gpt-4-turbo` | $10.00/1M | $30.00/1M | 128K | Excellent | Long context |
| `gpt-4` | $30.00/1M | $60.00/1M | 8K | Excellent | Legacy high-quality |
| `gpt-5-nano` | $0.05/1M | $0.40/1M | Unknown | Good | Ultra cost-optimized |
| `gpt-5-mini` | $0.25/1M | $2.00/1M | Unknown | Good | Cost-optimized |
| `gpt-5` | $1.25/1M | $10.00/1M | Unknown | Excellent | Balanced performance |

## 🎯 **Recommended Configurations**

### **Development (Ultra Low Cost)**
```bash
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
OPENAI_CHAT_MODEL=gpt-5-nano
```

### **Development (Low Cost)**
```bash
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
OPENAI_CHAT_MODEL=gpt-4o-mini
```

### **Production (Balanced)**
```bash
OPENAI_EMBEDDING_MODEL=text-embedding-ada-002
OPENAI_CHAT_MODEL=gpt-4o
```

### **High Quality**
```bash
OPENAI_EMBEDDING_MODEL=text-embedding-3-large
OPENAI_CHAT_MODEL=gpt-4-turbo
```

## 🚀 **Benefits of GPT-5-nano (If Available)**

- **ULTRA CHEAP**: $0.05/1M input, $0.40/1M output
- **97% cheaper** than GPT-4-turbo!
- **Perfect for high-volume** applications
- **Good for simple tasks** where quality isn't critical
- **Faster response times** (likely)

## ⚙️ **How to Configure**

### **Development**
```bash
# In your .env file
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
OPENAI_CHAT_MODEL=gpt-5-nano
```

### **Production (GitHub Secrets)**
```bash
# Set these in GitHub repository secrets
OPENAI_EMBEDDING_MODEL=text-embedding-ada-002
OPENAI_CHAT_MODEL=gpt-4o-mini
```

### **Cloudflare Dashboard**
1. Go to Workers & Pages → Your Worker
2. Settings → Variables
3. Add the model environment variables

## 📊 **Cost Impact Examples**

### **High Volume Usage (1M tokens/day)**
- **GPT-4-turbo**: ~$40/day
- **GPT-4o**: ~$13/day
- **GPT-4o-mini**: ~$0.75/day
- **GPT-5-nano**: ~$0.45/day (98% savings!)

### **Low Volume Usage (10K tokens/day)**
- **GPT-4-turbo**: ~$0.40/day
- **GPT-4o**: ~$0.13/day
- **GPT-4o-mini**: ~$0.0075/day
- **GPT-5-nano**: ~$0.0045/day (98% savings!)

## 🎯 **Recommendation**

**Start with GPT-5-nano** for cost optimization:
```bash
OPENAI_CHAT_MODEL=gpt-5-nano
```

**Monitor quality** and switch to GPT-4o-mini if needed:
```bash
OPENAI_CHAT_MODEL=gpt-4o-mini
```

**Your MCP setup is now model-flexible and cost-optimizable!** 🚀
