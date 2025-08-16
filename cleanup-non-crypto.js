const { Client } = require('@notionhq/client');
require('dotenv').config();

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

const databaseId = process.env.NOTION_DATABASE_ID;

async function cleanupNonCrypto() {
  console.log('🗑️  Finding and deleting non-crypto opportunities from 6-month scan...\n');
  
  try {
    // Find opportunities with non-crypto terms
    const response = await notion.databases.query({
      database_id: databaseId,
      filter: {
        or: [
          {
            property: 'Title',
            title: {
              contains: 'WhatsApp'
            }
          },
          {
            property: 'Title', 
            title: {
              contains: 'Telegram'
            }
          },
          {
            property: 'Title',
            title: {
              contains: 'Discord'
            }
          }
        ]
      }
    });

    console.log(`📊 Found ${response.results.length} non-crypto opportunities to clean up`);
    
    if (response.results.length === 0) {
      console.log('✅ No non-crypto opportunities found - database is clean!');
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
    
    console.log(`\n🎉 Complete! Archived ${deletedCount}/${response.results.length} non-crypto opportunities`);
    console.log('\n📍 Your Notion database now only contains crypto/blockchain API requests!');
    
  } catch (error) {
    console.error('❌ Error querying Notion:', error.message);
  }
}

cleanupNonCrypto().catch(console.error);