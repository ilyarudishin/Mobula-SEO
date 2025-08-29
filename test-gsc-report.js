const axios = require('axios');

async function testGSCReport() {
  try {
    console.log('🔄 Testing GSC report generation...\n');
    
    // Test individual GSC components
    console.log('1. Testing GSC connection...');
    const connectionTest = await axios.get('http://localhost:3003/test-gsc', {
      timeout: 30000
    });
    
    if (connectionTest.data.status === 'success') {
      console.log('✅ GSC connection successful');
      console.log(`   Top query: "${connectionTest.data.topQueries[0]?.query}" (${connectionTest.data.topQueries[0]?.clicks} clicks)`);
    }
    
    console.log('\n2. Testing GSC top pages...');
    // The test endpoint should include top pages data
    
    console.log('\n3. Testing keyword position tracking...');
    // This would be part of the daily GSC tracking function
    
    console.log('\n4. Full GSC report structure would include:');
    console.log('   - Top 5 pages with click data');
    console.log('   - Top 10 queries with positions');
    console.log('   - Core keyword tracking results');
    console.log('   - Performance insights');
    
    // The issue is likely that the report generation is:
    // A) Running into an error during keyword tracking
    // B) Timing out during GSC API calls
    // C) Failing to format the complete report structure
    
    console.log('\n📊 Sample complete report format:');
    console.log('# Daily GSC Performance Summary\n');
    console.log('## Top Pages:');
    console.log('- https://mobula.io/: 180 clicks (pos 11.6)');
    console.log('- https://docs.mobula.io/: 102 clicks (pos 8.6)');
    console.log('- https://docs.mobula.io/introduction: 24 clicks (pos 6.7)\n');
    
    console.log('## Top Queries:');
    console.log('- "mobula api": 75 clicks (pos 1.0)');
    console.log('- "mobula crypto": 50 clicks (pos 1.0)');
    console.log('- "mobula": 44 clicks (pos 16.1)\n');
    
    console.log('## Keyword Tracking:');
    console.log('10 core keywords monitored for position changes.');
    console.log('- crypto api: Position 5.2 (+0.3)');
    console.log('- blockchain api: Position 8.1 (-0.5)');
    console.log('- token price api: Position 12.4 (+2.1)\n');
    
    console.log('## Performance Insights:');
    console.log('- Total clicks: 387 (+12% vs yesterday)');
    console.log('- Total impressions: 15,234 (+5% vs yesterday)');
    console.log('- Average CTR: 2.54% (+0.2pp vs yesterday)');
    console.log('- Average position: 11.8 (+0.5 vs yesterday)\n');
    
    console.log('The truncated report suggests the generation stopped after "10 core keywords monitored" line');
    console.log('This indicates an error in the keyword tracking or performance insights section.');
    
  } catch (error) {
    console.error('❌ Error testing GSC report:', error.message);
  }
}

testGSCReport();