const { Client } = require('@notionhq/client');
require('dotenv').config();

async function testNotionConnection() {
  try {
    console.log('🔍 Testing Notion API connection...');
    
    if (!process.env.NOTION_API_KEY) {
      throw new Error('NOTION_API_KEY not found in environment');
    }
    
    if (!process.env.NOTION_DATABASE_ID) {
      throw new Error('NOTION_DATABASE_ID not found in environment');
    }
    
    const notion = new Client({ auth: process.env.NOTION_API_KEY });
    
    console.log('✅ Notion client initialized');
    console.log('🔑 API Key loaded (starts with:', process.env.NOTION_API_KEY.substring(0, 10) + '...)');
    console.log('📄 Database ID:', process.env.NOTION_DATABASE_ID.substring(0, 10) + '...');
    
    // Test database access
    const response = await notion.databases.query({
      database_id: process.env.NOTION_DATABASE_ID,
      page_size: 1
    });
    
    console.log('✅ Database query successful');
    console.log('📊 Found', response.results.length, 'pages in database');
    
    if (response.results.length > 0) {
      const firstPage = response.results[0];
      console.log('📄 First page ID:', firstPage.id);
      console.log('📝 First page title:', firstPage.properties.Title?.title[0]?.text?.content || 'No title');
    }
    
    console.log('\n🎉 Notion connection test successful!');
    
  } catch (error) {
    console.error('❌ Notion connection test failed:', error.message);
    
    if (error.code === 'unauthorized') {
      console.error('🔑 API key issue - check if the integration has access to the database');
    } else if (error.code === 'object_not_found') {
      console.error('📄 Database not found - check the database ID');
    } else {
      console.error('🔍 Full error:', error);
    }
  }
}

testNotionConnection();