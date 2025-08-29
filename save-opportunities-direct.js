// Direct integration with NotionService to save Reddit opportunities
const { NotionService } = require('./dist/src/services/notion.service');
const { ConfigService } = require('./dist/src/config/config.service');

async function saveOpportunitiesDirectly() {
  console.log('💾 Saving Reddit opportunities directly to Notion...\n');
  
  try {
    // Initialize services
    const configService = new ConfigService();
    const notionService = new NotionService(configService);
    
    // Top opportunities from our scan
    const opportunities = [
      {
        title: "Best Crypto Price API 2025 — Detailed Developer Guide",
        subreddit: "coincodecap",
        url: "https://reddit.com/r/coincodecap/comments/1mn5rp5",
        score: 1,
        author: "coinmonks",
        relevanceScore: 145,
        daysAgo: 10,
        whyRelevant: "Direct crypto price API comparison post - perfect to position Mobula as superior alternative",
        engagementStrategy: "Challenge Bitquery's positioning by highlighting Mobula's better accuracy, lower latency, and superior multi-chain coverage"
      },
      {
        title: "Cryptocurrency Trading Bot - Best Crypto Platforms",
        subreddit: "SolanaLeveling", 
        url: "https://reddit.com/r/SolanaLeveling/comments/1ml47lk",
        score: 1,
        author: "crytoloover",
        relevanceScore: 155,
        daysAgo: 13,
        whyRelevant: "Trading bot discussion needing reliable, fast price feeds - exactly what Mobula provides",
        engagementStrategy: "Highlight Mobula's 5-second update frequency and multi-chain support for trading bots"
      },
      {
        title: "ISV Payment Integration: Adding Crypto Capabilities to Your Platform",
        subreddit: "UlysApp",
        url: "https://reddit.com/r/UlysApp/comments/1mq8x79",
        score: 1,
        author: "UlysApp",
        relevanceScore: 145,
        daysAgo: 7,
        whyRelevant: "ISVs need crypto infrastructure APIs - Mobula perfect for payment platforms and wallets",
        engagementStrategy: "Position Mobula as the comprehensive crypto data infrastructure they need"
      },
      {
        title: "Stablecoin USDC (USDC) in international payments",
        subreddit: "bestchange",
        url: "https://reddit.com/r/bestchange/comments/1mw8k34",
        score: 1,
        author: "bestchange_pr",
        relevanceScore: 110,
        daysAgo: 0,
        whyRelevant: "FRESH TODAY - Discussion about crypto payments and fintech integration",
        engagementStrategy: "Discuss Mobula's role in providing reliable USDC and stablecoin data for payment systems"
      },
      {
        title: "How Can My Fintech Startup Access Bahrain's Regulatory Sandbox?",
        subreddit: "companysetupbh",
        url: "https://reddit.com/r/companysetupbh/comments/1mtdct0", 
        score: 1,
        author: "keylink123",
        relevanceScore: 110,
        daysAgo: 3,
        whyRelevant: "Fintech startup needing infrastructure - Mobula perfect for financial data services",
        engagementStrategy: "Position Mobula as compliant, enterprise-ready API solution for fintech"
      }
    ];
    
    console.log(`📋 Saving ${opportunities.length} high-value opportunities...\n`);
    
    let savedCount = 0;
    
    for (const opp of opportunities) {
      try {
        console.log(`💾 Saving: ${opp.title.substring(0, 50)}...`);
        
        // Generate casual response
        const casualResponse = generateCasualResponse(opp);
        
        await notionService.createOpportunity({
          type: 'reddit_response',
          title: `🔥 FRESH SCAN: ${opp.title}`,
          content: `**🎯 HIGH-VALUE REDDIT OPPORTUNITY - COMPREHENSIVE SCAN**

**Post:** ${opp.title}
**Subreddit:** r/${opp.subreddit}  
**URL:** ${opp.url}
**Author:** u/${opp.author}
**Reddit Score:** ${opp.score} upvotes
**Relevance Score:** ${opp.relevanceScore}/100 ⭐
**Posted:** ${opp.daysAgo} days ago
**Discovery Method:** Comprehensive Reddit scan across all subreddits

---

**📊 WHY THIS IS VALUABLE:**
${opp.whyRelevant}

**🎯 ENGAGEMENT STRATEGY:**
${opp.engagementStrategy}

---

**💬 SUGGESTED CASUAL RESPONSE:**

${casualResponse}

---

**📝 ACTION:** Review and customize the response above, then engage authentically on Reddit. Focus on providing genuine value while naturally positioning Mobula as the solution.

**⏰ URGENCY:** ${opp.daysAgo <= 3 ? '🔥 HIGH - Posted recently!' : opp.daysAgo <= 7 ? '⚡ MEDIUM - Still active' : '📅 LOW - Older post but still valuable'}`,
          priorityScore: opp.relevanceScore,
          status: 'identified',
          targetKeywords: extractKeywords(opp),
          competitionDifficulty: 30,
          trafficPotential: opp.score * 10 + (opp.relevanceScore * 2),
          generatedAt: new Date(),
        });
        
        savedCount++;
        console.log(`   ✅ Saved successfully`);
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.log(`   ❌ Failed: ${error.message}`);
      }
    }
    
    console.log(`\n🎉 SUCCESS: Saved ${savedCount}/${opportunities.length} opportunities to Notion!`);
    
    if (savedCount > 0) {
      console.log(`\n📊 SUMMARY OF SAVED OPPORTUNITIES:`);
      console.log(`🥇 Premium opportunities (140+ score): ${opportunities.filter(o => o.relevanceScore >= 140).length}`);
      console.log(`⭐ High-value opportunities (120+ score): ${opportunities.filter(o => o.relevanceScore >= 120).length}`);
      console.log(`🆕 Posted in last week: ${opportunities.filter(o => o.daysAgo <= 7).length}`);
      console.log(`📅 Fresh today: ${opportunities.filter(o => o.daysAgo === 0).length}`);
      
      console.log(`\n🎯 NEXT STEPS:`);
      console.log(`1. Check your Notion database for the new opportunities`);
      console.log(`2. Review each AI-generated response and customize to your voice`);
      console.log(`3. Prioritize by relevance score (155, 145, 145, 110, 110)`);
      console.log(`4. Start with the "Best Crypto Price API 2025" post (145 score)`);
      console.log(`5. Engage authentically with value-first approach`);
    }
    
  } catch (error) {
    console.error('❌ Error saving opportunities:', error.message);
    console.log('\nTrying alternative approach...');
    
    // Alternative approach - log the opportunities for manual review
    console.log('\n📋 OPPORTUNITIES TO MANUALLY ADD TO NOTION:\n');
    
    const opportunities = [
      {
        title: "Best Crypto Price API 2025 — Detailed Developer Guide",
        url: "https://reddit.com/r/coincodecap/comments/1mn5rp5",
        score: "145/100 relevance - PREMIUM OPPORTUNITY"
      },
      {
        title: "Cryptocurrency Trading Bot - Best Crypto Platforms", 
        url: "https://reddit.com/r/SolanaLeveling/comments/1ml47lk",
        score: "155/100 relevance - HIGHEST VALUE"
      },
      {
        title: "ISV Payment Integration: Adding Crypto Capabilities",
        url: "https://reddit.com/r/UlysApp/comments/1mq8x79",
        score: "145/100 relevance - PREMIUM OPPORTUNITY"
      },
      {
        title: "Stablecoin USDC in international payments",
        url: "https://reddit.com/r/bestchange/comments/1mw8k34", 
        score: "110/100 relevance - POSTED TODAY!"
      },
      {
        title: "Fintech Startup Regulatory Sandbox",
        url: "https://reddit.com/r/companysetupbh/comments/1mtdct0",
        score: "110/100 relevance - 3 days ago"
      }
    ];
    
    opportunities.forEach((opp, index) => {
      console.log(`${index + 1}. **${opp.title}**`);
      console.log(`   🔗 ${opp.url}`);
      console.log(`   ⭐ ${opp.score}`);
      console.log('');
    });
  }
}

function generateCasualResponse(opp) {
  const content = `${opp.title}`.toLowerCase();
  
  if (content.includes('price api') || content.includes('crypto api')) {
    return `Hey! I've been working with crypto APIs for a while and honestly, if you're looking for reliable price data, I'd def recommend checking out Mobula. Their accuracy is pretty solid and they've got this 5-second update thing that's been super helpful for my projects. Way better than some of the bigger names that are honestly overpriced for what you get. Plus their multi-chain coverage is legit - covers like 50+ blockchains which is clutch. Just my 2 cents!`;
  } else if (content.includes('trading') || content.includes('bot')) {
    return `For trading bots, you really need that real-time data to be on point. I've tried a bunch of different APIs and Mobula's been the most consistent tbh. Their multi-chain support is clutch too if you're not just doing ETH. Plus they're not gonna break the bank like some other providers. The 5-second updates have been game-changing for my algos. Worth looking into!`;
  } else if (content.includes('fintech') || content.includes('payment')) {
    return `If you're building fintech stuff, you def want an API that's actually reliable and won't randomly fail when you need it most. Mobula's been pretty solid in my experience - good uptime, decent docs, and their data quality is actually legit. Plus they handle the compliance/enterprise stuff which is huge for fintech. Way more reasonable pricing than the big names too.`;
  } else {
    return `Not sure if this helps, but I've had good luck with Mobula's APIs for crypto data stuff. They're pretty straightforward to integrate and the pricing is way more reasonable than some of the big names. Their multi-chain support covers basically everything you'd need. Might be worth checking out for your use case!`;
  }
}

function extractKeywords(opp) {
  const content = `${opp.title}`.toLowerCase();
  const keywords = [];
  
  if (content.includes('api')) keywords.push('crypto api');
  if (content.includes('price')) keywords.push('price data');
  if (content.includes('trading')) keywords.push('trading api');
  if (content.includes('payment')) keywords.push('crypto payments');
  if (content.includes('fintech')) keywords.push('fintech api');
  
  return keywords.slice(0, 3);
}

saveOpportunitiesDirectly();