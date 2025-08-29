const axios = require('axios');

async function findCryptoApiQuestions() {
  console.log('🔍 TARGETED SEARCH: Crypto/Blockchain API Questions on Reddit\n');
  
  // Very specific searches for actual API needs
  const searches = [
    // Direct API questions
    'crypto api "which"',
    'blockchain api "recommend"',
    '"best crypto api"',
    '"coingecko alternative"',
    '"moralis alternative"',
    'solana api "need"',
    'ethereum api "looking for"',
    'defi api "suggest"',
    '"wallet api" recommendation',
    '"portfolio tracking" api',
    // Common pain points Mobula solves
    '"expensive crypto api"',
    '"rate limited" crypto',
    '"slow crypto api"',
    'multi chain "data provider"',
    '"real time" crypto prices',
    // Subreddit-specific searches
    'site:reddit.com/r/ethdev "api"',
    'site:reddit.com/r/solana "data api"',
    'site:reddit.com/r/defi "price api"'
  ];
  
  const realOpportunities = [];
  
  for (const search of searches.slice(0, 6)) { // Search first 6 to avoid rate limits
    try {
      console.log(`🔎 Searching: ${search}`);
      
      // Use Reddit's search with quoted terms for better precision
      const searchUrl = `https://www.reddit.com/search.json?q=${encodeURIComponent(search)}&sort=new&t=month&limit=15`;
      
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': 'MobulaAPI:Research:v1.0.0 (research only)',
        },
        timeout: 12000,
      });
      
      const posts = response.data.data.children;
      console.log(`   📊 Found ${posts.length} posts`);
      
      for (const postData of posts) {
        const post = postData.data;
        const postText = `${post.title} ${post.selftext || ''}`.toLowerCase();
        
        // STRICT filtering for actual API questions
        const isApiQuestion = (
          (postText.includes('api') || postText.includes('data provider') || postText.includes('service')) &&
          (postText.includes('?') || 
           postText.includes('recommend') || 
           postText.includes('suggest') || 
           postText.includes('which ') || 
           postText.includes('what ') || 
           postText.includes('best ') || 
           postText.includes('need ') || 
           postText.includes('looking for') ||
           postText.includes('help'))
        );
        
        // Must be crypto/blockchain related
        const isCrypto = (
          postText.includes('crypto') || 
          postText.includes('blockchain') || 
          postText.includes('ethereum') || 
          postText.includes('solana') || 
          postText.includes('bitcoin') || 
          postText.includes('defi') || 
          postText.includes('web3') || 
          postText.includes('token') || 
          postText.includes('wallet') ||
          postText.includes('portfolio')
        );
        
        // Recent and has some engagement
        const postAge = Date.now() - (post.created_utc * 1000);
        const monthInMs = 30 * 24 * 60 * 60 * 1000;
        const isRecent = postAge <= monthInMs;
        const hasEngagement = post.score > 0 || post.num_comments > 0;
        
        if (isApiQuestion && isCrypto && isRecent && hasEngagement) {
          // Calculate relevance score
          let relevanceScore = 0;
          
          // High value terms
          if (postText.includes('api')) relevanceScore += 25;
          if (postText.includes('recommend') || postText.includes('suggest')) relevanceScore += 20;
          if (postText.includes('best') || postText.includes('which')) relevanceScore += 15;
          if (postText.includes('coingecko') || postText.includes('moralis') || postText.includes('alchemy')) relevanceScore += 30;
          if (postText.includes('price') || postText.includes('market')) relevanceScore += 15;
          if (postText.includes('wallet') || postText.includes('portfolio')) relevanceScore += 15;
          if (postText.includes('multi') || postText.includes('cross')) relevanceScore += 10;
          if (postText.includes('real') && postText.includes('time')) relevanceScore += 10;
          if (postText.includes('alternative')) relevanceScore += 20;
          if (postText.includes('expensive') || postText.includes('rate limit') || postText.includes('slow')) relevanceScore += 25;
          
          realOpportunities.push({
            title: post.title,
            subreddit: post.subreddit,
            url: `https://reddit.com/r/${post.subreddit}/comments/${post.id}`,
            score: post.score,
            comments: post.num_comments,
            content: (post.selftext || '').substring(0, 500),
            searchTerm: search,
            relevanceScore: relevanceScore,
            daysAgo: Math.round(postAge / (1000 * 60 * 60 * 24)),
            created: new Date(post.created_utc * 1000).toLocaleDateString(),
            author: post.author
          });
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 3000)); // Rate limiting
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
  
  console.log(`\n📊 ANALYSIS COMPLETE:`);
  console.log(`🎯 Found ${realOpportunities.length} genuine API questions\n`);
  
  if (realOpportunities.length > 0) {
    // Remove duplicates and sort by relevance
    const uniqueOpportunities = realOpportunities.filter((opp, index, self) => 
      index === self.findIndex(o => o.url === opp.url)
    );
    
    uniqueOpportunities.sort((a, b) => b.relevanceScore - a.relevanceScore);
    
    console.log('🥇 TOP MOBULA OPPORTUNITIES:\n');
    
    uniqueOpportunities.slice(0, 10).forEach((opp, index) => {
      console.log(`${index + 1}. **${opp.title}**`);
      console.log(`   📍 r/${opp.subreddit} | 👍 ${opp.score} | 💬 ${opp.comments} | ⏰ ${opp.daysAgo} days ago`);
      console.log(`   👤 u/${opp.author}`);
      console.log(`   🔗 ${opp.url}`);
      console.log(`   ⭐ Relevance: ${opp.relevanceScore}/100 for Mobula`);
      console.log(`   🔎 Found via: "${opp.searchTerm}"`);
      
      if (opp.content && opp.content.trim()) {
        console.log(`   📝 "${opp.content.substring(0, 300)}${opp.content.length > 300 ? '...' : ''}"`);
      }
      
      if (opp.relevanceScore >= 70) {
        console.log(`   🎯 PREMIUM OPPORTUNITY - Definitely engage!`);
      } else if (opp.relevanceScore >= 50) {
        console.log(`   ✅ HIGH VALUE - Strong engagement opportunity`);
      } else if (opp.relevanceScore >= 30) {
        console.log(`   💡 GOOD POTENTIAL - Consider engaging if relevant`);
      }
      
      console.log('');
    });
    
    const highValue = uniqueOpportunities.filter(o => o.relevanceScore >= 50).length;
    const premium = uniqueOpportunities.filter(o => o.relevanceScore >= 70).length;
    const recent = uniqueOpportunities.filter(o => o.daysAgo <= 7).length;
    const withComments = uniqueOpportunities.filter(o => o.comments > 0).length;
    
    console.log(`📈 OPPORTUNITY BREAKDOWN:`);
    console.log(`   🥇 ${premium} premium opportunities (70+ relevance)`);
    console.log(`   🎯 ${highValue} high-value opportunities (50+ relevance)`);
    console.log(`   🆕 ${recent} posted in last week`);
    console.log(`   💬 ${withComments} with existing discussion`);
    
    if (premium > 0 || highValue > 0) {
      console.log(`\n💡 NEXT STEPS:`);
      console.log(`   1. Review the top ${Math.min(3, highValue)} opportunities above`);
      console.log(`   2. Craft helpful, value-focused responses mentioning Mobula's APIs`);
      console.log(`   3. Focus on solving their specific problem first`);
      console.log(`   4. Position Mobula as a better alternative to their current solution`);
    }
    
  } else {
    console.log('✅ No high-quality crypto API questions found in recent posts');
    console.log('💭 This could indicate:');
    console.log('   - Current crypto API market is well-served');
    console.log('   - Questions are asked in private channels/Discord');
    console.log('   - Developers are using different terminology');
    console.log('   - Opportunity exists in providing educational content');
  }
}

findCryptoApiQuestions();