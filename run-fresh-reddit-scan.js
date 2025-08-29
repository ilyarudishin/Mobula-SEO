const axios = require('axios');

async function runFreshRedditScan() {
  console.log('🔍 Running FRESH Reddit scan (clearing cache first)...\n');
  
  try {
    // First clear the cache to see all posts
    console.log('🧹 Clearing deduplication cache...');
    const clearResponse = await axios.post('http://localhost:3003/clear-reddit-cache', {}, {
      timeout: 10000
    });
    console.log('✅ Cache cleared:', clearResponse.data);
    
    console.log('\n📊 Running fresh scan for last 48 hours...');
    
    // Now run the scan to see everything
    const scanResponse = await axios.get('http://localhost:3003/test-reddit', {
      timeout: 120000 // 2 minutes timeout
    });
    
    console.log('✅ Fresh scan completed!');
    console.log('📊 Results:');
    console.log(JSON.stringify(scanResponse.data, null, 2));
    
    if (scanResponse.data.newOpportunitiesFound > 0) {
      console.log(`\n🎯 Found ${scanResponse.data.newOpportunitiesFound} opportunities!`);
      
      if (scanResponse.data.topNewOpportunities && scanResponse.data.topNewOpportunities.length > 0) {
        console.log('\n📋 Top opportunities found:');
        scanResponse.data.topNewOpportunities.forEach((opp, index) => {
          console.log(`\n${index + 1}. **${opp.postTitle}**`);
          console.log(`   📍 r/${opp.subreddit} | Score: ${opp.opportunityScore}/100`);
          console.log(`   🔗 ${opp.postUrl}`);
          console.log(`   🏷️  Keywords: ${opp.keywords.join(', ')}`);
          console.log(`   💬 Response: ${opp.suggestedResponse.substring(0, 150)}...`);
        });
      }
    } else {
      console.log('\n✅ No opportunities found in the last 48 hours.');
      console.log('📝 This indicates:');
      console.log('   - No API questions matching Mobula docs were posted');
      console.log('   - Quality filtering is working correctly');
      console.log('   - All posts were below the 35-point threshold');
    }
    
  } catch (error) {
    if (error.response?.status === 404) {
      console.log('❌ Cache clear endpoint not found. Running scan anyway...');
      
      // Try the scan without clearing cache
      try {
        const scanResponse = await axios.get('http://localhost:3003/test-reddit', {
          timeout: 120000
        });
        console.log('✅ Scan completed!');
        console.log('📊 Results:', JSON.stringify(scanResponse.data, null, 2));
      } catch (scanError) {
        console.log('❌ Scan failed:', scanError.message);
      }
    } else if (error.code === 'ECONNREFUSED') {
      console.log('❌ Server not running. Please start the server first.');
    } else if (error.code === 'ETIMEDOUT') {
      console.log('⏰ Scan taking longer than expected...');
    } else {
      console.log('❌ Error:', error.message);
    }
  }
}

runFreshRedditScan();