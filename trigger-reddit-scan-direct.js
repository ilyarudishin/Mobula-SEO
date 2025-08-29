// Directly trigger the Reddit scan that successfully ran this morning
const axios = require('axios');

async function triggerRedditScanDirect() {
  console.log('🔍 Triggering Reddit scan using the method that worked this morning...\n');
  
  try {
    // This should work since it's the same endpoint pattern that saved GSC data
    console.log('📊 Calling Reddit discovery service...');
    
    const response = await axios.post('http://localhost:3003/scan-reddit-opportunities', {
      scan_type: 'manual',
      hours: 48,
      save_to_notion: true
    }, {
      timeout: 120000 // 2 minutes
    });
    
    console.log('✅ Reddit scan completed:');
    console.log(JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    if (error.response?.status === 404) {
      console.log('❌ Endpoint not found. Let me try the orchestrator method directly...\n');
      
      // Try calling the orchestrator service that definitely worked this morning
      try {
        console.log('🔄 Trying orchestrator scanRedditOpportunities method...');
        
        const orchResponse = await axios.post('http://localhost:3003/trigger-reddit-scan', {
          immediate: true,
          last_hours: 48
        }, {
          timeout: 120000
        });
        
        console.log('✅ Orchestrator scan result:');
        console.log(JSON.stringify(orchResponse.data, null, 2));
        
      } catch (orchError) {
        console.log('❌ Orchestrator method failed too. Let me check what endpoints exist...\n');
        
        // Check what endpoints are actually available
        try {
          const healthCheck = await axios.get('http://localhost:3003/health');
          console.log('✅ Server is running');
          console.log('Health status:', healthCheck.data);
          
          // Try the test endpoint that was working
          console.log('\n🔍 Trying test-reddit endpoint...');
          const testResponse = await axios.get('http://localhost:3003/test-reddit', {
            timeout: 120000
          });
          
          console.log('✅ Test Reddit response:');
          console.log(JSON.stringify(testResponse.data, null, 2));
          
          if (testResponse.data.newOpportunitiesFound > 0) {
            console.log(`\n🎯 Found ${testResponse.data.newOpportunitiesFound} new opportunities!`);
            console.log('✅ These should have been automatically saved to Notion');
            console.log('📋 Check your Notion database for the new entries');
          } else {
            console.log('\n✅ No new opportunities found in last 48 hours');
            console.log('💡 This means either:');
            console.log('   - No API questions matching Mobula docs were posted');
            console.log('   - All relevant posts were already processed'); 
            console.log('   - Quality filtering is working correctly');
          }
          
        } catch (healthError) {
          console.log('❌ Server health check failed:', healthError.message);
        }
      }
    } else {
      console.log('❌ Reddit scan failed:', error.message);
    }
  }
}

triggerRedditScanDirect();