# 🤖 Mobula SEO Autonomous Execution Agent

**This agent EXECUTES SEO strategies, it doesn't suggest them. It's designed to run 24/7, continuously identifying opportunities and CREATING content to capitalize on them.**

## What This Agent Actually DOES (Not "Recommends")

✅ **EXECUTES Continuously:**
- **Generates 3-5 high-quality content pieces per week** → Saves to Notion ready to publish
- **Monitors 15+ core keywords** → Creates content when opportunities arise  
- **Tracks competitors daily** → Generates counter-content when they make moves
- **Identifies trending topics** → Writes articles about them immediately
- **Finds broken link opportunities** → Creates replacement content + outreach emails
- **Discovers Reddit opportunities** → Crafts helpful responses ready to post

✅ **AUTONOMOUS EXECUTION SCHEDULE:**
- **Monday & Thursday 9 AM**: Main content generation (3-5 pieces)
- **Every 4 hours**: Continuous monitoring and urgent opportunity execution
- **Daily 6 AM**: Health check and system verification
- **Sunday 6 PM**: Weekly execution report

## Core Philosophy: EXECUTOR, NOT ADVISOR

❌ **What typical SEO tools do:**
- "Found 50 keyword opportunities" 
- "Competitor X is ranking well"
- "Consider writing about Y topic"

✅ **What THIS agent does:**
- "Generated 5 articles about keyword opportunities → Ready in Notion"
- "Competitor X ranking well → Created counter-article → Ready in Notion" 
- "Trending topic identified → Wrote comprehensive guide → Ready in Notion"

## Tech Stack

- **Backend**: TypeScript + NestJS
- **Deployment**: Railway.com  
- **Content AI**: Claude 3.5 Sonnet
- **Content Storage**: Notion (as CMS)
- **Notifications**: Slack
- **SEO Data**: SerpAPI + DataForSEO
- **Monitoring**: 24/7 cron jobs

## Quick Start (8-Hour MVP Deployment)

### Hour 1-2: Setup & Dependencies
```bash
git clone <this-repo>
cd mobula-seo-agent
npm install
```

### Hour 3-4: Configure APIs
1. **Claude API**: Get key from Anthropic
2. **Notion**: Create database using `/scripts/setup-notion-database.md`
3. **Slack**: Create webhook URL
4. **SerpAPI**: Get free API key
5. **Set environment variables** (see `.env.example`)

### Hour 5-6: Deploy to Railway
```bash
./scripts/deploy.sh
```

### Hour 7-8: Verify Autonomous Operation
- Check Railway logs for cron job execution
- Verify Notion database receives content
- Confirm Slack notifications work
- Agent should generate first content within 4 hours

## Environment Variables Required

```bash
# AI & Content
CLAUDE_API_KEY=your_claude_key
NOTION_API_KEY=your_notion_key
NOTION_DATABASE_ID=your_database_id

# SEO Data
SERPAPI_KEY=your_serpapi_key
DATAFORSEO_LOGIN=your_login  # Optional
DATAFORSEO_PASSWORD=your_password  # Optional

# Notifications  
SLACK_WEBHOOK_URL=your_slack_webhook

# App Config
TARGET_DOMAIN=mobula.io
NODE_ENV=production
PORT=8080
```

## Autonomous Execution Overview

### Content Generation Strategy (REALISTIC)
- **Quality over Quantity**: 3-5 pieces/week, not 50 pieces/week
- **High-Impact Focus**: Only pursues opportunities with 60+ scores
- **Value-First Content**: Educational, not promotional
- **Technical Depth**: Includes working code examples and real data

### What Agent CAN Do Autonomously:
✅ Generate any type of content and save to Notion  
✅ Research keywords and opportunities 24/7  
✅ Track rankings and competitor movements  
✅ Create optimized meta descriptions, titles, headers  
✅ Generate outreach emails and Reddit responses  
✅ Analyze technical SEO issues  
✅ Track and report on all metrics  

### What Requires Human Action:
❌ Publishing to website (requires CMS access)  
❌ Sending emails (requires email client)  
❌ Posting to Reddit (requires human account)  
❌ Submitting guest posts (requires relationships)  

**Solution**: Agent prepares everything in Notion. Human reviews and clicks "publish/send/post" - that's it.

## Monitoring & Alerts

### Slack Notifications:
- ✅ Content generated and ready for review
- 🎯 High-priority opportunities identified  
- 👀 Competitor activity detected
- 📊 Weekly execution reports
- 🚨 Error alerts and system issues

### Railway Logs:
- Real-time execution tracking
- API call monitoring
- Error debugging
- Performance metrics

## Expected Results Timeline

### Week 1:
- Agent deployed and executing
- 3-5 pieces of content generated
- Notion database populated
- Slack notifications active

### Month 1: 
- 15-20 high-quality content pieces ready
- Competitor monitoring showing gaps filled
- SEO opportunities being executed consistently

### Month 3:
- Content ranking improvements visible
- Automated backlink outreach emails sent
- Comprehensive competitor intelligence
- Proven ROI from autonomous execution

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  SEO            │    │  Content        │    │  Notion         │
│  Orchestrator   │───►│  Generator      │───►│  Storage        │
│  (Brain)        │    │  (Claude)       │    │  (CMS)          │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  SERP           │    │  Competitor     │    │  Slack          │
│  Monitor        │    │  Intelligence   │    │  Notifications  │
│  (SerpAPI)      │    │  (Multi-source) │    │  (Alerts)       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Development

### Local Development
```bash
# Development mode
npm run start:dev

# Build and run production
npm run build
npm run start:prod

# Run tests
npm run test
```

### Testing Autonomous Execution
```bash
# Test content generation
curl http://localhost:8080/health

# Check Railway logs
railway logs --tail

# Monitor Slack notifications
# Check your configured Slack channel
```

## Success Metrics

### Execution Metrics (What Agent DOES):
- Content pieces generated per week: **3-5**
- Average content quality score: **80+/100**
- Opportunities converted to content: **60%+**
- System uptime: **99%+**

### SEO Impact Metrics (Results from execution):
- Keyword ranking improvements
- Organic traffic growth
- Backlink acquisition rate  
- Competitor gap closure

## Troubleshooting

### Agent Not Generating Content:
1. Check Railway logs for cron job execution
2. Verify Claude API key and credits
3. Check Notion database permissions
4. Ensure SerpAPI key is valid

### Content Quality Issues:
1. Review Claude prompts in `claude.service.ts`
2. Adjust quality scoring algorithm
3. Check competitor analysis data quality

### Deployment Issues:
1. Verify all environment variables set
2. Check Railway service status
3. Review build logs in Railway dashboard

## Contributing

This agent is designed to be:
- **Autonomous**: Minimal human intervention required
- **Quality-Focused**: Better to create 5 great pieces than 50 poor ones  
- **Execution-Oriented**: Does work, doesn't create work lists
- **Value-First**: Educates audience, mentions product naturally

## License

MIT License - Build something amazing!

---

**Remember: This agent is a DOER, not a SUGGESTER. It should spend 90% of its time CREATING content and 10% deciding what to create next.**