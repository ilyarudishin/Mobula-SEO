# Notion Database Setup for Mobula SEO Agent

## Required Notion Database Schema

Create a new database in Notion with the following properties:

### Database Name: "SEO Opportunities & Content"

### Properties:
1. **Title** (Title) - Content title
2. **Type** (Select) - Options:
   - blog_article
   - reddit_response  
   - outreach_email
   - technical_guide
   - backlink_opportunity
   - weekly_report

3. **Priority Score** (Number) - 0-100 priority score
4. **Status** (Select) - Options:
   - identified
   - generated
   - ready_to_publish
   - published

5. **Target Keywords** (Multi-select) - Keywords this content targets
6. **Competition Difficulty** (Number) - 0-100 difficulty score
7. **Traffic Potential** (Number) - Estimated traffic potential
8. **Generated At** (Date) - When content was generated
9. **Published At** (Date) - When content was published
10. **Quality Score** (Number) - Content quality score 0-100
11. **Word Count** (Number) - Content word count
12. **Impressions** (Number) - Search impressions (updated from GSC)
13. **Clicks** (Number) - Search clicks (updated from GSC)
14. **Avg Position** (Number) - Average search position
15. **Backlinks** (Number) - Number of backlinks earned

## Setup Instructions:

1. Go to Notion.so
2. Create a new database
3. Add all properties listed above with correct types
4. Copy the database ID from the URL
5. Set NOTION_DATABASE_ID environment variable
6. Get your Notion integration token:
   - Go to https://www.notion.so/my-integrations
   - Create new integration for "Mobula SEO Agent"
   - Copy the token
   - Set NOTION_API_KEY environment variable
7. Share the database with your integration

## Environment Variables Required:
```
NOTION_API_KEY=secret_xxxxx
NOTION_DATABASE_ID=xxxxx-xxxx-xxxx-xxxx-xxxx
```

The agent will automatically create pages in this database with all the generated content ready for review and publication.