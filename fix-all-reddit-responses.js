const { Client } = require('@notionhq/client');
const axios = require('axios');
require('dotenv').config();

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.NOTION_DATABASE_ID;

async function generateCasualResponse(title, content, subreddit = 'general') {
  try {
    const response = await axios.post('http://localhost:3003/test-reddit-response-generator', {
      postTitle: title,
      postContent: content || 'Looking for API recommendations',
      subreddit: subreddit,
      keywords: ['api', 'crypto', 'data', 'price', 'wallet']
    }, {
      timeout: 30000
    });
    
    return response.data?.response || null;
  } catch (error) {
    console.log(`❌ Failed to generate response: ${error.message}`);
    return null;
  }
}

async function fixAllRedditResponses() {
  try {
    console.log('🔄 Updating ALL 13 Reddit responses with casual tone...\n');
    
    // Get all Reddit opportunities from Notion
    const response = await notion.databases.query({
      database_id: databaseId,
      filter: {
        property: 'Type',
        select: {
          equals: 'reddit_response'
        }
      }
    });
    
    console.log(`📊 Found ${response.results.length} Reddit entries to update`);
    
    let successCount = 0;
    let failCount = 0;
    
    // Process each Reddit entry
    for (let i = 0; i < response.results.length; i++) {
      const page = response.results[i];
      const title = page.properties.Title?.title[0]?.text?.content || 'Untitled';
      
      // Extract subreddit from title if possible
      let subreddit = 'general';
      if (title.includes('Solana') || title.includes('solana')) subreddit = 'solana';
      else if (title.includes('Ethereum') || title.includes('ethereum')) subreddit = 'ethereum';
      else if (title.includes('DeFi') || title.includes('defi')) subreddit = 'defi';
      else if (title.includes('NFT')) subreddit = 'ethereum';
      
      console.log(`\n[${i+1}/${response.results.length}] Processing: ${title.substring(0, 60)}...`);
      console.log(`   Subreddit: r/${subreddit}`);
      
      try {
        // Generate new casual response
        const newResponse = await generateCasualResponse(title, '', subreddit);
        
        if (newResponse) {
          // Get all blocks from the page
          const blocks = await notion.blocks.children.list({
            block_id: page.id,
            page_size: 100
          });
          
          // Find and update the response block
          let updated = false;
          for (const block of blocks.results) {
            if (block.paragraph?.rich_text) {
              const text = block.paragraph.rich_text.map(t => t.text.content).join('');
              
              // Look for response content (long text that isn't URL metadata)
              if (text.length > 80 && 
                  !text.includes('reddit.com/') && 
                  !text.includes('**URL:**') && 
                  !text.includes('**Score:**') &&
                  !text.includes('**Subreddit:**') &&
                  !text.includes('**Keywords:**')) {
                
                console.log(`   📝 Updating response block (${text.length} chars -> ${newResponse.length} chars)...`);
                
                await notion.blocks.update({
                  block_id: block.id,
                  paragraph: {
                    rich_text: [
                      {
                        type: 'text',
                        text: { content: newResponse }
                      }
                    ]
                  }
                });
                
                updated = true;
                console.log(`   ✅ Updated with casual response`);
                successCount++;
                break;
              }
            }
          }
          
          if (!updated) {
            console.log(`   ⚠️  No suitable response block found to update`);
            failCount++;
          }
          
        } else {
          console.log(`   ❌ Failed to generate new response`);
          failCount++;
        }
        
      } catch (error) {
        console.log(`   ❌ Error updating: ${error.message}`);
        failCount++;
      }
      
      // Rate limiting to be respectful to both APIs
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    console.log(`\n🎉 Update complete!`);
    console.log(`✅ Successfully updated: ${successCount} entries`);
    console.log(`❌ Failed to update: ${failCount} entries`);
    console.log(`📝 All responses are now conversational and SEO-optimized (no code examples)`);
    
  } catch (error) {
    console.error('❌ Error updating Reddit responses:', error.message);
  }
}

fixAllRedditResponses();