# 🚀 Mobula SEO Agent Deployment Guide

## Current Status: ✅ READY TO DEPLOY

The autonomous SEO execution agent is fully built and ready for production deployment. Here's what's been implemented:

### ✅ Core Systems Built:
- **SEO Orchestrator**: Main execution brain with cron scheduling
- **Content Generator**: Claude 3.5 integration for high-quality content
- **Notion Integration**: Automated content storage and management
- **Slack Notifications**: Real-time execution alerts
- **SERP Analysis**: Keyword research and competitor monitoring
- **Reddit Discovery**: Community engagement opportunity detection
- **Blog Outreach**: Broken link and guest post opportunity finder
- **Social Listening**: Multi-platform mention monitoring (Twitter, HackerNews, GitHub, LinkedIn)
- **Health Monitoring**: System health checks and error handling

### ✅ Autonomous Execution Schedule:
- **Monday & Thursday 9 AM**: Main content generation (3-5 pieces)
- **Every 4 hours**: Continuous monitoring for urgent opportunities  
- **Every 2 hours**: Reddit opportunity discovery and response generation
- **Daily 10 AM**: Blog outreach opportunity scanning (broken links, guest posts)
- **Every 6 hours**: Social media listening across all platforms
- **Daily 6 AM**: Health check and API verification
- **Sunday 6 PM**: Weekly execution report

## Immediate Deployment Steps

### 1. Set Up APIs (30 minutes)

#### Claude API
1. Go to https://console.anthropic.com/
2. Create API key
3. Fund account (recommended: $100+ for continuous operation)
4. Copy key → `CLAUDE_API_KEY`

#### Notion Database  
1. Create new Notion database using `/scripts/setup-notion-database.md`
2. Create integration at https://www.notion.so/my-integrations
3. Share database with integration
4. Copy API key → `NOTION_API_KEY`
5. Copy database ID from URL → `NOTION_DATABASE_ID`

#### Slack Webhook
1. Go to https://api.slack.com/apps
2. Create new app → Incoming Webhooks
3. Activate and create webhook for desired channel
4. Copy webhook URL → `SLACK_WEBHOOK_URL`

#### SerpAPI (Optional but Recommended)
1. Sign up at https://serpapi.com/
2. Get free 100 searches/month API key
3. Copy key → `SERPAPI_KEY`

### 2. Deploy to Railway (15 minutes)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and initialize
railway login
railway init

# Set environment variables in Railway dashboard
railway open
```

**Required Environment Variables:**
```
CLAUDE_API_KEY=your_actual_key
NOTION_API_KEY=your_actual_key  
NOTION_DATABASE_ID=your_actual_db_id
SLACK_WEBHOOK_URL=your_actual_webhook
SERPAPI_KEY=your_actual_key
TARGET_DOMAIN=mobula.io
NODE_ENV=production
PORT=8080
```

**Deploy:**
```bash
railway up
```

### 3. Verify Autonomous Operation (15 minutes)

#### Check Logs:
```bash
railway logs --tail
```

**Expected logs:**
```
🚀 Mobula SEO Agent is running on port 8080
🤖 Autonomous SEO execution is ACTIVE
[SeoOrchestratorService] Content generation scheduled for Monday & Thursday 9 AM
[SeoOrchestratorService] Continuous monitoring active every 4 hours
```

#### Test Health Check:
```bash
curl https://your-app.railway.app/health
```

**Expected response:**
```json
{"status":"ok","timestamp":"2025-08-11T17:53:38.771Z","service":"mobula-seo-agent"}
```

#### Verify Slack Integration:
- Health check notification should appear in your Slack channel
- Weekly report notification scheduled

## Post-Deployment: What Happens Next

### First 4 Hours:
- Agent starts continuous monitoring
- Identifies initial opportunities
- May generate urgent content if high-priority opportunities found

### First Week:
- **Monday 9 AM**: First scheduled content generation (3-5 pieces)
- **Thursday 9 AM**: Second content generation cycle
- **Sunday 6 PM**: First weekly report

### Expected Notion Output:
- 3-5 high-quality content pieces per week
- Each piece saved with:
  - Full content ready to publish
  - SEO-optimized titles and meta descriptions
  - Target keywords and difficulty scores
  - Quality scores (typically 80+/100)

## Monitoring & Maintenance

### Daily Monitoring:
- Check Slack for execution notifications
- Review Notion for new content
- Verify Railway logs for any errors

### Weekly Tasks:
- Review and publish content from Notion
- Monitor SEO performance improvements
- Adjust keywords if needed in `seo-orchestrator.service.ts`

### Monthly Optimization:
- Review content quality and performance
- Adjust Claude prompts if needed
- Scale up/down based on results

## Troubleshooting

### No Content Generated:
1. Check Railway logs for errors
2. Verify Claude API credits
3. Check Notion database permissions
4. Ensure SerpAPI key is valid

### Content Quality Issues:
1. Review generated content in Notion
2. Adjust prompts in `claude.service.ts`
3. Modify quality scoring algorithm

### API Errors:
1. Check API key validity and credits
2. Review rate limiting in logs
3. Verify environment variables

## Cost Estimate

**Monthly Operating Costs:**
- **Railway Hosting**: $5-20/month (depending on usage)
- **Claude API**: $50-200/month (for continuous content generation)
- **SerpAPI**: Free tier (100 searches/month) or $50/month
- **Notion & Slack**: Free

**Total**: ~$60-270/month for fully autonomous SEO execution

## Success Metrics (Track Weekly)

### Execution Metrics:
- Content pieces generated: Target 3-5/week
- Average quality score: Target 80+/100
- System uptime: Target 99%+
- Opportunity conversion rate: Target 60%+

### SEO Impact (Track Monthly):
- Keyword ranking improvements
- Organic traffic growth from published content
- Backlinks earned from outreach
- Competitor gap closure

---

## 🎉 Your Autonomous SEO Agent is Ready!

**The agent is now a fully autonomous SEO professional that:**
- ✅ Identifies opportunities 24/7
- ✅ Creates high-quality content automatically
- ✅ Monitors competitors and responds immediately  
- ✅ Generates everything ready for publication
- ✅ Reports on execution weekly

**All you need to do is:**
1. Review content in Notion
2. Publish approved content
3. Monitor results and ROI

**The agent handles everything else autonomously!**