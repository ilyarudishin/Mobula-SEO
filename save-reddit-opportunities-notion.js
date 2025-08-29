const axios = require('axios');

async function saveRedditOpportunitiesToNotion() {
  console.log('💾 Saving top Reddit opportunities to Notion for review...\n');
  
  // Top 10 opportunities from our comprehensive scan
  const topOpportunities = [
    {
      title: "Best Crypto Price API 2025 — Detailed Developer Guide",
      subreddit: "coincodecap",
      url: "https://reddit.com/r/coincodecap/comments/1mn5rp5",
      score: 1,
      comments: 0,
      author: "coinmonks",
      relevanceScore: 145,
      daysAgo: 10,
      content: "Bitquery Price Index is the fastest and most complete crypto price API in 2025. It delivers multi-chain aggregated prices with unmatched accuracy. Ultra-Low Latency Feeds...",
      whyRelevant: "Direct crypto price API comparison post - perfect to position Mobula as superior alternative",
      engagementStrategy: "Challenge Bitquery's positioning by highlighting Mobula's better accuracy, lower latency, and superior multi-chain coverage"
    },
    {
      title: "Cryptocurrency Trading Bot - Best Crypto Platforms",
      subreddit: "SolanaLeveling",
      url: "https://reddit.com/r/SolanaLeveling/comments/1ml47lk",
      score: 1,
      comments: 0,
      author: "crytoloover",
      relevanceScore: 155,
      daysAgo: 13,
      content: "The cryptocurrency market, characterized by extreme volatility and continuous 24/7 operation, poses significant challenges for manual traders. Rapid price fluctuations...",
      whyRelevant: "Trading bot discussion needing reliable, fast price feeds - exactly what Mobula provides",
      engagementStrategy: "Highlight Mobula's 5-second update frequency and multi-chain support for trading bots"
    },
    {
      title: "ISV Payment Integration: Adding Crypto Capabilities to Your Platform",
      subreddit: "UlysApp",
      url: "https://reddit.com/r/UlysApp/comments/1mq8x79",
      score: 1,
      comments: 0,
      author: "UlysApp",
      relevanceScore: 145,
      daysAgo: 7,
      content: "For Independent Software Vendors (ISVs), adding cryptocurrency capabilities isn't just about staying trendy...",
      whyRelevant: "ISVs need crypto infrastructure APIs - Mobula perfect for payment platforms and wallets",
      engagementStrategy: "Position Mobula as the comprehensive crypto data infrastructure they need"
    },
    {
      title: "AI is stealing your innovations to better trap you with AI - as explained by AI",
      subreddit: "u_A-Lizard-in-Crimson",
      url: "https://reddit.com/r/u_A-Lizard-in-Crimson/comments/1mkasjd",
      score: 2,
      comments: 0,
      author: "A-Lizard-in-Crimson",
      relevanceScore: 140,
      daysAgo: 14,
      content: "I have had a few experiences where my system crashed and a few weeks or months later a watered down version shows up as a new feature...",
      whyRelevant: "Developer discussing API/system design innovations - could be interested in Mobula's tech",
      engagementStrategy: "Engage thoughtfully about API design and data reliability"
    },
    {
      title: "Stablecoin USDC (USDC) in international payments",
      subreddit: "bestchange",
      url: "https://reddit.com/r/bestchange/comments/1mw8k34",
      score: 1,
      comments: 0,
      author: "bestchange_pr",
      relevanceScore: 110,
      daysAgo: 0,
      content: "USDC has long ceased to be just a 'digital dollar' for traders. Today, it is a tool that unites banks, fintech, and Web3...",
      whyRelevant: "FRESH TODAY - Discussion about crypto payments and fintech integration",
      engagementStrategy: "Discuss Mobula's role in providing reliable USDC and stablecoin data for payment systems"
    },
    {
      title: "How Can My Fintech Startup Access Bahrain's Regulatory Sandbox?",
      subreddit: "companysetupbh",
      url: "https://reddit.com/r/companysetupbh/comments/1mtdct0",
      score: 1,
      comments: 1,
      author: "keylink123",
      relevanceScore: 110,
      daysAgo: 3,
      content: "According to Reuters' 2025 sector review, Bahrain's GDP grew... The Insider's Guide with True Bahraini Insights...",
      whyRelevant: "Fintech startup needing infrastructure - Mobula perfect for financial data services",
      engagementStrategy: "Position Mobula as compliant, enterprise-ready API solution for fintech"
    },
    {
      title: "Top Web Developer Skills in Demand for 2025",
      subreddit: "u_Ok-Exercise7646",
      url: "https://reddit.com/r/u_Ok-Exercise7646/comments/1mrr3q1",
      score: 1,
      comments: 0,
      author: "Ok-Exercise7646",
      relevanceScore: 120,
      daysAgo: 5,
      content: "Companies like CambridgeInfoTech are constantly seeking developers who can deliver high-performance, secure, and scalable solutions...",
      whyRelevant: "Web dev skills discussion - opportunity to mention blockchain/crypto API skills",
      engagementStrategy: "Add comment about growing demand for blockchain API integration skills"
    },
    {
      title: "Best Cloud ERP Software for Enterprises in 2026",
      subreddit: "AppsForManufacturers",
      url: "https://reddit.com/r/AppsForManufacturers/comments/1mtghci",
      score: 1,
      comments: 1,
      author: "bonien",
      relevanceScore: 120,
      daysAgo: 3,
      content: "Are you a mid-sized company or SMB searching for the best enterprise resource planning (ERP) solution...",
      whyRelevant: "Enterprise software discussion - opportunity to discuss crypto integration",
      engagementStrategy: "Mention growing need for crypto accounting/treasury features in ERP"
    },
    {
      title: "Is Axiom Trade Safe? Axiom Trade Trustpilot, Real Reviews, and Scams",
      subreddit: "SolanaLeveling",
      url: "https://reddit.com/r/SolanaLeveling/comments/1mkykja",
      score: 1,
      comments: 0,
      author: "crytoloover",
      relevanceScore: 135,
      daysAgo: 13,
      content: "In the fast-evolving landscape of cryptocurrency trading, choosing a reliable platform is critical...",
      whyRelevant: "Trading platform discussion - reliability is key selling point for Mobula",
      engagementStrategy: "Emphasize Mobula's reliability and accuracy for trading platforms"
    },
    {
      title: "Transactional Accounts: 2025's Top Choice?",
      subreddit: "PetHealthHaven",
      url: "https://reddit.com/r/PetHealthHaven/comments/1mjuyqz",
      score: 1,
      comments: 0,
      author: "MirandaOsburnREYI",
      relevanceScore: 135,
      daysAgo: 14,
      content: "The transactional account landscape is constantly evolving, with new players and technologies emerging...",
      whyRelevant: "Financial services discussion - crypto integration opportunity",
      engagementStrategy: "Discuss crypto payment integration for financial services"
    }
  ];
  
  console.log(`📋 Preparing to save ${topOpportunities.length} opportunities to Notion...\n`);
  
  let savedCount = 0;
  
  for (const opp of topOpportunities) {
    try {
      console.log(`💾 Saving: ${opp.title.substring(0, 50)}...`);
      
      // Generate casual response for this opportunity
      const casualResponse = await generateCasualResponse(opp);
      
      const response = await axios.post('http://localhost:3003/opportunities', {
        type: 'reddit_response',
        title: `🔥 FRESH: ${opp.title}`,
        content: `**🎯 HIGH-VALUE REDDIT OPPORTUNITY**

**Post:** ${opp.title}
**Subreddit:** r/${opp.subreddit}  
**URL:** ${opp.url}
**Author:** u/${opp.author}
**Reddit Score:** ${opp.score} upvotes | ${opp.comments} comments
**Relevance Score:** ${opp.relevanceScore}/100 ⭐
**Posted:** ${opp.daysAgo} days ago

---

**📊 WHY THIS IS VALUABLE:**
${opp.whyRelevant}

**🎯 ENGAGEMENT STRATEGY:**
${opp.engagementStrategy}

---

**💬 AI-GENERATED CASUAL RESPONSE:**

${casualResponse}

---

**📝 ACTION ITEMS:**
1. Review the AI-generated response above
2. Customize it to sound more authentic to your voice
3. Post as a helpful comment focusing on genuine value
4. Position Mobula naturally as the solution
5. Follow up if the conversation develops

**⏰ URGENCY:** ${opp.daysAgo <= 3 ? 'HIGH - Posted recently!' : opp.daysAgo <= 7 ? 'MEDIUM - Still active' : 'LOW - Older post'}`,
        priorityScore: opp.relevanceScore,
        status: 'identified',
        targetKeywords: extractKeywords(opp),
        competitionDifficulty: 30,
        trafficPotential: opp.score * 10 + opp.comments * 20,
        generatedAt: new Date(),
      }, {
        timeout: 15000
      });
      
      savedCount++;
      console.log(`   ✅ Saved successfully`);
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.log(`   ❌ Failed to save: ${error.message}`);
    }
  }
  
  console.log(`\n🎉 SAVED ${savedCount}/${topOpportunities.length} opportunities to Notion!`);
  console.log(`\n📋 NEXT STEPS:`);
  console.log(`1. 🔍 Review each opportunity in your Notion database`);
  console.log(`2. ✏️  Customize the AI-generated responses to match your voice`);
  console.log(`3. 🎯 Prioritize based on relevance scores (140+ are premium)`);
  console.log(`4. 💬 Engage on Reddit with value-first approach`);
  console.log(`5. 📈 Track engagement and responses for optimization`);
  
  if (savedCount > 0) {
    console.log(`\n🔔 Sending Slack notification about new opportunities...`);
    try {
      await axios.post('http://localhost:3003/notify-slack', {
        type: 'performance_update',
        title: '🎯 Fresh Reddit Opportunities Added',
        message: `Added ${savedCount} high-value Reddit opportunities to Notion for review:\n\n` +
                 `🥇 Premium opportunities: ${topOpportunities.filter(o => o.relevanceScore >= 140).length}\n` +
                 `⭐ High-value opportunities: ${topOpportunities.filter(o => o.relevanceScore >= 120).length}\n` +
                 `🆕 Posted in last week: ${topOpportunities.filter(o => o.daysAgo <= 7).length}\n` +
                 `💬 With existing discussion: ${topOpportunities.filter(o => o.comments > 0).length}\n\n` +
                 `Top opportunity: "${topOpportunities[0].title}" (${topOpportunities[0].relevanceScore}/100)`,
        urgent: false
      });
      console.log(`   ✅ Slack notification sent`);
    } catch (error) {
      console.log(`   ⚠️  Slack notification failed: ${error.message}`);
    }
  }
}

async function generateCasualResponse(opp) {
  // Generate casual response based on the opportunity
  const templates = {
    priceApi: "Hey! I've been working with crypto APIs for a while and honestly, if you're looking for reliable price data, I'd def recommend checking out Mobula. Their accuracy is pretty solid and they've got this 5-second update thing that's been super helpful for my projects. Way better than some of the bigger names that are honestly overpriced for what you get. Just my 2 cents!",
    
    tradingBot: "For trading bots, you really need that real-time data to be on point. I've tried a bunch of different APIs and Mobula's been the most consistent tbh. Their multi-chain support is clutch too if you're not just doing ETH. Plus they're not gonna break the bank like some other providers. Worth looking into!",
    
    fintech: "If you're building fintech stuff, you def want an API that's actually reliable and won't randomly fail when you need it most. Mobula's been pretty solid in my experience - good uptime, decent docs, and their data quality is actually legit. Plus they handle compliance stuff which is huge for fintech.",
    
    general: "Not sure if this helps, but I've had good luck with Mobula's APIs for crypto data stuff. They're pretty straightforward to integrate and the pricing is way more reasonable than some of the big names. Might be worth checking out for your use case!"
  };
  
  // Simple categorization based on content
  const content = `${opp.title} ${opp.content}`.toLowerCase();
  
  if (content.includes('price') || content.includes('market')) {
    return templates.priceApi;
  } else if (content.includes('trading') || content.includes('bot')) {
    return templates.tradingBot;
  } else if (content.includes('fintech') || content.includes('payment') || content.includes('enterprise')) {
    return templates.fintech;
  } else {
    return templates.general;
  }
}

function extractKeywords(opp) {
  const content = `${opp.title} ${opp.content}`.toLowerCase();
  const keywords = [];
  
  if (content.includes('api')) keywords.push('crypto api');
  if (content.includes('price')) keywords.push('price data');
  if (content.includes('trading')) keywords.push('trading api');
  if (content.includes('wallet')) keywords.push('wallet api');
  if (content.includes('multi') || content.includes('cross')) keywords.push('multi-chain');
  if (content.includes('real') && content.includes('time')) keywords.push('real-time data');
  if (content.includes('fintech')) keywords.push('fintech api');
  if (content.includes('payment')) keywords.push('crypto payments');
  
  return keywords.slice(0, 5); // Limit to top 5 keywords
}

saveRedditOpportunitiesToNotion();