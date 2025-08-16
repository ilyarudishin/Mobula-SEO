const { Client } = require('@notionhq/client');
require('dotenv').config();

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

const databaseId = process.env.NOTION_DATABASE_ID;

async function findAndDeleteAllRedditTrash() {
  console.log('🗑️  Finding and deleting ALL Reddit opportunities from Notion...\n');
  
  try {
    // Find all Reddit opportunities in the database
    const response = await notion.databases.query({
      database_id: databaseId,
      filter: {
        property: 'Title',
        title: {
          contains: '🔥 Reddit:'
        }
      }
    });

    console.log(`📊 Found ${response.results.length} Reddit opportunities total`);
    
    if (response.results.length === 0) {
      console.log('✅ No Reddit opportunities found - database is clean!');
      return;
    }
    
    let deletedCount = 0;
    
    for (const page of response.results) {
      try {
        const title = page.properties.Title?.title?.[0]?.text?.content || 'Unknown title';
        
        console.log(`🗑️  Deleting: ${title}`);
        
        // Archive the page
        await notion.pages.update({
          page_id: page.id,
          archived: true
        });
        
        deletedCount++;
        console.log(`   ✅ Archived successfully`);
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error(`   ❌ Failed to delete ${page.id}:`, error.message);
      }
    }
    
    console.log(`\n🎉 Complete! Archived ${deletedCount}/${response.results.length} Reddit opportunities`);
    console.log('\n📍 Your Notion database is now clean of all Reddit opportunities.');
    console.log('📍 The system will only capture genuinely relevant API requests going forward!');
    
  } catch (error) {
    console.error('❌ Error querying Notion:', error.message);
  }
}

findAndDeleteAllRedditTrash().catch(console.error);