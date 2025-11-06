# ⚡ Quick Start - Deploy in 3 Steps

## Get Your Groq API Key
1. Visit: https://console.groq.com/
2. Sign up or log in
3. Create a new API key
4. Copy the key (starts with `gsk_`)

## Step 1: Push to Git ✅ (Already Done!)
Your code has been committed and is ready to push:
```bash
git push origin main
```

## Step 2: Deploy on Vercel

1. **Go to**: https://vercel.com/new
2. **Import** your Git repository
3. **Add Environment Variable**:
   - Name: `GROQ_API_KEY`
   - Value: `YOUR_API_KEY_FROM_GROQ_CONSOLE` (paste your key here)
   - Select: Production, Preview, Development ✅
4. **Click "Deploy"**

## Step 3: Test

After deployment:
1. Visit your site: `https://your-project.vercel.app`
2. Test AI: Go to `/ai.html` and ask "What is HTML?"
3. Test Lessons: Go to `/lessons.html`
4. Health check: Visit `/api/groq/health` (should show healthy)

---

**Need more help?** See `COMPLETE_DEPLOYMENT_GUIDE.md` for detailed instructions.

