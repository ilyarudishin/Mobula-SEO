const axios = require('axios');

async function runRedditScanNow() {
  console.log('🔍 Running LIVE Reddit scan for last 48 hours...\n');
  
  try {
    // Check if we can directly call the Reddit service
    console.log('📊 Scanning Reddit for Mobula-relevant opportunities...');
    
    // The endpoint is actually running a scan, let's wait for it
    const response = await axios.get('http://localhost:3003/test-reddit', {
      timeout: 120000 // 2 minutes timeout for full scan
    });
    
    console.log('✅ Reddit scan completed!');
    console.log('📊 Results:');
    console.log(JSON.stringify(response.data, null, 2));
    
    if (response.data.newOpportunitiesFound > 0) {
      console.log(`\n🎯 Found ${response.data.newOpportunitiesFound} new opportunities!`);
      console.log('Check your Notion database for the detailed opportunities.');
    } else {
      console.log('\n✅ No new opportunities found in the last 48 hours.');
      console.log('This means either:');
      console.log('- All relevant posts were already processed');
      console.log('- No API questions matching Mobula docs appeared');
      console.log('- Quality filtering is working correctly');
    }
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Server not running. Please start the server first.');
    } else if (error.code === 'ETIMEDOUT') {
      console.log('⏰ Scan is taking longer than expected, but it\'s still running...');
      console.log('Check the server logs for progress.');
    } else {
      console.log('❌ Error running Reddit scan:', error.message);
    }
  }
}

runRedditScanNow();