const { Client } = require('@notionhq/client');
require('dotenv').config();

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.NOTION_DATABASE_ID;

async function checkRedditCount() {
  try {
    console.log('📊 Checking actual Reddit entries in Notion...\n');
    
    const response = await notion.databases.query({
      database_id: databaseId,
      filter: {
        property: 'Type',
        select: {
          equals: 'reddit_response'
        }
      }
    });
    
    console.log(`Found ${response.results.length} Reddit entries in Notion:`);
    
    for (let i = 0; i < response.results.length; i++) {
      const page = response.results[i];
      const title = page.properties.Title?.title[0]?.text?.content || 'Untitled';
      console.log(`${i + 1}. ${title}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkRedditCount();