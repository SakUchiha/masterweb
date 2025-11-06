# ⚡ Quick Deployment Steps

## 🎯 Fast Track Deployment (5 Minutes)

### Step 1: Add API Key to Vercel
1. Go to https://vercel.com/dashboard
2. Click **"Add New..."** → **"Project"**
3. Import your Git repository
4. Go to **Settings** → **Environment Variables**
5. Add:
   - **Name**: `GROQ_API_KEY`
   - **Value**: `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`
   - **Environments**: ✅ Production ✅ Preview ✅ Development
6. Click **Save**

### Step 2: Deploy
1. Click **Deploy** button
2. Wait for build (3-5 minutes)

### Step 3: Verify
Visit: `https://your-project.vercel.app/api/groq/health`

Should return: `{"status":"healthy"}`

## ✅ Done!

Your project is now live with AI features enabled!

For detailed information, see `DEPLOY_TO_VERCEL.md`

