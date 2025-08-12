# 🚀 Railway Deployment Guide

## Prerequisites
1. **Railway account** - Sign up at [railway.app](https://railway.app)
2. **GitHub connected** - Link your GitHub account to Railway
3. **Environment variables** - Have your API keys ready

## Quick Deploy to Railway

### Option 1: One-Click Deploy (Recommended)
Click this button to deploy directly from GitHub:

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/K8vJ9Q?referralCode=MOBULA)

### Option 2: Manual Deployment

1. **Connect Repository to Railway**
   - Go to [railway.app/dashboard](https://railway.app/dashboard)
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose `ilyarudishin/Mobula-SEO`

2. **Configure Environment Variables**
   Go to your project settings and add these **REQUIRED** variables:

   ```bash
   # AI & Content Generation (REQUIRED)
   CLAUDE_API_KEY=sk-ant-api03-...
   NOTION_API_KEY=secret_...
   NOTION_DATABASE_ID=24d2083f...
   
   # SEO Data (REQUIRED)
   SERPAPI_KEY=your_serpapi_key
   
   # Notifications (REQUIRED) 
   SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
   
   # App Config (REQUIRED)
   TARGET_DOMAIN=mobula.io
   NODE_ENV=production
   PORT=8080
   ```

   **OPTIONAL** variables for enhanced features:
   ```bash
   # DataForSEO (optional)
   DATAFORSEO_LOGIN=your_login
   DATAFORSEO_PASSWORD=your_password
   
   # Google Search Console (optional)
   GOOGLE_APPLICATION_CREDENTIALS=./gsc-credentials.json
   ```

3. **Deploy**
   - Railway will automatically build and deploy
   - Check the deployment logs for any issues
   - Your app will be available at `https://your-app-name.railway.app`

## Required API Keys Setup

### 1. Claude API Key
- Go to [console.anthropic.com](https://console.anthropic.com)
- Create API key with Claude 3.5 Sonnet access
- Format: `sk-ant-api03-...`

### 2. Notion Integration
- Go to [notion.so/my-integrations](https://notion.so/my-integrations)
- Create new integration
- Copy the integration token (starts with `secret_`)
- Create a database using the schema in `/scripts/setup-notion-database.md`
- Share the database with your integration

### 3. SerpAPI Key
- Sign up at [serpapi.com](https://serpapi.com)
- Get your API key from dashboard
- Free tier: 100 searches/month

### 4. Slack Webhook
- Go to [api.slack.com/apps](https://api.slack.com/apps)
- Create new app → Incoming Webhooks
- Add webhook to desired channel
- Copy webhook URL

## Deployment Verification

Once deployed, test these endpoints:

1. **Health Check**: `https://your-app.railway.app/health`
2. **Claude & Notion**: `https://your-app.railway.app/test-claude-notion` 
3. **SerpAPI**: `https://your-app.railway.app/test-serpapi`
4. **Slack**: `https://your-app.railway.app/test-slack`

## Expected Timeline

- **Build time**: 3-5 minutes
- **First deployment**: 5-10 minutes
- **Health check passing**: Within 2 minutes of successful deploy
- **First content generation**: Within 4 hours (next cron cycle)

## Monitoring

Railway provides:
- **Real-time logs** in the dashboard
- **Metrics** for CPU, memory, network usage
- **Deployments** history and rollback capability
- **Custom domains** for production use

## Troubleshooting

### Common Issues:

1. **Build fails**: Check that all dependencies in package.json are correct
2. **App crashes on start**: Verify all REQUIRED environment variables are set
3. **Health check fails**: Check PORT=8080 is set correctly
4. **No content generated**: Verify Claude API key and Notion integration

### Support
- Railway: [help.railway.app](https://help.railway.app)
- Project logs: Available in Railway dashboard
- Health endpoint: Monitor at `/health`

## Scaling

Railway automatically handles:
- **Auto-scaling** based on traffic
- **Zero-downtime deployments**
- **SSL certificates** 
- **CDN** for static assets

For high-traffic usage, consider upgrading to Railway Pro plan.