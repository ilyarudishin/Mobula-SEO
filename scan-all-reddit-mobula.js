const axios = require('axios');

async function scanAllRedditForMobula() {
  console.log('🔍 COMPREHENSIVE REDDIT SCAN - Finding ALL discussions matching Mobula docs\n');
  
  // COMPREHENSIVE MOBULA KEYWORDS from our docs
  const mobulaKeywords = [
    // Core API terms
    'price api', 'market data api', 'crypto api', 'blockchain api', 'token api',
    'wallet api', 'portfolio api', 'metadata api', 'multi-chain api',
    
    // Specific services
    'octopus engine', 'metacore', 'real-time prices', 'websocket api',
    'token metadata', 'wallet tracking', 'portfolio tracking',
    
    // Common dev needs
    'crypto prices', 'token prices', 'market data', 'blockchain data',
    'wallet data', 'transaction history', 'price feed', 'real-time data',
    
    // Competitors (perfect opportunities)
    'coingecko api', 'coinmarketcap api', 'moralis api', 'alchemy api',
    'coingecko alternative', 'moralis alternative',
    
    // Multi-chain
    'multi chain', 'cross chain', 'ethereum api', 'solana api', 'polygon api',
    'bnb chain api', 'avalanche api', 'arbitrum api'
  ];
  
  const allFindings = [];
  
  try {
    console.log(`🔎 Searching Reddit for ${mobulaKeywords.length} Mobula-related keywords...\n`);
    
    // Search each keyword across ALL of Reddit
    for (let i = 0; i < Math.min(mobulaKeywords.length, 8); i++) { // Limit to 8 searches to avoid rate limits
      const keyword = mobulaKeywords[i];
      console.log(`🔍 Searching: "${keyword}"`);
      
      try {
        // Search ALL of Reddit for this keyword (last 48 hours)
        const searchUrl = `https://www.reddit.com/search.json?q=${encodeURIComponent(keyword)}&sort=new&t=week&limit=25`;
        
        const response = await axios.get(searchUrl, {
          headers: {
            'User-Agent': 'MobulaAPI:Research:v1.0.0 (research only)',
          },
          timeout: 15000,
        });
        
        const posts = response.data.data.children;
        console.log(`   📊 Found ${posts.length} posts for "${keyword}"`);
        
        for (const postData of posts) {
          const post = postData.data;
          
          // Filter for relevant posts (questions, discussions, API needs)
          const postText = `${post.title} ${post.selftext || ''}`.toLowerCase();
          
          // Must be asking for help, recommendations, or discussing APIs
          const isRelevant = 
            postText.includes('?') ||
            postText.includes('recommend') ||
            postText.includes('suggest') ||
            postText.includes('which ') ||
            postText.includes('what ') ||
            postText.includes('how ') ||
            postText.includes('need ') ||
            postText.includes('looking for') ||
            postText.includes('best ') ||
            postText.includes('api') ||
            postText.includes('help');
          
          // Must be crypto/blockchain related
          const cryptoTerms = ['crypto', 'blockchain', 'ethereum', 'solana', 'bitcoin', 'defi', 'web3', 'token', 'wallet', 'dapp'];
          const isCrypto = cryptoTerms.some(term => postText.includes(term));
          
          // Check if posted in last 48 hours
          const postAge = Date.now() - (post.created_utc * 1000);
          const twoDaysInMs = 2 * 24 * 60 * 60 * 1000;
          const isRecent = postAge <= twoDaysInMs;
          
          if (isRelevant && isCrypto && post.score > 0) {
            allFindings.push({
              title: post.title,
              subreddit: post.subreddit,
              url: `https://reddit.com/r/${post.subreddit}/comments/${post.id}`,
              score: post.score,
              comments: post.num_comments,
              author: post.author,
              content: (post.selftext || '').substring(0, 300),
              keyword: keyword,
              age: Math.round(postAge / (1000 * 60 * 60)), // hours ago
              isRecent: isRecent,
              created: new Date(post.created_utc * 1000).toLocaleString()
            });
          }
        }
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.log(`   ❌ Error searching "${keyword}": ${error.message}`);
      }
    }
    
    console.log(`\n📊 COMPREHENSIVE SCAN RESULTS:`);
    console.log(`🔍 Searched ${Math.min(mobulaKeywords.length, 8)} keywords across ALL of Reddit`);
    console.log(`📈 Found ${allFindings.length} potentially relevant discussions\n`);
    
    if (allFindings.length > 0) {
      // Sort by relevance (score + recency)
      allFindings.sort((a, b) => {
        const scoreA = a.score + (a.isRecent ? 10 : 0);
        const scoreB = b.score + (b.isRecent ? 10 : 0);
        return scoreB - scoreA;
      });
      
      console.log('🎯 TOP OPPORTUNITIES FOUND:\n');
      
      const recentFindings = allFindings.filter(f => f.isRecent);
      const olderFindings = allFindings.filter(f => !f.isRecent);
      
      if (recentFindings.length > 0) {
        console.log(`🔥 RECENT (Last 48 hours): ${recentFindings.length} posts\n`);
        recentFindings.slice(0, 5).forEach((finding, index) => {
          console.log(`${index + 1}. **${finding.title}**`);
          console.log(`   📍 r/${finding.subreddit} | 👍 ${finding.score} | 💬 ${finding.comments} | ⏰ ${finding.age}h ago`);
          console.log(`   🔗 ${finding.url}`);
          console.log(`   🏷️  Matched: "${finding.keyword}"`);
          if (finding.content) {
            console.log(`   📝 "${finding.content.substring(0, 150)}${finding.content.length > 150 ? '...' : ''}"`);
          }
          console.log('');
        });
      }
      
      if (olderFindings.length > 0 && recentFindings.length === 0) {
        console.log(`📋 OLDER DISCUSSIONS (This week): ${olderFindings.length} posts\n`);
        olderFindings.slice(0, 3).forEach((finding, index) => {
          console.log(`${index + 1}. **${finding.title}**`);
          console.log(`   📍 r/${finding.subreddit} | 👍 ${finding.score} | 💬 ${finding.comments}`);
          console.log(`   🔗 ${finding.url}`);
          console.log(`   🏷️  Matched: "${finding.keyword}"`);
          console.log('');
        });
      }
      
      // Show subreddit breakdown
      const subredditCount = {};
      allFindings.forEach(f => {
        subredditCount[f.subreddit] = (subredditCount[f.subreddit] || 0) + 1;
      });
      
      console.log('📊 SUBREDDITS WITH MOBULA-RELEVANT DISCUSSIONS:');
      Object.entries(subredditCount)
        .sort(([,a], [,b]) => b - a)
        .forEach(([subreddit, count]) => {
          console.log(`   r/${subreddit}: ${count} relevant posts`);
        });
      
    } else {
      console.log('✅ No discussions matching Mobula documentation found in the last week.');
      console.log('📝 This could mean:');
      console.log('   - No API questions were posted recently');
      console.log('   - Questions are using different terminology');
      console.log('   - Most discussions are in private channels');
    }
    
  } catch (error) {
    console.log('❌ Error in comprehensive scan:', error.message);
  }
}

scanAllRedditForMobula();