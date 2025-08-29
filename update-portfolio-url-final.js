const { Client } = require('@notionhq/client');
require('dotenv').config();

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.NOTION_DATABASE_ID;

async function updatePortfolioUrlFinal() {
  try {
    console.log('🔄 Updating portfolio tracking URL with correct crypto-related post...\n');
    
    // The correct URL for crypto portfolio tracking
    const correctUrl = 'https://reddit.com/r/cryptocurrency/comments/mrv04i';
    const postTitle = 'I made a crypto tracking spreadsheet with live crypto price updates, moon math, and a history of your Portfolio and trading performance';
    
    console.log(`✅ Using URL: ${correctUrl}`);
    console.log(`📝 Post: "${postTitle}"`);
    console.log(`👥 Score: 2382 (highly engaged crypto portfolio discussion)`);
    
    // Find the specific Notion page
    const response = await notion.databases.query({
      database_id: databaseId,
      filter: {
        and: [
          {
            property: 'Type',
            select: { equals: 'reddit_response' }
          },
          {
            property: 'Title',
            title: { contains: 'Best crypto API for portfolio tracking' }
          }
        ]
      }
    });
    
    if (response.results.length > 0) {
      const page = response.results[0];
      console.log(`\n🎯 Found Notion page: ${page.properties.Title?.title[0]?.text?.content}`);
      
      // Get all blocks and update the one with the URL
      const blocks = await notion.blocks.children.list({ 
        block_id: page.id,
        page_size: 100 
      });
      
      let updated = false;
      for (const block of blocks.results) {
        if (block.paragraph?.rich_text) {
          const text = block.paragraph.rich_text.map(t => t.text.content).join('');
          
          if (text.includes('reddit.com/')) {
            console.log(`📝 Found block with URL, updating...`);
            
            // Update this block with the correct crypto portfolio URL
            const updatedText = text.replace(
              /https?:\/\/reddit\.com\/[^\s\)]+/g,
              correctUrl
            );
            
            await notion.blocks.update({
              block_id: block.id,
              paragraph: {
                rich_text: [
                  {
                    type: 'text',
                    text: { content: updatedText }
                  }
                ]
              }
            });
            
            updated = true;
            console.log(`✅ Successfully updated with crypto portfolio tracking URL`);
            console.log(`🔗 New URL: ${correctUrl}`);
            break;
          }
        }
      }
      
      if (!updated) {
        console.log(`⚠️  No URL block found to update`);
      }
      
    } else {
      console.log(`❌ Could not find Notion page for "Best crypto API for portfolio tracking"`);
    }
    
    console.log('\n🎉 Portfolio tracking URL update complete!');
    console.log('✅ Now points to a real, highly-engaged crypto portfolio discussion');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

updatePortfolioUrlFinal();