# 🚀 Complete Deployment Guide - Step by Step

This guide will walk you through deploying your project to Vercel from start to finish.

## ✅ Step 1: Verify All Changes Are Ready

Your project has been configured with:
- ✅ Updated `vercel.json` with proper routing
- ✅ Enhanced `api/groq.js` with full Groq API support
- ✅ Updated `api/lessons.js` with file loading
- ✅ Updated `package.json` with correct dependencies
- ✅ Created deployment documentation

## 📤 Step 2: Push to Git

Run these commands (or I can help you run them):

```bash
cd masterweb
git add .
git commit -m "Configure project for Vercel deployment with Groq API integration"
git push origin main
```

## 🌐 Step 3: Deploy to Vercel

### Option A: Via Vercel Dashboard (Recommended)

1. **Go to Vercel**
   - Visit: https://vercel.com
   - Sign in or create an account (free)

2. **Import Your Project**
   - Click "Add New..." → "Project"
   - Find and select your repository
   - Click "Import"

3. **Configure Project Settings**
   - **Framework Preset**: Other (or leave default)
   - **Root Directory**: `./masterweb` (if deploying from repo root) OR `.` (if deploying masterweb folder)
   - **Build Command**: `cd vibing/code-understanding-app && npm install && npm run build:frontend`
   - **Output Directory**: `vibing/code-understanding-app/frontend`
   - **Install Command**: `npm install`

4. **🔑 CRITICAL: Add Environment Variable**
   - Click "Environment Variables" section
   - Add new variable:
     - **Name**: `GROQ_API_KEY`
     - **Value**: `YOUR_GROQ_API_KEY_HERE` (get it from https://console.groq.com/)
     - **Environment**: Select ALL (Production, Preview, Development) ✅
   - Click "Save"

5. **Deploy**
   - Click "Deploy" button
   - Wait 2-5 minutes for build to complete
   - You'll get a URL like: `your-project.vercel.app`

### Option B: Via Vercel CLI

If you have Vercel CLI installed:

```bash
cd masterweb
npm install -g vercel
vercel login
vercel --prod
```

When prompted, add the environment variable:
- `GROQ_API_KEY` = `YOUR_GROQ_API_KEY_HERE` (get it from https://console.groq.com/)

## ✅ Step 4: Test Your Deployment

After deployment completes, test these URLs:

1. **Home Page**
   ```
   https://your-project.vercel.app/
   ```
   Should show the main landing page

2. **Lessons Page**
   ```
   https://your-project.vercel.app/lessons.html
   ```
   Should show lesson cards and allow clicking on lessons

3. **AI Assistant**
   ```
   https://your-project.vercel.app/ai.html
   ```
   Should load the AI chat interface

4. **Code Editor**
   ```
   https://your-project.vercel.app/editor.html
   ```
   Should load the code editor

5. **API Health Check**
   ```
   https://your-project.vercel.app/api/groq/health
   ```
   Should return: `{"status":"healthy"}` ✅

6. **Lessons API**
   ```
   https://your-project.vercel.app/api/lessons
   ```
   Should return JSON array of lessons ✅

## 🔧 Step 5: Verify Everything Works

### Test AI Assistant
1. Go to AI Assistant page
2. Type a message like: "What is HTML?"
3. Click Send
4. **Expected**: You should get a real AI response (NOT a fallback/demo message)
5. **If you see fallback**: The API key isn't set correctly - go back to Vercel settings and add it, then redeploy

### Test Lessons
1. Go to Lessons page
2. Click on "HTML Introduction" (or any lesson)
3. **Expected**: Lesson should open with content, slides, and exercises
4. **If error**: Check browser console (F12) for details

### Test Code Editor
1. Go to Code Editor page
2. Type some HTML code
3. **Expected**: Code should run and display results

## 🐛 Troubleshooting

### Problem: AI Assistant shows "demo mode" or fallback message

**Solution:**
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Verify `GROQ_API_KEY` is set with correct value
3. Make sure it's enabled for all environments (Production, Preview, Development)
4. **Redeploy** the project (go to Deployments → click "..." → Redeploy)

### Problem: Lessons not loading

**Solution:**
1. Check `/api/lessons` endpoint - should return JSON
2. Check browser console (F12) for errors
3. Verify lessons.json file exists in `api/data/lessons.json`

### Problem: 404 errors on pages

**Solution:**
1. Check `vercel.json` is in the root directory
2. Verify file structure matches the rewrites in `vercel.json`
3. Check build logs in Vercel dashboard for errors

### Problem: Build fails

**Solution:**
1. Check build logs in Vercel dashboard
2. Verify Node.js version is 18+
3. Check that all dependencies are in `package.json`
4. Try setting Node.js version in Vercel: Settings → Node.js Version → 18.x

### Problem: Static files (CSS/JS) not loading

**Solution:**
1. Check `vercel.json` rewrites are correct
2. Verify files exist in `vibing/code-understanding-app/frontend/`
3. Check browser Network tab to see which files fail to load

## 📋 Deployment Checklist

Before deploying:
- [x] All code changes committed
- [x] `vercel.json` configured
- [x] API endpoints updated
- [x] Package.json updated

During deployment:
- [ ] Project imported to Vercel
- [ ] Environment variable `GROQ_API_KEY` added
- [ ] Build settings configured
- [ ] Deployment completed successfully

After deployment:
- [ ] Home page loads
- [ ] Lessons page loads
- [ ] AI Assistant works (not fallback mode)
- [ ] Code Editor works
- [ ] Health check endpoint returns healthy
- [ ] Lessons API returns data

## 🎉 Success!

Once all checks pass, your project is successfully deployed! 

Your Vercel URL will be:
- Production: `https://your-project.vercel.app`
- You can also add a custom domain in Vercel settings

## 📞 Need Help?

1. Check Vercel deployment logs
2. Check browser console (F12) for frontend errors
3. Test API endpoints directly
4. Review `VERCEL_DEPLOYMENT.md` for detailed troubleshooting

## 🔄 Future Updates

To update your deployment:
```bash
cd masterweb
# Make your changes
git add .
git commit -m "Your update message"
git push origin main
```

Vercel will automatically redeploy! 🎊

