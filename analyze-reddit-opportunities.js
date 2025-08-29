const axios = require('axios');

async function analyzeTopRedditOpportunities() {
  console.log('🎯 ANALYZING TOP REDDIT OPPORTUNITIES FOR MOBULA\n');
  
  const highValueOpportunities = [
    // From the scan, let's manually check the most promising ones
    {
      title: "Build DeFi & Games on Stellar: Our $12,000 KALE x Reflector Hackathon is LIVE!",
      subreddit: "Stellar",
      url: "https://reddit.com/r/Stellar/comments/1mvm0lo",
      score: 17,
      comments: 1,
      keyword: "crypto api",
      why: "Hackathon participants need APIs for DeFi building"
    }
  ];
  
  // Let's search for more specific API questions
  const specificSearches = [
    'solana api recommendations',
    'ethereum price api',
    'best crypto api',
    'multi chain api',
    'wallet data api',
    'defi data api',
    'coingecko alternative',
    'moralis alternative',
    'crypto portfolio api'
  ];
  
  console.log('🔍 Searching for specific API questions...\n');
  
  const findings = [];
  
  for (const search of specificSearches.slice(0, 5)) { // Limit searches
    try {
      console.log(`🔎 "${search}"`);
      
      const searchUrl = `https://www.reddit.com/search.json?q=${encodeURIComponent(search)}&sort=new&t=month&limit=10`;
      
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': 'MobulaAPI:Research:v1.0.0 (research only)',
        },
        timeout: 10000,
      });
      
      const posts = response.data.data.children;
      
      for (const postData of posts) {
        const post = postData.data;
        const postText = `${post.title} ${post.selftext || ''}`.toLowerCase();
        
        // Look for actual questions asking for help/recommendations
        const isQuestion = 
          postText.includes('?') ||
          postText.includes('recommend') ||
          postText.includes('suggest') ||
          postText.includes('which ') ||
          postText.includes('what ') ||
          postText.includes('how ') ||
          postText.includes('need ') ||
          postText.includes('looking for') ||
          postText.includes('help') ||
          postText.includes('best ');
        
        // Must mention APIs or data
        const mentionsApis = 
          postText.includes('api') ||
          postText.includes('data') ||
          postText.includes('service') ||
          postText.includes('provider');
        
        // Recent posts (last month)
        const postAge = Date.now() - (post.created_utc * 1000);
        const monthInMs = 30 * 24 * 60 * 60 * 1000;
        const isRecent = postAge <= monthInMs;
        
        if (isQuestion && mentionsApis && isRecent && post.score > 0) {
          findings.push({
            title: post.title,
            subreddit: post.subreddit,
            url: `https://reddit.com/r/${post.subreddit}/comments/${post.id}`,
            score: post.score,
            comments: post.num_comments,
            content: (post.selftext || '').substring(0, 400),
            searchTerm: search,
            daysAgo: Math.round(postAge / (1000 * 60 * 60 * 24)),
            created: new Date(post.created_utc * 1000).toLocaleDateString()
          });
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000)); // Rate limiting
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
  
  console.log(`\n📊 Found ${findings.length} high-quality API questions\n`);
  
  if (findings.length > 0) {
    // Remove duplicates and sort by relevance
    const uniqueFindings = findings.filter((finding, index, self) => 
      index === self.findIndex(f => f.url === finding.url)
    );
    
    uniqueFindings.sort((a, b) => (b.score + b.comments) - (a.score + a.comments));
    
    console.log('🎯 BEST OPPORTUNITIES FOR MOBULA:\n');
    
    uniqueFindings.slice(0, 8).forEach((finding, index) => {
      console.log(`${index + 1}. **${finding.title}**`);
      console.log(`   📍 r/${finding.subreddit} | 👍 ${finding.score} | 💬 ${finding.comments} | ⏰ ${finding.daysAgo} days ago`);
      console.log(`   🔗 ${finding.url}`);
      console.log(`   🔎 Found via: "${finding.searchTerm}"`);
      
      if (finding.content && finding.content.trim()) {
        console.log(`   📝 "${finding.content.substring(0, 200)}${finding.content.length > 200 ? '...' : ''}"`);
      }
      
      // Quick relevance assessment
      const content = `${finding.title} ${finding.content}`.toLowerCase();
      let relevanceScore = 0;
      
      if (content.includes('api')) relevanceScore += 20;
      if (content.includes('price') || content.includes('market')) relevanceScore += 15;
      if (content.includes('wallet') || content.includes('portfolio')) relevanceScore += 15;
      if (content.includes('multi') || content.includes('cross')) relevanceScore += 10;
      if (content.includes('real') && content.includes('time')) relevanceScore += 10;
      if (content.includes('coingecko') || content.includes('moralis')) relevanceScore += 25;
      if (content.includes('recommend') || content.includes('suggest')) relevanceScore += 15;
      
      console.log(`   ⭐ Relevance: ${relevanceScore}/100 for Mobula`);
      
      if (relevanceScore >= 50) {
        console.log(`   🎯 HIGH VALUE OPPORTUNITY - Perfect for Mobula engagement!`);
      } else if (relevanceScore >= 30) {
        console.log(`   ✅ Good opportunity - Consider engaging`);
      }
      
      console.log('');
    });
    
    const highValueCount = uniqueFindings.filter(f => {
      const content = `${f.title} ${f.content}`.toLowerCase();
      const score = (content.includes('api') ? 20 : 0) + 
                   (content.includes('recommend') ? 15 : 0) + 
                   (content.includes('coingecko') || content.includes('moralis') ? 25 : 0);
      return score >= 50;
    }).length;
    
    console.log(`📈 SUMMARY:`);
    console.log(`   🎯 ${highValueCount} high-value opportunities (50+ relevance)`);
    console.log(`   ✅ ${uniqueFindings.filter(f => f.daysAgo <= 7).length} posted in last week`);
    console.log(`   💬 ${uniqueFindings.filter(f => f.comments > 5).length} with active discussions`);
    
  } else {
    console.log('✅ No specific API questions found in recent searches');
    console.log('💡 This suggests either:');
    console.log('   - The community is satisfied with current solutions');
    console.log('   - Questions are being asked in different ways');
    console.log('   - Opportunities are in more specific/niche subreddits');
  }
}

analyzeTopRedditOpportunities();