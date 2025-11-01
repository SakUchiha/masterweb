# Vercel Deployment Guide

This guide will help you deploy your project to Vercel with all features working correctly.

## Prerequisites

- A Vercel account (sign up at https://vercel.com)
- Git repository (GitHub, GitLab, or Bitbucket)
- Your Groq API key (get it from https://console.groq.com/)

## Step 1: Push Your Code to Git

Make sure your code is committed and pushed to your Git repository:

```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

## Step 2: Import Project to Vercel

1. Go to https://vercel.com/dashboard
2. Click "Add New..." → "Project"
3. Import your Git repository
4. Vercel will auto-detect the project settings

## Step 3: Configure Environment Variables

**CRITICAL**: You MUST set the Groq API key as an environment variable for the AI assistant to work!

1. In your Vercel project dashboard, go to **Settings** → **Environment Variables**
2. Add a new environment variable:
   - **Name**: `GROQ_API_KEY`
   - **Value**: `YOUR_GROQ_API_KEY_HERE` (get it from https://console.groq.com/)
   - **Environment**: Select all (Production, Preview, Development)
3. Click **Save**

## Step 4: Configure Project Settings

In the Vercel project settings:

1. **General** → **Build Command**: 
   ```
   cd vibing/code-understanding-app && npm install && npm run build:frontend
   ```

2. **General** → **Output Directory**: 
   ```
   vibing/code-understanding-app/frontend
   ```

3. **General** → **Install Command**: 
   ```
   npm install
   ```

4. **General** → **Root Directory**: Leave as `.` (project root)

## Step 5: Deploy

1. Click **Deploy** button
2. Wait for the build to complete
3. Vercel will provide you with a deployment URL (e.g., `your-project.vercel.app`)

## Step 6: Verify Deployment

After deployment, test these pages:

1. **Home Page**: `https://your-project.vercel.app/`
2. **Lessons Page**: `https://your-project.vercel.app/lessons.html`
3. **AI Assistant**: `https://your-project.vercel.app/ai.html`
4. **Code Editor**: `https://your-project.vercel.app/editor.html`

### Testing the AI Assistant

1. Go to the AI Assistant page
2. Ask a question like "What is HTML?"
3. You should get a response from the Groq AI (not a fallback message)

### Testing Lessons

1. Go to the Lessons page
2. Click on any lesson (e.g., "HTML Introduction")
3. The lesson should load with content and slides

## Troubleshooting

### AI Assistant Not Working

- **Check Environment Variables**: Go to Settings → Environment Variables and verify `GROQ_API_KEY` is set
- **Redeploy**: After adding environment variables, you MUST redeploy the project
- **Check API Endpoint**: Visit `https://your-project.vercel.app/api/groq/health` - it should return `{"status":"healthy"}`

### Lessons Not Loading

- **Check API Endpoint**: Visit `https://your-project.vercel.app/api/lessons` - it should return a JSON array of lessons
- **Check Browser Console**: Open Developer Tools (F12) and check for any errors

### Build Fails

- **Check Node Version**: Ensure Node.js 18.x or higher is used
- **Check Build Logs**: Review the build logs in Vercel dashboard for specific errors
- **Verify Dependencies**: Make sure all npm packages are listed in package.json

### 404 Errors on Routes

- **Check vercel.json**: Ensure the rewrites configuration is correct
- **Verify File Structure**: Make sure frontend files are in `vibing/code-understanding-app/frontend/`

## Project Structure

```
masterweb/
├── api/                    # Serverless functions
│   ├── groq.js            # AI Assistant API
│   ├── lessons.js         # Lessons API
│   └── data/
│       └── lessons.json   # Lessons data
├── vibing/
│   └── code-understanding-app/
│       └── frontend/      # Frontend application
├── vercel.json            # Vercel configuration
└── package.json           # Root package.json
```

## Important Notes

1. **Never commit API keys to Git**: The API key should only be in Vercel environment variables
2. **Redeploy after changes**: If you add/change environment variables, you must redeploy
3. **Free Tier Limits**: Vercel free tier has limitations on serverless function execution time and bandwidth

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Check browser console for frontend errors
3. Verify all environment variables are set correctly
4. Ensure the API key is valid and has credits on Groq

## Quick Deployment Checklist

- [ ] Code pushed to Git repository
- [ ] Project imported to Vercel
- [ ] `GROQ_API_KEY` environment variable added
- [ ] Build command configured
- [ ] Output directory configured
- [ ] Project deployed
- [ ] Home page loads correctly
- [ ] Lessons page loads correctly
- [ ] AI Assistant works (not fallback mode)
- [ ] Code Editor loads correctly

