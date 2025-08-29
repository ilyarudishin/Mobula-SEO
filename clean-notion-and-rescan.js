const { Client } = require('@notionhq/client');
require('dotenv').config();

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.NOTION_DATABASE_ID;

async function cleanNotionAndRescan() {
  try {
    console.log('🧹 Cleaning Notion of all Reddit entries...\n');
    
    // Get ALL Reddit opportunities from Notion
    const response = await notion.databases.query({
      database_id: databaseId,
      filter: {
        property: 'Type',
        select: {
          equals: 'reddit_response'
        }
      }
    });
    
    console.log(`📊 Found ${response.results.length} Reddit entries to delete`);
    
    // Delete all Reddit entries (both real and fake)
    for (let i = 0; i < response.results.length; i++) {
      const page = response.results[i];
      const title = page.properties.Title?.title[0]?.text?.content || 'Untitled';
      
      try {
        await notion.pages.update({
          page_id: page.id,
          archived: true
        });
        console.log(`   ✅ [${i+1}/${response.results.length}] Deleted: ${title.substring(0, 60)}...`);
      } catch (error) {
        console.log(`   ❌ [${i+1}/${response.results.length}] Failed to delete: ${title.substring(0, 60)}...`);
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log(`\n✅ Cleaned ${response.results.length} Reddit entries from Notion`);
    console.log('🆕 Notion is now ready for fresh, real Reddit opportunities');
    
    console.log('\n🔄 Now triggering comprehensive 1-year Reddit scan...');
    console.log('📝 This will find ONLY real Reddit posts with genuine URLs and engagement data');
    
  } catch (error) {
    console.error('❌ Error cleaning Notion:', error.message);
  }
}

cleanNotionAndRescan();