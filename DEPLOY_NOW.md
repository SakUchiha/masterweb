# Quick Deployment Guide

## 🚀 Deploy to Vercel in 5 Minutes

### Step 1: Push to Git
```bash
git add .
git commit -m "Ready for Vercel deployment"
git push
```

### Step 2: Deploy on Vercel
1. Go to https://vercel.com/new
2. Import your Git repository
3. **IMPORTANT**: Click "Environment Variables" and add:
   - **Name**: `GROQ_API_KEY`
   - **Value**: `YOUR_GROQ_API_KEY_HERE` (get it from https://console.groq.com/)
   - **Environment**: Select all (Production, Preview, Development)
4. Click "Deploy"

### Step 3: Test Your Deployment

After deployment completes, test these URLs:
- Home: `https://your-project.vercel.app/`
- Lessons: `https://your-project.vercel.app/lessons.html`
- AI Assistant: `https://your-project.vercel.app/ai.html`

### ✅ Verification Checklist

- [ ] Home page loads
- [ ] Lessons page loads and shows lesson cards
- [ ] Clicking a lesson opens it correctly
- [ ] AI Assistant page loads
- [ ] AI Assistant responds (not fallback mode)
- [ ] Visit `/api/groq/health` - should show `{"status":"healthy"}`

### 🔧 If Something Doesn't Work

1. **AI not working?**
   - Check: Settings → Environment Variables → `GROQ_API_KEY` is set
   - Redeploy after adding the variable
   - Check: `/api/groq/health` endpoint

2. **Lessons not loading?**
   - Check: `/api/lessons` returns JSON
   - Check browser console (F12) for errors

3. **Build fails?**
   - Check build logs in Vercel dashboard
   - Ensure Node.js 18+ is selected

For detailed troubleshooting, see `VERCEL_DEPLOYMENT.md`

