const { Client } = require('@notionhq/client');
require('dotenv').config();

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.NOTION_DATABASE_ID;

async function debugNotionStructure() {
  try {
    console.log('🔍 Analyzing Notion Reddit opportunity structure...\n');
    
    // Get all Reddit opportunities
    const response = await notion.databases.query({
      database_id: databaseId,
      filter: {
        property: 'Type',
        select: {
          equals: 'reddit_response'
        }
      },
      page_size: 1  // Just get one to analyze
    });
    
    if (response.results.length === 0) {
      console.log('❌ No Reddit opportunities found');
      return;
    }
    
    const page = response.results[0];
    const title = page.properties.Title?.title[0]?.text?.content || 'Untitled';
    
    console.log(`📄 Analyzing page: ${title}`);
    console.log(`📝 Page ID: ${page.id}\n`);
    
    // Get all blocks from the page
    const blocks = await notion.blocks.children.list({ 
      block_id: page.id,
      page_size: 100 
    });
    
    console.log(`📊 Found ${blocks.results.length} blocks:\n`);
    
    blocks.results.forEach((block, index) => {
      console.log(`[${index + 1}] Block type: ${block.type}`);
      
      if (block.paragraph?.rich_text) {
        const text = block.paragraph.rich_text.map(t => t.text.content).join('');
        console.log(`    Text: "${text.substring(0, 100)}${text.length > 100 ? '...' : ''}"`);
        console.log(`    Length: ${text.length} chars`);
        console.log(`    Block ID: ${block.id}`);
      } else if (block[block.type]?.rich_text) {
        const text = block[block.type].rich_text.map(t => t.text.content).join('');
        console.log(`    Text: "${text.substring(0, 100)}${text.length > 100 ? '...' : ''}"`);
        console.log(`    Length: ${text.length} chars`);
        console.log(`    Block ID: ${block.id}`);
      } else {
        console.log(`    No text content found`);
      }
      
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugNotionStructure();