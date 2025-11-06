# 🚀 Complete Vercel Deployment Guide

This guide will help you deploy your project to Vercel with your Groq API key configured.

## 📋 Prerequisites

- A Vercel account (sign up at https://vercel.com)
- Git repository (GitHub, GitLab, or Bitbucket)
- Your Groq API key (already provided: `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`)

## 🔑 Step 1: Set Up Environment Variable in Vercel

**CRITICAL**: This must be done BEFORE deploying!

1. Go to https://vercel.com/dashboard
2. Click **"Add New..."** → **"Project"**
3. Import your Git repository (or create a new project)
4. Before clicking Deploy, go to **Settings** → **Environment Variables**
5. Add a new environment variable:
   - **Name**: `GROQ_API_KEY`
   - **Value**: `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`
   - **Environment**: Select **ALL** (Production, Preview, Development)
6. Click **Save**

## 📦 Step 2: Configure Vercel Project Settings

The project is already configured in `vercel.json`, but verify these settings in Vercel dashboard:

1. **General** → **Root Directory**: Leave as `.` (project root)
2. **General** → **Build Command**: 
   ```
   cd vibing/code-understanding-app && npm install && npm run build:frontend
   ```
3. **General** → **Output Directory**: 
   ```
   vibing/code-understanding-app/dist
   ```
4. **General** → **Install Command**: 
   ```
   npm install
   ```
5. **Functions** → Ensure Node.js 18.x is selected

## 🚀 Step 3: Deploy

1. Click **Deploy** button in Vercel dashboard
2. Wait for the build to complete (this may take 3-5 minutes)
3. Vercel will provide you with a deployment URL (e.g., `your-project.vercel.app`)

## ✅ Step 4: Verify Deployment

After deployment, test these endpoints:

### 1. Health Check
Visit: `https://your-project.vercel.app/api/groq/health`

Expected response:
```json
{"status":"healthy","suggestions":[]}
```

If you see `{"status":"unhealthy"}`, the API key wasn't set correctly. Go back to Step 1.

### 2. Home Page
Visit: `https://your-project.vercel.app/`

Should load the main page.

### 3. API Endpoints
- **Groq API**: `https://your-project.vercel.app/api/groq` (POST requests)
- **Lessons API**: `https://your-project.vercel.app/api/lessons` (GET request)

### 4. Frontend Pages
- **Lessons**: `https://your-project.vercel.app/lessons.html`
- **AI Assistant**: `https://your-project.vercel.app/ai.html`
- **Code Editor**: `https://your-project.vercel.app/editor.html`
- **Code Explainer**: `https://your-project.vercel.app/code-explainer.html`

### 5. Test AI Assistant

1. Go to `https://your-project.vercel.app/ai.html`
2. Ask a question like "What is HTML?"
3. You should get a response from Groq AI (NOT a fallback message)

If you see "AI assistant is currently unavailable", check:
- Environment variable is set correctly
- Project has been redeployed after adding the variable
- API key is valid

## 🔧 Troubleshooting

### Build Fails

**Error: Cannot find module**
- Solution: Ensure all dependencies are in `package.json`
- Run `npm install` locally to verify

**Error: Webpack build failed**
- Solution: Check Node.js version (should be 18.x)
- Verify webpack.config.js is correct

### API Returns Fallback Responses

**Symptoms**: Getting demo/fallback responses instead of real AI responses

**Solutions**:
1. Verify `GROQ_API_KEY` is set in Vercel environment variables
2. **MUST redeploy** after adding environment variables
3. Check `/api/groq/health` endpoint returns `{"status":"healthy"}`
4. Verify API key is correct (should start with `gsk_`)

### 404 Errors on Routes

**Symptoms**: Pages not loading, 404 errors

**Solutions**:
1. Verify `vercel.json` rewrites are correct
2. Check build output directory matches `outputDirectory` in settings
3. Ensure frontend files are built (check build logs)

### API Endpoints Not Working

**Symptoms**: `/api/groq` returns 404 or errors

**Solutions**:
1. Verify API files are in `api/` directory at project root
2. Check `vercel.json` has correct rewrites
3. Ensure API files export handler function correctly

## 📁 Project Structure

```
masterweb/
├── api/                          # Serverless functions (Vercel)
│   ├── groq.js                   # AI Assistant API
│   ├── lessons.js                # Lessons API
│   └── data/
│       └── lessons.json          # Lessons data
├── vibing/
│   └── code-understanding-app/
│       ├── dist/                 # Built frontend files (output)
│       ├── frontend/             # Frontend source files
│       ├── webpack.config.js     # Webpack configuration
│       └── package.json          # App dependencies
├── vercel.json                   # Vercel configuration
└── package.json                  # Root package.json
```

## 🔐 Security Notes

1. **Never commit API keys to Git**: The API key should ONLY be in Vercel environment variables
2. **Use environment variables**: Always use `process.env.GROQ_API_KEY` in code, never hardcode
3. **Rotate keys if exposed**: If you accidentally commit a key, rotate it immediately in Groq console

## 📊 Monitoring

After deployment, you can monitor:
- **Deployments**: Vercel dashboard → Deployments
- **Function Logs**: Vercel dashboard → Functions → View logs
- **Analytics**: Vercel dashboard → Analytics (if enabled)

## 🎯 Quick Deployment Checklist

- [ ] Code pushed to Git repository
- [ ] Project imported to Vercel
- [ ] `GROQ_API_KEY` environment variable added with value: `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`
- [ ] Environment variable set for ALL environments (Production, Preview, Development)
- [ ] Build command verified: `cd vibing/code-understanding-app && npm install && npm run build:frontend`
- [ ] Output directory verified: `vibing/code-understanding-app/dist`
- [ ] Project deployed successfully
- [ ] Health check passes: `/api/groq/health` returns `{"status":"healthy"}`
- [ ] Home page loads correctly
- [ ] Lessons page loads correctly
- [ ] AI Assistant works (not fallback mode)
- [ ] Code Editor loads correctly

## 🆘 Need Help?

1. Check Vercel deployment logs for errors
2. Check browser console for frontend errors
3. Test API endpoints directly with curl or Postman
4. Verify environment variables in Vercel dashboard
5. Ensure API key is valid at https://console.groq.com/

---

**Ready to deploy?** Follow the steps above and your project will be live on Vercel! 🎉

