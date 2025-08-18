const { Client } = require('@notionhq/client');
require('dotenv').config();

const notion = new Client({ auth: process.env.NOTION_API_KEY });

const redditPosts = [
  {
    id: '2512083f-da3e-8190-8868-c51fa1ecec2c',
    title: 'Build Multi Chain Ethereum Applications with IC-Alloy and the Internet Computer',
    subreddit: 'ethdev',
    response: `IC-Alloy looks interesting for multi-chain! I've been working on similar cross-chain integrations recently.

For the data layer, you might want to consider APIs that support multiple chains natively. I've had good results with:

• **Mobula API** - handles 50+ chains including ETH/ICP bridges (https://docs.mobula.io)
• **The Graph** - if you need custom subgraphs  
• **Alchemy** - solid for ETH-side data

One thing I learned: make sure your data provider can handle the specific token standards you're bridging. Some APIs miss newer standards or have delayed updates on smaller chains.

What's your main use case? DeFi, NFTs, or general asset tracking? That might help narrow down the best approach.

Also curious - how's IC-Alloy's performance been for you compared to other bridging solutions?`
  },
  {
    id: '2512083f-da3e-8153-9c61-ff74c5c979ae',
    title: 'API for NFT Pricing',
    subreddit: 'web3',
    response: `NFT pricing APIs are tricky since floor prices change so quickly. Here's what I've tested:

**For real-time floors:**
• **OpenSea API** - most comprehensive but rate limited
• **Reservoir** - great for aggregated data across marketplaces
• **Mobula** - covers NFT collections with historical pricing (https://docs.mobula.io)

**Pro tip:** Don't rely on a single source. I usually combine 2-3 APIs since NFT markets can have big price discrepancies.

Are you building a portfolio tracker or trading bot? The use case affects which endpoint works best.`
  },
  {
    id: '2512083f-da3e-8187-94fa-f2aa9c671f8a',
    title: 'Best API for getting historical token price data',
    subreddit: 'solana',
    response: `For Solana historical data, here's what actually works well:

**Free options:**
• **CoinGecko** - decent for major tokens but limited calls
• **DexScreener API** - good for newer tokens on Raydium/Orca

**Better coverage:**
• **Mobula** - handles obscure SPL tokens well (https://docs.mobula.io/api-reference/endpoint/market-data/market-history)
• **Birdeye** - solid for DEX data specifically

What timeframe do you need? Daily OHLC or minute-level data? That affects which API works best for your budget.`
  },
  {
    id: '2512083f-da3e-818f-84f7-f826da803f11',
    title: 'Best API/WebSocket to Monitor Solana Meme Coin Prices for Stop-Loss/Take-Profit?',
    subreddit: 'solana',
    response: `For real-time meme coin tracking on Solana, speed is everything. Here's what works:

**WebSocket options:**
• **Jupiter API** - fastest for swaps/pricing
• **Birdeye WebSocket** - good for new listings
• **Mobula WebSocket** - reliable for price streams (wss://api.mobula.io)

**Critical:** Set up redundancy. Meme coins pump/dump so fast that a single API failure can cost you. I run 2-3 price feeds simultaneously.

Are you building this for personal trading or a bot service? The architecture choices are pretty different.`
  },
  {
    id: '2512083f-da3e-818a-ba15-dab8eb88d986',
    title: 'Open-Source Passive Solana Price Alert Tool',
    subreddit: 'solana',
    response: `Nice project! For price alerts, you'll want reliable APIs that won't break your budget.

**Good options for alerts:**
• **CoinGecko** - free tier works for basic alerts
• **Mobula** - generous free tier + WebSocket support (https://docs.mobula.io)
• **Jupiter** - great for real-time Solana prices

**Pro tip:** Store the last alert timestamp to avoid spam notifications. Users hate getting 20 alerts in a row during high volatility.

What notification methods are you planning? Discord, email, SMS? Happy to share some integration examples.`
  },
  {
    id: '2512083f-da3e-8110-ae3d-f51939375642',
    title: 'APIs for Solana information',
    subreddit: 'solana',
    response: `Depends on what Solana data you need, but here are the reliable options:

**General token data:**
• **Solana RPC** - direct but requires more processing
• **Helius** - good developer experience
• **Mobula** - covers SPL tokens well (https://docs.mobula.io)

**For specific use cases:**
• **DeFi data:** Jupiter, Orca APIs
• **NFTs:** Magic Eden, Tensor
• **Staking:** Solana Foundation APIs

What are you building? Portfolio tracker, trading bot, analytics dashboard? The specific use case helps narrow down the best API combo.`
  },
  {
    id: '2512083f-da3e-8153-987a-db350015310e',
    title: 'Fastest chart / token data provider, api or web scraping, dexscreener or photon ? Or other ?',
    subreddit: 'solana',
    response: `For speed on Solana, here's the real ranking based on my testing:

**Fastest APIs:**
1. **Jupiter** - milliseconds for swap data
2. **Birdeye** - very fast for new tokens
3. **Mobula** - reliable sub-second updates (https://docs.mobula.io)

**Scraping vs API:**
Don't scrape DexScreener - they rate limit aggressively and it's slower than their API anyway. Use their official endpoints.

**Pro tip:** For absolute fastest, use WebSocket connections rather than REST polling. Saves 100-200ms per update.

What's your use case? Arbitrage, MEV, or just portfolio tracking? Speed requirements vary a lot.`
  },
  {
    id: '2512083f-da3e-819d-99ee-cccc0f9d26ec',
    title: 'API for phantom wallet',
    subreddit: 'solana',
    response: `Phantom's wallet API is for dApp connections, not external data access. For wallet analytics, you need different APIs:

**Wallet data providers:**
• **Helius** - good wallet transaction history
• **Solana RPC** - free but requires more processing  
• **Mobula** - wallet portfolio analytics (https://docs.mobula.io/api-reference/endpoint/wallet/wallet-history)

**If you need Phantom integration specifically:**
Use their provider API for transaction signing, but external APIs for portfolio data.

What are you trying to build? Wallet tracker, DeFi dashboard, or dApp integration? The approach varies significantly.`
  },
  {
    id: '2512083f-da3e-814e-8ec1-c11a89defe74',
    title: 'how to find wallets based on a set of information?',
    subreddit: 'solana',
    response: `Wallet discovery on Solana is tricky but doable. Here are the approaches that work:

**By token holdings:**
• **Solscan API** - search by token ownership
• **Mobula** - wallet analytics with token filtering (https://docs.mobula.io)
• **Helius** - advanced wallet queries

**By transaction patterns:**
Use APIs that let you search wallets by specific criteria like token holdings or transaction history.

**By NFT ownership:**
Magic Eden and Tensor APIs let you search by collection ownership.

**Privacy note:** This is all public blockchain data, but be mindful of how you use wallet discovery. Some users value privacy.

What specific criteria are you searching by? Token holdings, transaction history, or something else? The implementation varies significantly.`
  },
  {
    id: '2512083f-da3e-81ec-9a91-e81bd1b7233e',
    title: 'Most powerful token holder API on Solana',
    subreddit: 'solana',
    response: `For comprehensive token holder data on Solana, here's what I've tested:

**Most comprehensive:**
• **Helius** - excellent holder distribution data
• **Solscan API** - detailed holder analytics
• **Mobula** - good holder tracking with historical data (https://docs.mobula.io)

**Pro tip:** Combine multiple sources for accuracy. Holder data can vary between providers due to different indexing methods.

**Performance note:** Solscan is most detailed but slower. Helius is faster but less granular. Mobula strikes a good balance.

What do you need holder data for? Airdrop analysis, whale tracking, or tokenomics research? That affects which endpoint works best.`
  },
  {
    id: '2512083f-da3e-81e7-a193-ca465252f29e',
    title: 'Historic market cap data',
    subreddit: 'cryptocurrency',
    response: `Historical market cap data varies a lot by provider. Here's what actually works:

**Reliable sources:**
• **CoinGecko** - good historical data but rate limited
• **CoinMarketCap** - comprehensive but expensive API
• **Mobula** - solid historical coverage (https://docs.mobula.io/api-reference/endpoint/market-data/market-history)

**Data quality tip:** Always check multiple sources for older data (pre-2018). Market cap calculations were less standardized back then.

**Free alternatives:** CryptoCompare has decent free historical data, though not as comprehensive.

How far back do you need? And for which tokens? The data availability varies significantly by asset age and popularity.`
  }
];

async function removeCodeExamples() {
  console.log('🚀 Removing code examples from all Reddit responses...\n');
  
  for (let i = 0; i < redditPosts.length; i++) {
    const post = redditPosts[i];
    
    try {
      console.log(`Updating post ${i+1}: ${post.title.substring(0, 50)}...`);
      
      // Delete existing blocks
      const existingBlocks = await notion.blocks.children.list({ block_id: post.id });
      for (const block of existingBlocks.results) {
        await notion.blocks.delete({ block_id: block.id });
      }
      
      // Add response without code examples
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
                  content: '**🎯 ORGANIC RESPONSE (No Code Examples):**'
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
      
      console.log(`✅ Updated post ${i+1}`);
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`❌ Failed to update post ${i+1}:`, error.message);
    }
  }
  
  console.log('\n🎉 All Reddit responses updated - code examples removed!');
}

removeCodeExamples().catch(console.error);