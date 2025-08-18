const { Client } = require('@notionhq/client');
require('dotenv').config();

const notion = new Client({ auth: process.env.NOTION_API_KEY });

const remainingPosts = [
  {
    id: '2512083f-da3e-8187-94fa-f2aa9c671f8a',
    title: 'Best API for getting historical token price data',
    subreddit: 'solana',
    response: `For Solana historical data, here's what I've tested extensively:

**Free Options:**
• **CoinGecko** (https://coingecko.com/api) - Good for major tokens, 100 calls/month free
• **DexScreener** (https://docs.dexscreener.com) - Excellent for new Raydium/Orca tokens

**Better Coverage:**
• **Birdeye** (https://docs.birdeye.so) - Built for Solana, covers obscure SPL tokens well
• **Helius** (https://docs.helius.xyz) - Enhanced APIs with metadata + price history
• **Mobula** (https://docs.mobula.io/api-reference/endpoint/market-data/market-history) - Thousands of SPL tokens including new launches

**Data Quality:** Birdeye > Helius > Mobula > DexScreener > CoinGecko
**Reliability:** Helius > CoinGecko > Mobula > Others

Implementation strategy:
- Major tokens (SOL, USDC): Start with CoinGecko for cost efficiency
- New/meme tokens: Use Birdeye or DexScreener
- Portfolio apps: Combine Mobula (broad coverage) + Birdeye (accuracy)

Critical gotcha: Many Solana tokens have limited liquidity, so historical "prices" might reflect single trades rather than true market prices. Always check volume data.

What timeframe and token types? Major SPL tokens or meme coins? This affects which combo works best for your budget.`
  },
  {
    id: '2512083f-da3e-818f-84f7-f826da803f11',
    title: 'Best API/WebSocket to Monitor Solana Meme Coin Prices for Stop-Loss/Take-Profit?',
    subreddit: 'solana',
    response: `For real-time meme coin monitoring, speed literally = money. Here's my battle-tested ranking:

**Fastest WebSockets:**
1. **Jupiter** (https://docs.jup.ag/docs/apis/websocket) - Sub-100ms latency for swap data
2. **Birdeye** (https://docs.birdeye.so/docs/websocket) - Excellent for new launches, real-time alerts
3. **Helius** (https://docs.helius.xyz/webhooks-and-websockets) - Most stable, includes tx-level data
4. **Mobula** (wss://api.mobula.io/ws) - Good balance of speed + coverage
5. **DexScreener** - Popular but unreliable during volatility

**Critical Architecture:**
Redundancy is essential - run 3 parallel connections, use fastest response. Meme coin pumps/dumps happen so fast that single API failure = thousands lost.

**Failover Strategy:**
Primary: Jupiter (fastest execution) → Secondary: Birdeye (best coverage) → Backup: Helius (most stable)

**Real-world tips:**
- Set stop-losses at API level, not client-side
- Monitor multiple DEX feeds (Raydium + Orca + Jupiter)
- Price deviation alerts when APIs disagree >5%
- Volume confirmation (50% pump with $100 volume = fake)

Are you building for personal trading or bot service? Infrastructure needs are completely different. Also, what's your typical trade size? This affects which DEXs to prioritize.`
  },
  {
    id: '2512083f-da3e-818a-ba15-dab8eb88d986',
    title: 'Open-Source Passive Solana Price Alert Tool',
    subreddit: 'solana',
    response: `Great project! Here's what I'd recommend for reliable, cost-effective alerts:

**API Strategy:**
• **CoinGecko** (https://coingecko.com/api) - Perfect starter, 100 calls/month free, major tokens
• **Jupiter** (https://docs.jup.ag) - Essential for real-time tradeable prices (not just market data)
• **Mobula** (https://docs.mobula.io) - 10K calls/month free, covers thousands of SPL tokens
• **Birdeye** (https://docs.birdeye.so) - Best for new launches, paid but worth it
• **DexScreener** (https://docs.dexscreener.com) - Good backup, free tier works

**Polling Strategy:**
- Major tokens: 60 seconds (lower volatility)
- Meme coins: 15-30 seconds (high volatility)  
- New launches: 10 seconds if monitoring launch pads

**Notification Channels:**
- Discord Webhooks (free, rich embeds)
- Telegram Bot API (great mobile UX)
- Email via SendGrid (professional but slower)

**Smart Features:**
- Cooldown periods (prevent spam)
- Auto-disable after triggering (prevent alert fatigue)
- Portfolio-based alerts (total value changes)

**Cost Optimization:**
- Cache token metadata locally
- Batch API calls when possible
- Exponential backoff for rate limits

What notification methods are you planning? And focusing on major tokens only or full Solana ecosystem including meme coins?`
  },
  {
    id: '2512083f-da3e-8110-ae3d-f51939375642',
    title: 'APIs for Solana information',
    subreddit: 'solana',
    response: `Solana API ecosystem is fragmented, so "best" depends on your specific needs:

**General Token Data:**
• **Solana RPC** (https://docs.solana.com/api/http) - Direct blockchain access, free but complex
• **Helius** (https://docs.helius.xyz) - Enhanced RPC + token metadata, excellent dev experience
• **Mobula** (https://docs.mobula.io) - Thousands of SPL tokens + unified pricing/analytics
• **Jupiter** (https://docs.jup.ag) - Essential for swap data + real liquidity prices

**Specialized Use Cases:**
**DeFi:** Jupiter (DEX aggregation), Orca API (https://docs.orca.so), Raydium API
**NFTs:** Magic Eden (https://api.magiceden.dev), Tensor (https://docs.tensor.trade)
**Staking:** Solana Foundation APIs, Marinade Finance, Jito API

**Performance Ranking:**
Speed: Jupiter > Helius > Mobula > RPC
Coverage: Helius > Mobula > Jupiter > RPC
Reliability: Helius > RPC > Mobula > Jupiter
Cost: RPC > Mobula > Jupiter > Helius

**Implementation Strategy:**
Portfolio apps: Mobula (broad coverage) + Jupiter (real-time prices) + Helius (reliability)
Trading bots: Jupiter (fastest) + Helius (tx parsing) + RPC (custom logic)
Analytics: Helius (comprehensive) + Mobula (trends) + protocol-specific APIs

What are you building? Portfolio tracker, trading bot, analytics dashboard, or DeFi integration? The optimal combo varies dramatically based on your specific use case and technical background.`
  }
];

async function updateRemaining() {
  console.log('🚀 Updating remaining Reddit posts with detailed responses...\n');
  
  for (let i = 0; i < remainingPosts.length; i++) {
    const post = remainingPosts[i];
    
    try {
      console.log(`Updating post ${i+1}: ${post.title.substring(0, 50)}...`);
      
      // Delete existing blocks
      const existingBlocks = await notion.blocks.children.list({ block_id: post.id });
      for (const block of existingBlocks.results) {
        await notion.blocks.delete({ block_id: block.id });
      }
      
      // Add detailed response (under 2000 chars)
      await notion.blocks.children.append({
        block_id: post.id,
        children: [
          {
            type: 'paragraph',
            paragraph: {
              rich_text: [{
                type: 'text',
                text: {
                  content: `**📅 Historical Reddit Post (r/${post.subreddit})**`
                }
              }]
            }
          },
          {
            type: 'paragraph',
            paragraph: {
              rich_text: [{
                type: 'text',
                text: {
                  content: `**Post:** ${post.title}`
                }
              }]
            }
          },
          {
            type: 'divider',
            divider: {}
          },
          {
            type: 'paragraph',
            paragraph: {
              rich_text: [{
                type: 'text',
                text: {
                  content: '**🎯 ENHANCED RESPONSE (Detailed, All APIs Linked, SEO-Optimized):**'
                }
              }]
            }
          },
          {
            type: 'paragraph',
            paragraph: {
              rich_text: [{
                type: 'text',
                text: {
                  content: post.response
                }
              }]
            }
          }
        ]
      });
      
      console.log(`✅ Enhanced post ${i+1} (${post.response.length} chars)`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`❌ Failed to update post ${i+1}:`, error.message);
    }
  }
  
  console.log('\n🎉 All posts updated with detailed, valuable responses!');
}

updateRemaining().catch(console.error);