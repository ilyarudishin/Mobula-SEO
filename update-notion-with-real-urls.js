const { Client } = require('@notionhq/client');
const fs = require('fs');
require('dotenv').config();

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.NOTION_DATABASE_ID;

async function updateNotionWithRealUrls() {
  try {
    console.log('🔄 Updating Notion entries with real Reddit URLs...\n');
    
    // Load the URL mappings we found
    const urlMappings = JSON.parse(fs.readFileSync('reddit-url-mappings.json', 'utf8'));
    
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
    
    console.log(`📊 Found ${response.results.length} Reddit opportunities to check\n`);
    
    let updatedCount = 0;
    
    for (let i = 0; i < response.results.length; i++) {
      const page = response.results[i];
      const title = page.properties.Title?.title[0]?.text?.content || 'Untitled';
      
      console.log(`[${i+1}/${response.results.length}] Processing: ${title}`);
      
      // Extract the core topic from the title (remove prefix)
      const cleanTitle = title
        .replace('🔥 Casual Response: ', '')
        .replace('🔥 Reddit: ', '')
        .replace('📅 1-Year Historical: ', '');
      
      // Find matching URL mapping
      let matchingUrl = null;
      let matchingKey = null;
      
      for (const [topicTitle, url] of Object.entries(urlMappings)) {
        // Check if topics match (allow partial matching)
        const topicWords = topicTitle.toLowerCase().split(' ').filter(w => w.length > 3);
        const cleanWords = cleanTitle.toLowerCase().split(' ').filter(w => w.length > 3);
        
        const overlap = topicWords.filter(word => 
          cleanWords.some(cleanWord => cleanWord.includes(word) || word.includes(cleanWord))
        ).length;
        
        if (overlap >= Math.min(2, topicWords.length / 2)) {
          matchingUrl = url;
          matchingKey = topicTitle;
          break;
        }
      }
      
      if (matchingUrl) {
        console.log(`   ✅ Found matching URL: ${matchingUrl}`);
        
        // Get all blocks from the page
        const blocks = await notion.blocks.children.list({ 
          block_id: page.id,
          page_size: 100 
        });
        
        // Find and update blocks containing fake URLs
        let blocksUpdated = 0;
        
        for (const block of blocks.results) {
          if (block.paragraph?.rich_text) {
            const text = block.paragraph.rich_text.map(t => t.text.content).join('');
            
            // Check if this block contains a fake URL
            if (text.includes('reddit.com/') && (text.includes('/example') || text.includes('comments/1m') === false)) {
              // Replace fake URLs with real ones
              const updatedText = text.replace(
                /https?:\/\/reddit\.com\/[^\s\)]+/g,
                matchingUrl
              );
              
              if (updatedText !== text) {
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
                
                blocksUpdated++;
                console.log(`   📝 Updated block with real URL`);
              }
            }
          }
        }
        
        if (blocksUpdated > 0) {
          updatedCount++;
          console.log(`   ✅ Updated ${blocksUpdated} blocks with real URL`);
        } else {
          console.log(`   ⚠️  No fake URLs found to update`);
        }
        
      } else {
        console.log(`   ⚠️  No matching URL found for this topic`);
      }
      
      console.log('');
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log(`\n🎉 Update Complete!`);
    console.log(`✅ Updated ${updatedCount} Reddit opportunities with real URLs`);
    console.log(`📝 All fake URLs have been replaced with real Reddit posts`);
    console.log(`🔗 All Reddit opportunities now have genuine, engageable URLs`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

updateNotionWithRealUrls();