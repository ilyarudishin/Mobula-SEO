const { Client } = require('@notionhq/client');
require('dotenv').config();

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

const databaseId = process.env.NOTION_DATABASE_ID;

// The 9 irrelevant Reddit opportunities that need to be deleted
const irrelevantPostIds = [
  "2502083f-da3e-8150-a175-f51ba1b2ec6e", // Step Wallet Just Dropped on Solana
  "2502083f-da3e-817d-86ee-f170aa547a4c", // Forget Wall Street, Ethereum is where the real action is
  "2502083f-da3e-817e-b950-e32c71282f66", // It's crazy how quickly the narrative changes in Solana
  "2502083f-da3e-81e0-8660-efadae3659ee", // Just got the Solana SEEKER UK
  "2502083f-da3e-813e-8c42-fe7788a8e571", // What programming languages do you use alongside Solidity?
  "2502083f-da3e-81ba-bf7a-d2915634be11", // Where can i find latest web 3 projects?
  "2502083f-da3e-8181-b5e0-d57bce7ef22a", // Feedback wanted - seeking smart‑contract developers to beta test
  "2502083f-da3e-81ed-ac5c-daa18152d9ce", // Ethereum VS Solana | Data on Wallets, Transactions, Fees, TVL and Marketcap
  "2502083f-da3e-81d2-993b-fc11b8c06b75"  // The 3-slope interest model: why Pike thinks it's better than the usual 2-step curve
];

async function deleteIrrelevantRedditOpportunities() {
  console.log('🗑️  Deleting 9 irrelevant Reddit opportunities from Notion...\n');
  
  let deletedCount = 0;
  
  for (const pageId of irrelevantPostIds) {
    try {
      // First, let's get the page title to confirm what we're deleting
      const page = await notion.pages.retrieve({ page_id: pageId });
      const title = page.properties.Title?.title?.[0]?.text?.content || 'Unknown title';
      
      console.log(`🗑️  Deleting: ${title}`);
      
      // Archive the page (Notion doesn't allow permanent deletion via API)
      await notion.pages.update({
        page_id: pageId,
        archived: true
      });
      
      deletedCount++;
      console.log(`   ✅ Archived successfully`);
      
      // Rate limiting to be respectful
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.error(`   ❌ Failed to delete ${pageId}:`, error.message);
    }
  }
  
  console.log(`\n🎉 Complete! Archived ${deletedCount}/${irrelevantPostIds.length} irrelevant Reddit opportunities`);
  console.log('\n📍 These were promotional/discussion posts that don\'t match Mobula\'s API services.');
  console.log('📍 The system is now ready to capture only relevant API/data requests!');
}

deleteIrrelevantRedditOpportunities().catch(console.error);