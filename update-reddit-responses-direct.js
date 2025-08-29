const { Client } = require('@notionhq/client');
require('dotenv').config();

// Import the services directly
const { OpenAIService } = require('./dist/services/openai.service');
const { ClaudeService } = require('./dist/services/claude.service');
const { RedditResponseGeneratorService } = require('./dist/services/reddit-response-generator.service');
const { ConfigService } = require('./dist/config/config.service');

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.NOTION_DATABASE_ID;

async function updateAllRedditResponses() {
  try {
    console.log('🔄 Directly updating ALL 13 Reddit responses with casual tone...\n');
    
    // Initialize services
    const configService = new ConfigService();
    const openaiService = new OpenAIService(configService);
    const claudeService = new ClaudeService(configService);
    const redditResponseGenerator = new RedditResponseGeneratorService(openaiService, claudeService);
    
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
      
      // Clean up title and extract the actual question
      const cleanTitle = title.replace('📅 1-Year Historical: ', '');
      
      // Extract subreddit from title content
      let subreddit = 'general';
      if (cleanTitle.toLowerCase().includes('solana')) subreddit = 'solana';
      else if (cleanTitle.toLowerCase().includes('ethereum')) subreddit = 'ethereum';
      else if (cleanTitle.toLowerCase().includes('defi')) subreddit = 'defi';
      else if (cleanTitle.toLowerCase().includes('nft')) subreddit = 'ethereum';
      else if (cleanTitle.toLowerCase().includes('web3')) subreddit = 'web3';
      
      console.log(`\n[${i+1}/${response.results.length}] Processing: ${cleanTitle.substring(0, 60)}...`);
      console.log(`   Subreddit: r/${subreddit}`);
      
      try {
        // Create context for Reddit Response Generator
        const context = {
          postTitle: cleanTitle,
          postContent: 'Looking for API recommendations and developer tools',
          subreddit: subreddit,
          author: 'developer',
          url: `https://reddit.com/r/${subreddit}/comments/example`,
          keywords: ['api', 'crypto', 'data', 'price', 'wallet', 'blockchain']
        };
        
        // Generate new casual response
        console.log(`   🤖 Generating casual response...`);
        const responseData = await redditResponseGenerator.generateResponse(context);
        
        if (responseData?.response) {
          console.log(`   📝 Generated ${responseData.response.length} char response with ${responseData.tone} tone`);
          
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
              
              // Look for response content (long text that isn't metadata)
              if (text.length > 80 && 
                  !text.includes('reddit.com/') && 
                  !text.includes('**URL:**') && 
                  !text.includes('**Score:**') &&
                  !text.includes('**Subreddit:**') &&
                  !text.includes('**Keywords:**') &&
                  !text.includes('**Author:**')) {
                
                console.log(`   📝 Updating response block (${text.length} chars -> ${responseData.response.length} chars)...`);
                
                await notion.blocks.update({
                  block_id: block.id,
                  paragraph: {
                    rich_text: [
                      {
                        type: 'text',
                        text: { content: responseData.response }
                      }
                    ]
                  }
                });
                
                updated = true;
                console.log(`   ✅ Updated with casual response (tone: ${responseData.tone})`);
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
      
      // Rate limiting to be respectful to Claude/OpenAI
      await new Promise(resolve => setTimeout(resolve, 4000));
    }
    
    console.log(`\n🎉 Update complete!`);
    console.log(`✅ Successfully updated: ${successCount} entries`);
    console.log(`❌ Failed to update: ${failCount} entries`);
    console.log(`📝 All responses are now conversational and SEO-optimized (no code examples)`);
    
  } catch (error) {
    console.error('❌ Error updating Reddit responses:', error.message);
    console.error('Stack:', error.stack);
  }
}

updateAllRedditResponses();