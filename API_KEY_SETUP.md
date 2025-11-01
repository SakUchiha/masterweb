# 🔑 API Key Setup (IMPORTANT!)

## Get Your Groq API Key

**DO NOT COMMIT API KEYS TO GIT!** Only add them in Vercel environment variables.

### How to Get Your API Key:

1. Visit: https://console.groq.com/
2. Sign up or log in to your account
3. Go to API Keys section
4. Create a new API key
5. Copy the key (it starts with `gsk_`)

## How to Add to Vercel

1. Go to your Vercel project dashboard
2. Click **Settings** → **Environment Variables**
3. Click **Add New**
4. Enter:
   - **Name**: `GROQ_API_KEY`
   - **Value**: `YOUR_API_KEY_HERE` (paste your key from Groq console)
   - **Environment**: Select ALL (Production, Preview, Development)
5. Click **Save**
6. **IMPORTANT**: Redeploy your project after adding the variable!

## Verify It's Working

After deployment, visit:
```
https://your-project.vercel.app/api/groq/health
```

Should return: `{"status":"healthy"}`

If it returns `{"status":"unhealthy"}`, the API key wasn't set correctly or the project needs to be redeployed.

