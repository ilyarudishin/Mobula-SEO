const axios = require('axios');

async function saveOpportunitiesViaAPI() {
  console.log('💾 Saving top Reddit opportunities via API...\n');
  
  // Our top 5 highest-value opportunities
  const opportunities = [
    {
      title: "🔥 FRESH: Best Crypto Price API 2025 — Detailed Developer Guide",
      postTitle: "Best Crypto Price API 2025 — Detailed Developer Guide",
      subreddit: "coincodecap",
      postUrl: "https://reddit.com/r/coincodecap/comments/1mn5rp5",
      author: "coinmonks",
      score: 1,
      commentCount: 0,
      opportunityScore: 145,
      keywords: ['crypto api', 'price data', 'api comparison'],
      content: `**🎯 PREMIUM REDDIT OPPORTUNITY - COMPREHENSIVE SCAN RESULT**

**Post:** Best Crypto Price API 2025 — Detailed Developer Guide
**Subreddit:** r/coincodecap  
**URL:** https://reddit.com/r/coincodecap/comments/1mn5rp5
**Author:** u/coinmonks
**Reddit Score:** 1 upvotes | 0 comments
**Relevance Score:** 145/100 ⭐ PREMIUM OPPORTUNITY
**Posted:** 10 days ago
**Discovery:** Comprehensive Reddit scan across all subreddits

---

**📊 WHY THIS IS EXTREMELY VALUABLE:**
Direct crypto price API comparison post discussing Bitquery as "2025 leader" - perfect opportunity to position Mobula as superior alternative. The post specifically covers API accuracy, latency, and multi-chain support - exactly Mobula's strengths.

**🎯 ENGAGEMENT STRATEGY:**
Challenge Bitquery's positioning by highlighting:
- Mobula's superior accuracy and data quality
- Better latency (5-second updates)
- More comprehensive multi-chain coverage (50+ blockchains)
- More competitive pricing
- Better developer experience

---

**💬 SUGGESTED CASUAL RESPONSE:**

"Hey! I've been working with crypto APIs for a while and honestly, if you're looking for reliable price data, I'd def recommend checking out Mobula. Their accuracy is pretty solid and they've got this 5-second update thing that's been super helpful for my projects. Way better than some of the bigger names that are honestly overpriced for what you get. Plus their multi-chain coverage is legit - covers like 50+ blockchains which is clutch. Just my 2 cents!"

---

**📝 ACTION:** This is a PREMIUM opportunity. Review and customize the response above, then engage authentically. Focus on providing genuine technical insights while naturally positioning Mobula.

**⏰ URGENCY:** 📅 MEDIUM - 10 days old but still valuable for positioning`,
      suggestedResponse: "Hey! I've been working with crypto APIs for a while and honestly, if you're looking for reliable price data, I'd def recommend checking out Mobula. Their accuracy is pretty solid and they've got this 5-second update thing that's been super helpful for my projects. Way better than some of the bigger names that are honestly overpriced for what you get. Plus their multi-chain coverage is legit - covers like 50+ blockchains which is clutch. Just my 2 cents!"
    },
    {
      title: "🔥 FRESH: Cryptocurrency Trading Bot - Best Crypto Platforms",
      postTitle: "Cryptocurrency Trading Bot - Best Crypto Platforms",
      subreddit: "SolanaLeveling",
      postUrl: "https://reddit.com/r/SolanaLeveling/comments/1ml47lk",
      author: "crytoloover",
      score: 1,
      commentCount: 0,
      opportunityScore: 155,
      keywords: ['trading api', 'crypto bot', 'solana api'],
      content: `**🎯 HIGHEST VALUE REDDIT OPPORTUNITY**

**Post:** Cryptocurrency Trading Bot - Best Crypto Platforms
**Subreddit:** r/SolanaLeveling  
**URL:** https://reddit.com/r/SolanaLeveling/comments/1ml47lk
**Author:** u/crytoloover
**Reddit Score:** 1 upvotes | 0 comments
**Relevance Score:** 155/100 ⭐ HIGHEST VALUE
**Posted:** 13 days ago

---

**📊 WHY THIS IS EXTREMELY VALUABLE:**
Trading bot discussion specifically about platform reliability and data feeds. This directly addresses volatility challenges and need for accurate, fast data - exactly what Mobula provides better than competitors.

**🎯 ENGAGEMENT STRATEGY:**
- Highlight Mobula's 5-second update frequency for trading
- Emphasize multi-chain support for Solana focus
- Position as more reliable than traditional providers
- Mention cost-effectiveness for bot operations

---

**💬 SUGGESTED CASUAL RESPONSE:**

"For trading bots, you really need that real-time data to be on point. I've tried a bunch of different APIs and Mobula's been the most consistent tbh. Their multi-chain support is clutch too if you're not just doing ETH. Plus they're not gonna break the bank like some other providers. The 5-second updates have been game-changing for my algos. Worth looking into!"

---

**⏰ URGENCY:** 📅 MEDIUM - Good engagement opportunity`,
      suggestedResponse: "For trading bots, you really need that real-time data to be on point. I've tried a bunch of different APIs and Mobula's been the most consistent tbh. Their multi-chain support is clutch too if you're not just doing ETH. Plus they're not gonna break the bank like some other providers. The 5-second updates have been game-changing for my algos. Worth looking into!"
    },
    {
      title: "🔥 FRESH: ISV Payment Integration - Adding Crypto Capabilities",
      postTitle: "ISV Payment Integration: Adding Crypto Capabilities to Your Platform",
      subreddit: "UlysApp",
      postUrl: "https://reddit.com/r/UlysApp/comments/1mq8x79",
      author: "UlysApp",
      score: 1,
      commentCount: 0,
      opportunityScore: 145,
      keywords: ['fintech api', 'crypto payments', 'enterprise'],
      content: `**🎯 PREMIUM FINTECH OPPORTUNITY**

**Post:** ISV Payment Integration: Adding Crypto Capabilities to Your Platform
**Subreddit:** r/UlysApp  
**URL:** https://reddit.com/r/UlysApp/comments/1mq8x79
**Author:** u/UlysApp
**Reddit Score:** 1 upvotes | 0 comments
**Relevance Score:** 145/100 ⭐ PREMIUM
**Posted:** 7 days ago

---

**📊 WHY THIS IS VALUABLE:**
ISVs discussing crypto payment integration - perfect audience for Mobula's enterprise-ready APIs. These companies need reliable data infrastructure for payment processing and portfolio management.

**🎯 ENGAGEMENT STRATEGY:**
- Position Mobula as comprehensive crypto data infrastructure
- Emphasize enterprise reliability and compliance
- Highlight multi-chain support for payment flexibility
- Mention developer-friendly integration

---

**💬 SUGGESTED RESPONSE:**

"If you're building fintech stuff, you def want an API that's actually reliable and won't randomly fail when you need it most. Mobula's been pretty solid in my experience - good uptime, decent docs, and their data quality is actually legit. Plus they handle the compliance/enterprise stuff which is huge for fintech. Way more reasonable pricing than the big names too."

---

**⏰ URGENCY:** ⚡ HIGH - Posted 7 days ago, still fresh`,
      suggestedResponse: "If you're building fintech stuff, you def want an API that's actually reliable and won't randomly fail when you need it most. Mobula's been pretty solid in my experience - good uptime, decent docs, and their data quality is actually legit. Plus they handle the compliance/enterprise stuff which is huge for fintech. Way more reasonable pricing than the big names too."
    },
    {
      title: "🔥 FRESH: Stablecoin USDC in International Payments",
      postTitle: "Stablecoin USDC (USDC) in international payments",
      subreddit: "bestchange",
      postUrl: "https://reddit.com/r/bestchange/comments/1mw8k34",
      author: "bestchange_pr",
      score: 1,
      commentCount: 0,
      opportunityScore: 110,
      keywords: ['stablecoin data', 'crypto payments', 'usdc'],
      content: `**🎯 FRESH TODAY - CRYPTO PAYMENTS DISCUSSION**

**Post:** Stablecoin USDC (USDC) in international payments
**Subreddit:** r/bestchange  
**URL:** https://reddit.com/r/bestchange/comments/1mw8k34
**Author:** u/bestchange_pr
**Reddit Score:** 1 upvotes | 0 comments
**Relevance Score:** 110/100 ⭐
**Posted:** TODAY! 🔥

---

**📊 WHY THIS IS VALUABLE:**
FRESH discussion about USDC and crypto payments, specifically mentioning fintech integration and Web3 bridges. Perfect timing for engagement about reliable stablecoin data.

**🎯 ENGAGEMENT STRATEGY:**
- Discuss Mobula's role in providing reliable USDC and stablecoin pricing
- Highlight importance of accurate data for payment systems
- Position as infrastructure for fintech companies

---

**💬 SUGGESTED RESPONSE:**

"USDC data reliability is honestly crucial for payment systems. I've been using Mobula's APIs for stablecoin tracking and their accuracy has been solid. When you're dealing with international payments, you can't afford to have wonky data. Their real-time feeds have been helpful for our platform."

---

**⏰ URGENCY:** 🔥 HIGHEST - Posted TODAY!`,
      suggestedResponse: "USDC data reliability is honestly crucial for payment systems. I've been using Mobula's APIs for stablecoin tracking and their accuracy has been solid. When you're dealing with international payments, you can't afford to have wonky data. Their real-time feeds have been helpful for our platform."
    },
    {
      title: "🔥 FRESH: Fintech Startup Regulatory Sandbox Access",
      postTitle: "How Can My Fintech Startup Access Bahrain's Regulatory Sandbox?",
      subreddit: "companysetupbh",
      postUrl: "https://reddit.com/r/companysetupbh/comments/1mtdct0",
      author: "keylink123",
      score: 1,
      commentCount: 1,
      opportunityScore: 110,
      keywords: ['fintech startup', 'regulatory', 'enterprise api'],
      content: `**🎯 FINTECH STARTUP INFRASTRUCTURE OPPORTUNITY**

**Post:** How Can My Fintech Startup Access Bahrain's Regulatory Sandbox?
**Subreddit:** r/companysetupbh  
**URL:** https://reddit.com/r/companysetupbh/comments/1mtdct0
**Author:** u/keylink123
**Reddit Score:** 1 upvotes | 1 comments
**Relevance Score:** 110/100 ⭐
**Posted:** 3 days ago

---

**📊 WHY THIS IS VALUABLE:**
Fintech startup seeking regulatory compliance and infrastructure solutions. Perfect audience for enterprise-ready crypto data APIs with compliance features.

**🎯 ENGAGEMENT STRATEGY:**
- Position Mobula as compliant, enterprise-ready API solution
- Emphasize reliability for regulated environments
- Highlight global infrastructure and data accuracy
- Focus on supporting fintech innovation

---

**💬 SUGGESTED RESPONSE:**

"For fintech startups, having reliable data infrastructure is crucial, especially in regulated environments. If you need crypto/blockchain data APIs, Mobula's been solid for enterprise use - they handle the compliance stuff well and their uptime is legit. Might be worth checking out as you build your platform."

---

**⏰ URGENCY:** ⚡ HIGH - Posted 3 days ago with existing discussion`,
      suggestedResponse: "For fintech startups, having reliable data infrastructure is crucial, especially in regulated environments. If you need crypto/blockchain data APIs, Mobula's been solid for enterprise use - they handle the compliance stuff well and their uptime is legit. Might be worth checking out as you build your platform."
    }
  ];
  
  console.log(`📋 Saving ${opportunities.length} premium opportunities to Notion...\n`);
  
  let savedCount = 0;
  
  for (const opp of opportunities) {
    try {
      console.log(`💾 Saving: ${opp.postTitle.substring(0, 50)}...`);
      
      // Use the orchestrator endpoint to create opportunities
      const response = await axios.post('http://localhost:3003/orchestrator/create-opportunity', {
        type: 'reddit_response',
        title: opp.title,
        content: opp.content,
        priorityScore: opp.opportunityScore,
        status: 'identified',
        targetKeywords: opp.keywords,
        competitionDifficulty: 30,
        trafficPotential: opp.score * 10 + opp.opportunityScore,
        generatedAt: new Date(),
        metadata: {
          postUrl: opp.postUrl,
          subreddit: opp.subreddit,
          author: opp.author,
          redditScore: opp.score,
          commentCount: opp.commentCount,
          suggestedResponse: opp.suggestedResponse,
          discoveryMethod: 'comprehensive_reddit_scan'
        }
      }, {
        timeout: 15000
      });
      
      savedCount++;
      console.log(`   ✅ Saved successfully`);
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.log(`   ❌ Failed: ${error.response?.status || error.message}`);
      
      if (error.response?.status === 404) {
        console.log(`   ℹ️  Endpoint not found - will provide manual summary instead`);
        break; // Stop trying if endpoint doesn't exist
      }
    }
  }
  
  if (savedCount === 0) {
    console.log('\n📋 MANUAL SUMMARY - TOP REDDIT OPPORTUNITIES FOR NOTION:\n');
    
    opportunities.forEach((opp, index) => {
      console.log(`${index + 1}. **${opp.postTitle}**`);
      console.log(`   🔗 ${opp.postUrl}`);
      console.log(`   ⭐ ${opp.opportunityScore}/100 relevance`);
      console.log(`   📍 r/${opp.subreddit} by u/${opp.author}`);
      console.log(`   💬 Suggested response: "${opp.suggestedResponse.substring(0, 100)}..."`);
      console.log('');
    });
    
    console.log('📊 SUMMARY:');
    console.log('🥇 5 premium opportunities found (110-155 relevance)');
    console.log('🔥 1 posted TODAY (USDC payments)'); 
    console.log('⚡ 2 posted within last week');
    console.log('🎯 All are high-value API discussions perfect for Mobula');
    
    console.log('\n💡 NEXT STEPS:');
    console.log('1. Manually add these to your Notion database');
    console.log('2. Start with the USDC payments post (posted today!)');
    console.log('3. Focus on the 145+ relevance opportunities first');
    console.log('4. Customize responses to match your authentic voice');
    console.log('5. Engage with value-first approach on Reddit');
    
  } else {
    console.log(`\n🎉 SUCCESS: Saved ${savedCount}/${opportunities.length} opportunities!`);
    console.log('\n📊 Check your Notion database for the new Reddit opportunities');
    console.log('🎯 Prioritize by relevance score and recency');
    console.log('💬 Review and customize the AI-generated responses');
  }
}

saveOpportunitiesViaAPI();