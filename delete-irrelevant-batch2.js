const { Client } = require('@notionhq/client');
require('dotenv').config();

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

// The 7 irrelevant opportunities that need to be deleted
const irrelevantPostIds = [
  "2502083f-da3e-81b4-9e4a-e55140d25b48", // Using gRPC to fetch market data
  "2502083f-da3e-819e-be2b-f074bdb6aabc", // Guide: Ethereum Node Types Explained
  "2502083f-da3e-81cb-806c-e12b6be1f40f", // If Ethereum is getting more scarce how will the transactions work?
  "2502083f-da3e-819a-a53a-dd120e954683", // Anza - Alpenglow: A New Consensus For Solana
  "2502083f-da3e-8109-8954-f59047019d07", // Oracle manipulation is real
  "2502083f-da3e-81a9-89e6-e79b4c2b9530", // How can I get my transaction into the same block
  "2502083f-da3e-8144-9bc2-fedc1eb7792c"  // Guide: Ethereum Node Types Explained (duplicate)
];

async function deleteIrrelevantBatch2() {
  console.log('🗑️  Deleting 7 more irrelevant Reddit opportunities from Notion...\n');
  
  let deletedCount = 0;
  
  for (const pageId of irrelevantPostIds) {
    try {
      // Archive the page
      await notion.pages.update({
        page_id: pageId,
        archived: true
      });
      
      deletedCount++;
      console.log(`   ✅ Archived ${pageId}`);
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.error(`   ❌ Failed to delete ${pageId}:`, error.message);
    }
  }
  
  console.log(`\n🎉 Complete! Archived ${deletedCount}/${irrelevantPostIds.length} irrelevant Reddit opportunities`);
  console.log('\n📍 These were NOT genuine API requests matching Mobula\'s services.');
}

deleteIrrelevantBatch2().catch(console.error);