const axios = require('axios');

async function testRedditAccess() {
  console.log('🔍 Testing Reddit API access and rate limits...\n');
  
  const subreddits = ['ethdev', 'solana', 'cryptocurrency', 'defi'];
  
  for (const sub of subreddits) {
    try {
      console.log(`Testing r/${sub}...`);
      
      const url = `https://www.reddit.com/r/${sub}/new.json?limit=10`;
      const startTime = Date.now();
      
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'MobulaAPI:SEOMonitor:v1.0.0 (monitoring only)',
        },
        timeout: 10000,
      });
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      const posts = response.data.data.children;
      const recentPosts = posts.filter(postData => {
        const post = postData.data;
        const postAge = Date.now() - (post.created_utc * 1000);
        const twoDaysInMs = 2 * 24 * 60 * 60 * 1000;
        return postAge <= twoDaysInMs; // Posts from last 48 hours
      });
      
      // Check for API-related posts
      const apiPosts = posts.filter(postData => {
        const post = postData.data;
        const postText = `${post.title} ${post.selftext || ''}`.toLowerCase();
        return postText.includes('api') || postText.includes('data') || postText.includes('price') || postText.includes('wallet');
      });
      
      console.log(`  ✅ Status: ${response.status}`);
      console.log(`  ⏱️  Response time: ${responseTime}ms`);
      console.log(`  📊 Total posts: ${posts.length}`);
      console.log(`  🆕 Recent posts (48h): ${recentPosts.length}`);
      console.log(`  🔧 API-related posts: ${apiPosts.length}`);
      
      if (apiPosts.length > 0) {
        console.log(`  📝 Sample API posts:`);
        apiPosts.slice(0, 2).forEach(postData => {
          const post = postData.data;
          const postAge = Math.floor((Date.now() - (post.created_utc * 1000)) / (1000 * 60 * 60));
          console.log(`    - "${post.title.substring(0, 80)}..." (${postAge}h ago, ${post.score} score)`);
        });
      }
      
      console.log('');
      
      // Rate limiting delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
      if (error.response) {
        console.log(`  📊 Status: ${error.response.status}`);
        console.log(`  📄 Status text: ${error.response.statusText}`);
        if (error.response.headers['retry-after']) {
          console.log(`  ⏳ Retry after: ${error.response.headers['retry-after']} seconds`);
        }
      }
      console.log('');
    }
  }
  
  // Test rate limits
  console.log('🚀 Testing rapid requests to check rate limits...');
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < 5; i++) {
    try {
      const response = await axios.get('https://www.reddit.com/r/cryptocurrency/new.json?limit=5', {
        headers: {
          'User-Agent': 'MobulaAPI:SEOMonitor:v1.0.0 (monitoring only)',
        },
        timeout: 5000,
      });
      successCount++;
      console.log(`  Request ${i+1}: ✅ Success`);
    } catch (error) {
      errorCount++;
      console.log(`  Request ${i+1}: ❌ ${error.message}`);
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log(`\n📊 Rate limit test results: ${successCount} success, ${errorCount} errors`);
  
  if (errorCount > successCount) {
    console.log('⚠️  High error rate suggests Reddit is blocking our requests');
    console.log('💡 Solutions:');
    console.log('   - Increase delays between requests');
    console.log('   - Use different User-Agent strings');
    console.log('   - Implement exponential backoff');
    console.log('   - Consider using Reddit API with authentication');
  } else {
    console.log('✅ Reddit access appears to be working normally');
  }
}

testRedditAccess();