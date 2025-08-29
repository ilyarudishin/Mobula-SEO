const { Client } = require('@notionhq/client');
require('dotenv').config();

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.NOTION_DATABASE_ID;

async function checkRedditUrls() {
  try {
    console.log('🔍 Checking Reddit URLs in Notion...\n');
    
    // Get all Reddit opportunities
    const response = await notion.databases.query({
      database_id: databaseId,
      filter: {
        property: 'Type',
        select: {
          equals: 'reddit_response'
        }
      }
    });
    
    console.log(`📊 Found ${response.results.length} Reddit opportunities\n`);
    
    for (let i = 0; i < response.results.length; i++) {
      const page = response.results[i];
      const title = page.properties.Title?.title[0]?.text?.content || 'Untitled';
      
      console.log(`[${i+1}] ${title}`);
      
      // Get page content to find URLs
      const blocks = await notion.blocks.children.list({ 
        block_id: page.id,
        page_size: 100 
      });
      
      let foundUrls = [];
      
      for (const block of blocks.results) {
        if (block.paragraph?.rich_text) {
          const text = block.paragraph.rich_text.map(t => t.text.content).join('');
          
          // Look for Reddit URLs
          const urlMatches = text.match(/https?:\/\/reddit\.com\/[^\s\)]+/g);
          if (urlMatches) {
            foundUrls.push(...urlMatches);
          }
          
          // Also check for markdown links
          const markdownMatches = text.match(/\[.*?\]\((https?:\/\/reddit\.com\/[^\)]+)\)/g);
          if (markdownMatches) {
            markdownMatches.forEach(match => {
              const url = match.match(/\((https?:\/\/[^\)]+)\)/)?.[1];
              if (url) foundUrls.push(url);
            });
          }
        }
      }
      
      // Remove duplicates
      foundUrls = [...new Set(foundUrls)];
      
      if (foundUrls.length > 0) {
        console.log(`   📎 URLs found: ${foundUrls.length}`);
        foundUrls.forEach(url => {
          // Check if URL looks fake (like our manual examples)
          if (url.includes('/comments/example') || url.includes('comments/1m') === false) {
            console.log(`   ❌ FAKE: ${url}`);
          } else {
            console.log(`   ✅ REAL: ${url}`);
          }
        });
      } else {
        console.log(`   ⚠️  No URLs found`);
      }
      
      console.log('');
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkRedditUrls();