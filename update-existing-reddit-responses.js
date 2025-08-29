const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./dist/app.module');

async function updateExistingRedditResponses() {
  try {
    console.log('🔄 Updating existing Reddit opportunities with new casual responses...');
    console.log('📋 Will preserve all metadata, only update response text\n');
    
    const app = await NestFactory.createApplicationContext(AppModule);
    const notionService = app.get('NotionService');
    const redditResponseGenerator = app.get('RedditResponseGeneratorService');
    
    // Get all Reddit opportunities from Notion
    console.log('📥 Fetching existing Reddit opportunities from Notion...');
    const opportunities = await notionService.getOpportunitiesByType('reddit_response');
    
    if (opportunities.length === 0) {
      console.log('❌ No Reddit opportunities found in Notion');
      await app.close();
      return;
    }
    
    console.log(`🎯 Found ${opportunities.length} Reddit opportunities to update`);
    
    let updatedCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < opportunities.length; i++) {
      const opportunity = opportunities[i];
      const title = opportunity.properties.Title?.title[0]?.text?.content || 'Untitled';
      
      try {
        console.log(`\n📝 [${i+1}/${opportunities.length}] Updating: ${title.substring(0, 60)}...`);
        
        // Get the current page content to extract Reddit metadata
        const blocks = await notionService.notion.blocks.children.list({ 
          block_id: opportunity.id 
        });
        
        // Find the Reddit metadata (URL, subreddit, author, etc.)
        let redditUrl = '';
        let subreddit = '';
        let author = '';
        let postTitle = title.replace('🔥 Historical Reddit: ', '').replace('📅 Historical Reddit: ', '');
        
        for (const block of blocks.results) {
          if (block.paragraph?.rich_text) {
            const text = block.paragraph.rich_text.map(t => t.text.content).join('');
            if (text.includes('**URL:**') || text.includes('reddit.com')) {
              const urlMatch = text.match(/https:\/\/reddit\.com\/r\/(\w+)\/comments\/[\w]+/);
              if (urlMatch) {
                redditUrl = urlMatch[0];
                subreddit = urlMatch[1];
              }
              const authorMatch = text.match(/\*\*Author:\*\* (\w+)/);
              if (authorMatch) {
                author = authorMatch[1];
              }
            }
          }
        }
        
        if (!redditUrl || !subreddit) {
          console.log(`   ⚠️  Skipping - no Reddit URL found`);
          continue;
        }
        
        // Generate new casual response
        const redditContext = {
          postTitle: postTitle,
          postContent: '', // We don't have the original post content
          subreddit: subreddit,
          author: author || 'unknown',
          url: redditUrl,
          keywords: ['api', 'crypto', 'blockchain'], // Generic keywords for existing posts
        };
        
        console.log(`   🤖 Generating casual response for r/${subreddit}...`);
        const newResponse = await redditResponseGenerator.generateResponse(redditContext);
        
        // Find and update only the response section
        let responseBlockId = null;
        let foundResponseHeader = false;
        
        for (const block of blocks.results) {
          if (block.paragraph?.rich_text) {
            const text = block.paragraph.rich_text.map(t => t.text.content).join('');
            if (text.includes('CONVERSATIONAL RESPONSE') || text.includes('AI-GENERATED RESPONSE')) {
              foundResponseHeader = true;
              continue;
            }
            if (foundResponseHeader && !text.includes('**') && text.length > 50) {
              responseBlockId = block.id;
              break;
            }
          }
        }
        
        if (responseBlockId) {
          // Update the response block with new casual content
          await notionService.notion.blocks.update({
            block_id: responseBlockId,
            paragraph: {
              rich_text: [{
                type: 'text',
                text: {
                  content: newResponse.response
                }
              }]
            }
          });
          
          updatedCount++;
          console.log(`   ✅ Updated response (${newResponse.response.length} chars, ${newResponse.tone} tone)`);
        } else {
          console.log(`   ⚠️  Could not find response block to update`);
        }
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        errorCount++;
        console.error(`   ❌ Error updating ${title.substring(0, 40)}: ${error.message}`);
      }
    }
    
    console.log(`\n🎉 Reddit Response Update Complete!`);
    console.log(`✅ Successfully updated: ${updatedCount}/${opportunities.length} responses`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`🗣️  All responses now use casual, conversational tone`);
    console.log(`📝 All metadata preserved (URLs, authors, scores, etc.)`);
    
    await app.close();
    
  } catch (error) {
    console.error('❌ Fatal error updating Reddit responses:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

updateExistingRedditResponses();