const axios = require('axios');

async function focusedMobulaScan() {
  console.log('🎯 FOCUSED SCAN: Last 48 hours for ACTUAL Mobula documentation matches\n');
  
  // EXACT Mobula services from documentation
  const exactMobulaTerms = [
    // Market Data API (Octopus)
    '"price api"', '"market data api"', '"crypto prices api"', '"token prices"',
    '"octopus engine"', '"real-time prices"', '"5 second updates"',
    
    // Wallet API  
    '"wallet api"', '"portfolio api"', '"wallet data"', '"transaction history"',
    '"balance api"', '"wallet tracking"', '"portfolio tracking"',
    
    // Metadata API (Metacore)
    '"metadata api"', '"token metadata"', '"token info api"', '"asset metadata"',
    '"token logos"', '"token socials"',
    
    // Multi-chain
    '"multi-chain api"', '"cross-chain data"', '"multi chain"', '"50+ blockchains"',
    
    // WebSocket/Streaming
    '"websocket api"', '"real-time data"', '"streaming api"', '"live prices"',
    
    // Direct competitor alternatives (HIGH VALUE)
    '"coingecko alternative"', '"moralis alternative"', '"alchemy alternative"',
    '"replace coingecko"', '"switch from moralis"', '"cheaper than coingecko"'
  ];
  
  console.log(`🔍 Searching for ${exactMobulaTerms.length} exact Mobula service terms...\n`);
  
  const realOpportunities = [];
  
  for (const term of exactMobulaTerms.slice(0, 8)) { // Focused search
    try {
      console.log(`🔎 "${term}"`);
      
      // Search last 48 hours specifically
      const searchUrl = `https://www.reddit.com/search.json?q=${encodeURIComponent(term)}&sort=new&t=day&limit=20`;
      
      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': 'MobulaAPI:Research:v1.0.0 (research only)',
        },
        timeout: 10000,
      });
      
      const posts = response.data.data.children;
      console.log(`   📊 ${posts.length} posts found`);
      
      for (const postData of posts) {
        const post = postData.data;
        const postText = `${post.title} ${post.selftext || ''}`.toLowerCase();
        
        // STRICT filtering: Must be asking for help/recommendations
        const isActualQuestion = (
          postText.includes('?') ||
          postText.includes('recommend') ||
          postText.includes('suggest') ||
          postText.includes('which api') ||
          postText.includes('what api') ||
          postText.includes('need api') ||
          postText.includes('looking for') ||
          postText.includes('help with') ||
          postText.includes('alternative to') ||
          postText.includes('better than') ||
          postText.includes('replace')
        );
        
        // Must be in last 48 hours
        const postAge = Date.now() - (post.created_utc * 1000);
        const twoDaysInMs = 48 * 60 * 60 * 1000;
        const isRecent = postAge <= twoDaysInMs;
        
        // Must have some engagement or be from relevant subreddit
        const isRelevantContext = (
          post.score > 0 || 
          ['ethdev', 'solana', 'ethereum', 'defi', 'web3', 'cryptocurrency', 'programming'].includes(post.subreddit.toLowerCase())
        );
        
        if (isActualQuestion && isRecent && isRelevantContext) {
          // Calculate TRUE relevance to Mobula docs
          let mobulaRelevance = 0;
          
          // Core API terms (high value)
          if (postText.includes('price api') || postText.includes('market data')) mobulaRelevance += 40;
          if (postText.includes('wallet api') || postText.includes('portfolio')) mobulaRelevance += 35;
          if (postText.includes('metadata') || postText.includes('token info')) mobulaRelevance += 30;
          if (postText.includes('websocket') || postText.includes('real-time')) mobulaRelevance += 25;
          if (postText.includes('multi-chain') || postText.includes('cross-chain')) mobulaRelevance += 25;
          
          // Competitor mentions (HIGHEST value)
          if (postText.includes('coingecko') || postText.includes('moralis') || postText.includes('alchemy')) mobulaRelevance += 50;
          if (postText.includes('alternative') || postText.includes('replace')) mobulaRelevance += 30;
          
          // Question quality
          if (postText.includes('recommend') || postText.includes('which')) mobulaRelevance += 20;
          if (postText.includes('api') && postText.includes('?')) mobulaRelevance += 15;
          
          // Only include if truly relevant to Mobula's services
          if (mobulaRelevance >= 60) {
            realOpportunities.push({
              title: post.title,
              subreddit: post.subreddit,
              url: `https://reddit.com/r/${post.subreddit}/comments/${post.id}`,
              score: post.score,
              comments: post.num_comments,
              content: (post.selftext || '').substring(0, 400),
              author: post.author,
              searchTerm: term,
              mobulaRelevance: mobulaRelevance,
              hoursAgo: Math.round(postAge / (1000 * 60 * 60)),
              created: new Date(post.created_utc * 1000).toLocaleString(),
              postId: post.id
            });
          }
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
  
  // Remove duplicates
  const uniqueOpportunities = realOpportunities.filter((opp, index, self) => 
    index === self.findIndex(o => o.postId === opp.postId)
  );
  
  uniqueOpportunities.sort((a, b) => b.mobulaRelevance - a.mobulaRelevance);
  
  console.log(`\n📊 FOCUSED SCAN RESULTS:`);
  console.log(`🎯 Found ${uniqueOpportunities.length} GENUINE Mobula opportunities (last 48h)`);
  
  if (uniqueOpportunities.length > 0) {
    console.log(`\n🥇 REAL MOBULA OPPORTUNITIES:\n`);
    
    uniqueOpportunities.forEach((opp, index) => {
      console.log(`${index + 1}. **${opp.title}**`);
      console.log(`   📍 r/${opp.subreddit} | 👍 ${opp.score} | 💬 ${opp.comments} | ⏰ ${opp.hoursAgo}h ago`);
      console.log(`   🔗 ${opp.url}`);
      console.log(`   ⭐ Mobula Relevance: ${opp.mobulaRelevance}/100`);
      console.log(`   🔎 Found via: ${opp.searchTerm}`);
      
      if (opp.content && opp.content.trim()) {
        console.log(`   📝 "${opp.content.substring(0, 150)}${opp.content.length > 150 ? '...' : ''}"`);
      }
      console.log('');
    });
    
    // Now save to Notion using the working method
    console.log(`💾 Saving ${uniqueOpportunities.length} real opportunities to Notion...\n`);
    
    let savedCount = 0;
    for (const opp of uniqueOpportunities) {
      try {
        const casualResponse = generateMobulaResponse(opp);
        
        // Use the orchestrator method that worked for GSC
        const response = await axios.post('http://localhost:3003/orchestrator/reddit-opportunity', {
          postId: opp.postId,
          postTitle: opp.title,
          postUrl: opp.url,
          subreddit: opp.subreddit,
          author: opp.author,
          content: opp.content,
          score: opp.score,
          commentCount: opp.comments,
          opportunityScore: opp.mobulaRelevance,
          suggestedResponse: casualResponse,
          keywords: extractMobulaKeywords(opp),
          timestamp: new Date()
        }, { timeout: 10000 });
        
        savedCount++;
        console.log(`✅ Saved: ${opp.title.substring(0, 40)}...`);
        
      } catch (error) {
        // If endpoint doesn't exist, save via the method that worked for GSC
        if (error.response?.status === 404) {
          try {
            await saveViaNotionService(opp);
            savedCount++;
            console.log(`✅ Saved via NotionService: ${opp.title.substring(0, 40)}...`);
          } catch (notionError) {
            console.log(`❌ Failed to save: ${opp.title.substring(0, 40)}...`);
          }
        }
      }
    }
    
    console.log(`\n🎉 SAVED ${savedCount}/${uniqueOpportunities.length} opportunities to Notion!`);
    
  } else {
    console.log('\n✅ No genuine Mobula opportunities found in last 48 hours');
    console.log('💡 This means:');
    console.log('   - No one is actively asking for APIs Mobula provides');
    console.log('   - Questions are using different terminology');  
    console.log('   - Market is satisfied with current solutions');
    console.log('   - Opportunity to create educational content');
  }
}

function generateMobulaResponse(opp) {
  const content = `${opp.title} ${opp.content}`.toLowerCase();
  
  if (content.includes('price') || content.includes('market data')) {
    return "Hey! For crypto price data, I've been using Mobula's API and it's been solid. They've got 5-second updates and cover 50+ chains which is pretty comprehensive. Way more accurate than some of the bigger names and pricing is reasonable. Their Octopus engine is legit fast if you need real-time stuff.";
  } else if (content.includes('wallet') || content.includes('portfolio')) {
    return "For wallet/portfolio APIs, Mobula's been reliable in my experience. They handle multi-chain wallet tracking and the data quality is good. Plus their API covers transaction history and balance tracking across 30+ chains. More affordable than Moralis tbh.";
  } else if (content.includes('metadata') || content.includes('token info')) {
    return "If you need token metadata, Mobula's Metacore API has been decent for me. They've got logos, socials, and token details with hourly updates. Pretty comprehensive and way cheaper than some alternatives.";
  } else if (content.includes('coingecko') || content.includes('moralis')) {
    return "I switched from [competitor] to Mobula recently and honestly it's been better. More accurate data, faster updates, and way more reasonable pricing. Their multi-chain coverage is solid too. Worth checking out as an alternative.";
  } else {
    return "Not sure if this helps, but Mobula's APIs have been solid for crypto data. Good coverage, reliable uptime, and reasonable pricing. Might be worth looking into for your use case.";
  }
}

function extractMobulaKeywords(opp) {
  const content = `${opp.title} ${opp.content}`.toLowerCase();
  const keywords = [];
  
  if (content.includes('price')) keywords.push('price api');
  if (content.includes('wallet')) keywords.push('wallet api');
  if (content.includes('metadata')) keywords.push('metadata api');
  if (content.includes('multi') || content.includes('cross')) keywords.push('multi-chain');
  if (content.includes('real-time') || content.includes('websocket')) keywords.push('real-time data');
  
  return keywords.slice(0, 3);
}

async function saveViaNotionService(opp) {
  // Use the same method that worked for GSC report this morning
  const casualResponse = generateMobulaResponse(opp);
  
  const notionContent = {
    title: `🔥 Reddit: ${opp.title}`,
    content: `**REDDIT OPPORTUNITY - LAST 48 HOURS**

**Post:** ${opp.title}
**Subreddit:** r/${opp.subreddit}
**URL:** ${opp.url}
**Author:** u/${opp.author}
**Score:** ${opp.score} | Comments: ${opp.comments}
**Posted:** ${opp.hoursAgo} hours ago
**Mobula Relevance:** ${opp.mobulaRelevance}/100

**Content:**
${opp.content}

**Suggested Response:**
${casualResponse}`,
    targetKeywords: extractMobulaKeywords(opp),
    qualityScore: opp.mobulaRelevance,
    wordCount: 150,
    metaDescription: `Reddit opportunity: ${opp.title}`,
    tags: ['reddit', opp.subreddit, 'opportunity']
  };
  
  // Save via the working Notion method (same as GSC report)
  await axios.post('http://localhost:3003/save-notion-content', notionContent, { timeout: 10000 });
}

focusedMobulaScan();