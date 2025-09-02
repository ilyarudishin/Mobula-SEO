const axios = require('axios');
require('dotenv').config();

const NOTION_TOKEN = process.env.NOTION_API_KEY;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;

async function removeFakeEstimatedData() {
  console.log('🗑️  REMOVING ALL FAKE ESTIMATED DATA FROM NOTION\n');
  
  try {
    // Get all records
    const queryResponse = await axios.post(`https://api.notion.com/v1/databases/${NOTION_DATABASE_ID}/query`, {
      page_size: 100
    }, {
      headers: {
        'Authorization': `Bearer ${NOTION_TOKEN}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      }
    });
    
    const allRecords = queryResponse.data.results;
    console.log(`📊 Found ${allRecords.length} records to clean\n`);
    
    let cleanedCount = 0;
    
    for (const record of allRecords) {
      try {
        const title = record.properties.Title?.title?.[0]?.plain_text || '';
        console.log(`🧹 Cleaning: ${title.substring(0, 50)}...`);
        
        // Clear all potentially fake/estimated fields
        const cleanProperties = {};
        
        // Only clear fields that were estimated (keep real data from APIs)
        const fieldsToCheck = [
          'Traffic Potential',
          'Competition Difficulty', 
          'Quality Score',
          'Published At'
        ];
        
        let hadFakeData = false;
        
        fieldsToCheck.forEach(field => {
          if (record.properties[field]) {
            // If it's a number field with our estimated ranges, clear it
            if (field === 'Traffic Potential' || field === 'Competition Difficulty' || field === 'Quality Score') {
              const value = record.properties[field].number;
              // Only keep values if they came from real sources (will be re-added by real-data-filler.js)
              if (value && (value < 50 || value > 95)) {
                // These are likely estimated values, clear them
                cleanProperties[field] = { number: null };
                hadFakeData = true;
              }
            }
            
            // For dates, only clear if they look estimated (before 2020 or exactly 2023-12-01)
            if (field === 'Published At' && record.properties[field].date) {
              const dateStr = record.properties[field].date.start;
              if (dateStr === '2023-12-01' || new Date(dateStr).getFullYear() < 2020) {
                cleanProperties[field] = { date: null };
                hadFakeData = true;
              }
            }
          }
        });
        
        // Update record if it had fake data
        if (hadFakeData && Object.keys(cleanProperties).length > 0) {
          await axios.patch(`https://api.notion.com/v1/pages/${record.id}`, {
            properties: cleanProperties
          }, {
            headers: {
              'Authorization': `Bearer ${NOTION_TOKEN}`,
              'Notion-Version': '2022-06-28',
              'Content-Type': 'application/json'
            }
          });
          
          cleanedCount++;
          console.log(`   ✅ Removed estimated data from ${Object.keys(cleanProperties).join(', ')}`);
        } else {
          console.log(`   ✓ No fake data found`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.log(`   ❌ Error cleaning record: ${error.message}`);
      }
    }
    
    console.log(`\n🎯 CLEANUP RESULTS:`);
    console.log(`✅ Cleaned ${cleanedCount} records of estimated data`);
    console.log(`📊 ${allRecords.length - cleanedCount} records had no fake data`);
    console.log('\n💡 Next steps:');
    console.log('1. Run real-data-filler.js to add verified data back');
    console.log('2. Updated weekly scanner will only generate real data going forward');
    
  } catch (error) {
    console.log('❌ Error:', error.response?.data || error.message);
  }
}

removeFakeEstimatedData();