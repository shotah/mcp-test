# GitHub Authentication Setup

This guide walks you through setting up GitHub OAuth authentication for your MCP project.

## 🎯 What You Need

Your web app already has GitHub auth implemented! You just need to:

1. **Create a GitHub OAuth App**
2. **Configure Supabase to use GitHub OAuth**
3. **Update your environment variables**

## 📋 Step-by-Step Setup

### 1. Create GitHub OAuth App

1. **Go to GitHub Settings**:
   - Visit: https://github.com/settings/developers
   - Click "New OAuth App"

2. **Fill in the OAuth App details**:
   ```
   Application name: MCP Test App
   Homepage URL: http://localhost:3000 (for development)
   Authorization callback URL: https://your-project-id.supabase.co/auth/v1/callback
   ```

   **Important**: Replace `your-project-id` with your actual Supabase project ID!

3. **Get your credentials**:
   - Copy the **Client ID**
   - Generate a **Client Secret** (click "Generate a new client secret")

### 2. Configure Supabase

1. **Go to your Supabase Dashboard**:
   - Visit: https://supabase.com/dashboard
   - Select your project

2. **Navigate to Authentication**:
   - Go to: Authentication → Providers
   - Find "GitHub" and click "Configure"

3. **Enable GitHub Provider**:
   - Toggle "Enable GitHub provider" to ON
   - Enter your GitHub OAuth App credentials:
     - **Client ID**: (from step 1)
     - **Client Secret**: (from step 1)

4. **Set Redirect URL**:
   - The redirect URL should be: `https://your-project-id.supabase.co/auth/v1/callback`
   - Supabase will show you the exact URL to use

### 3. Update Environment Variables

Your `.env` file should already have the Supabase keys. Make sure you have:

```bash
# Supabase Configuration (Cloud)
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Web App Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_WORKER_URL=http://127.0.0.1:8787
```

### 4. Test the Setup

1. **Start your development server**:
   ```bash
   npm run dev
   ```

2. **Visit your web app**: http://localhost:3000

3. **Click "Sign in with GitHub"**

4. **You should be redirected to GitHub** for authorization

5. **After authorization, you'll be redirected back** to your app

## 🔧 Production Setup

### For Cloudflare Pages Deployment

When deploying to production, you'll need to update your GitHub OAuth App:

1. **Update OAuth App URLs**:
   - **Homepage URL**: `https://your-project.pages.dev` (or your custom domain)
   - **Authorization callback URL**: `https://your-project-id.supabase.co/auth/v1/callback`

2. **Update CORS in Supabase**:
   - Go to: Authentication → URL Configuration
   - Add your production domain to "Site URL"
   - Add your production domain to "Redirect URLs"

3. **Update GitHub Secrets**:
   - Add your production domain to `ALLOWED_ORIGINS` in GitHub Actions secrets

## 🚨 Common Issues & Solutions

### Issue: "Invalid redirect URI"
**Solution**: Make sure your GitHub OAuth App callback URL exactly matches:
```
https://your-project-id.supabase.co/auth/v1/callback
```

### Issue: "CORS error"
**Solution**: 
1. Check your `ALLOWED_ORIGINS` in environment variables
2. Make sure your domain is added to Supabase URL Configuration

### Issue: "GitHub OAuth App not found"
**Solution**: 
1. Double-check your Client ID and Client Secret
2. Make sure the OAuth App is in the same GitHub account as your repository

### Issue: "Authentication failed"
**Solution**:
1. Check browser console for errors
2. Verify your Supabase URL and anon key
3. Make sure GitHub provider is enabled in Supabase

## 🔐 Security Notes

### What's Already Secure
✅ **JWT Tokens**: Supabase handles secure token generation
✅ **HTTPS Only**: Production uses HTTPS for all communications
✅ **CORS Protection**: Restricted to allowed origins
✅ **Rate Limiting**: 10 requests per minute per IP
✅ **Input Validation**: XSS protection and length limits

### Additional Security (Optional)
- **GitHub App Permissions**: Only request necessary permissions
- **User Data**: Users can only access their own chat sessions
- **Token Expiration**: Supabase handles token refresh automatically

## 📚 Your Current Implementation

Your web app already has:

```typescript
// GitHub OAuth sign-in
const signIn = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: window.location.origin
    }
  })
  if (error) console.error('Error:', error)
}

// JWT token in API calls
const response = await fetch(`${workerUrl}/chat`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
  },
  body: JSON.stringify({
    message: userMessage,
    sessionId: currentSession,
    userId: user?.id
  })
})
```

## 🎉 You're All Set!

Once you complete the setup:

1. **Users can sign in with GitHub**
2. **JWT tokens are automatically handled**
3. **Chat sessions are user-specific**
4. **All API calls are authenticated**

The worker will validate the JWT tokens and ensure users can only access their own data.

## 🔗 Quick Links

- [GitHub OAuth Apps](https://github.com/settings/developers)
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Supabase GitHub Provider](https://supabase.com/docs/guides/auth/social-login/auth-github)
