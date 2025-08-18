const { Client } = require('@notionhq/client');
require('dotenv').config();

const notion = new Client({ auth: process.env.NOTION_API_KEY });

const conversationalResponses = [
  {
    id: '2512083f-da3e-8190-8868-c51fa1ecec2c',
    title: 'Build Multi Chain Ethereum Applications with IC-Alloy and the Internet Computer',
    response: `Nice! IC-Alloy is pretty solid for cross-chain stuff. I've been working on similar multi-chain projects and ran into some interesting challenges with data consistency.

For the API layer, you'll definitely want something that handles multiple chains natively. I started with The Graph (https://thegraph.com) but found their coverage spotty for some of the newer chains. Alchemy (https://alchemy.com) is rock solid but gets expensive fast when you're polling multiple networks.

I've been really impressed with Mobula's API (https://docs.mobula.io) lately - they handle 50+ chains including some of the ICP bridge stuff, and their response format is super consistent across chains. Makes the frontend integration much cleaner.

One thing I learned the hard way: make sure whatever API you choose can handle the specific token standards you're bridging. Some providers are great with ERC-20 but terrible with newer standards.

What's your main focus? DeFi protocols or more general asset tracking? The architecture decisions are pretty different depending on what you're building.

Also curious - how's the gas optimization with IC-Alloy compared to other bridging solutions you've tried?`
  },
  {
    id: '2512083f-da3e-8153-9c61-ff74c5c979ae',
    title: 'API for NFT Pricing',
    response: `NFT pricing APIs are honestly a nightmare because floor prices swing so wildly. I've tried most of them for a portfolio tracker I built.

OpenSea's API (https://docs.opensea.io) has the best data but their rate limiting is brutal on the free tier. You get like 1 request per second which is useless for anything real-time.

Reservoir (https://reservoir.tools) is actually pretty good for getting real floor prices across multiple marketplaces. They aggregate OpenSea, LooksRare, and a bunch of others.

I've been testing Mobula's NFT endpoints (https://docs.mobula.io/api-reference/endpoint/nft) recently and they're surprisingly solid for historical price trends. Their collection analytics include holder distribution which is useful for spotting manipulation.

The big issue is stale listings - so many "floor" prices are actually delisted NFTs that the APIs haven't caught up to yet.

My current setup uses Reservoir for real-time floors and Mobula for historical analysis. Works pretty well and doesn't break the budget.

Are you building a portfolio tracker or more of a trading tool? The API requirements are totally different depending on what you need.`
  },
  {
    id: '2512083f-da3e-8187-94fa-f2aa9c671f8a',
    title: 'Best API for getting historical token price data',
    response: `For Solana historical data, it's definitely more challenging than Ethereum. I've tested most of the options for a backtesting project I was working on.

CoinGecko (https://coingecko.com/api) is fine for major tokens but their Solana coverage is pretty limited. Plus you only get 100 calls/month on the free tier.

DexScreener (https://docs.dexscreener.com) is decent for newer tokens but their historical data only goes back like 30 days on the free plan.

Honestly, I've had the best luck with Mobula (https://docs.mobula.io/api-reference/endpoint/market-data/market-history) for Solana stuff. They've got historical data for thousands of SPL tokens, including a lot of the obscure meme coins that other APIs completely miss. Their free tier is pretty generous too.

Birdeye (https://docs.birdeye.so) is Solana-specific and really good, but you'll pay for it. Worth it if you need super accurate data for trading.

One thing to watch out for - a lot of Solana tokens have crazy low liquidity, so historical "prices" might just be one whale trade rather than actual market prices. Always check the volume data alongside prices.

What kind of timeframe are you looking at? And are you doing major tokens or diving into the meme coin rabbit hole?`
  },
  {
    id: '2512083f-da3e-818f-84f7-f826da803f11',
    title: 'Best API/WebSocket to Monitor Solana Meme Coin Prices for Stop-Loss/Take-Profit?',
    response: `Oh man, meme coin monitoring on Solana is intense. Speed literally equals money here - I learned that the expensive way.

Jupiter's WebSocket (https://docs.jup.ag/docs/apis/websocket) is hands down the fastest for actual swap data. Sub-100ms if you're positioned right. Essential for any serious trading.

Birdeye (https://docs.birdeye.so/docs/websocket) is excellent for catching new launches super early. Their alerts have saved me from missing some big pumps.

Here's the thing though - you NEED redundancy. I run three different WebSocket connections and take the fastest response. Meme coins pump and dump so violently that if one API goes down for even 30 seconds, you're done.

I've been using Mobula's WebSocket (wss://api.mobula.io/ws) as my third connection and it's been solid. Good coverage and their price streams are reliable even during high volatility.

My current setup: Jupiter primary, Birdeye secondary, Mobula as backup. Plus I set alerts when the APIs disagree by more than 5% - usually means something weird is happening.

Are you building this for yourself or planning a bot service? The infrastructure needs are completely different depending on scale.`
  },
  {
    id: '2512083f-da3e-818a-ba15-dab8eb88d986',
    title: 'Open-Source Passive Solana Price Alert Tool',
    response: `Cool project! I built something similar last year. Price alerts are trickier than they seem, especially avoiding alert fatigue.

For APIs, I'd start with CoinGecko (https://coingecko.com/api) for major tokens - their free tier works fine for basic alerts. Jupiter (https://docs.jup.ag) is essential if you want actual tradeable prices vs just market data.

I've been really happy with Mobula's API (https://docs.mobula.io) for this kind of thing. Their free tier gives you 10K calls/month and covers pretty much every SPL token, including all the new meme coin launches. Their WebSocket support is great for real-time stuff too.

Pro tip from my experience: implement cooldown periods or users will hate you. During high volatility, I was sending people like 20 alerts in 10 minutes. Not good.

Also, make sure you store the last alert timestamp and have some logic to auto-disable alerts after they trigger. Nothing worse than getting spammed when you're trying to sleep.

For notifications, Discord webhooks are probably your best bet - free, reliable, and you can do rich embeds with price charts.

What kind of tokens are you planning to support? Just the major ones or diving into the full meme coin ecosystem?`
  }
];

async function makeConversational() {
  console.log('🚀 Making Reddit responses conversational and SEO-focused...\n');
  
  for (let i = 0; i < conversationalResponses.length; i++) {
    const post = conversationalResponses[i];
    
    try {
      console.log(`Updating post ${i+1}: ${post.title.substring(0, 50)}...`);
      
      // Delete existing blocks
      const existingBlocks = await notion.blocks.children.list({ block_id: post.id });
      for (const block of existingBlocks.results) {
        await notion.blocks.delete({ block_id: block.id });
      }
      
      // Add conversational response
      await notion.blocks.children.append({
        block_id: post.id,
        children: [
          {
            type: 'paragraph',
            paragraph: {
              rich_text: [{
                type: 'text',
                text: {
                  content: `**📅 Historical Reddit Post**`
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
                  content: '**🗣️ CONVERSATIONAL RESPONSE (Natural, SEO-Optimized for Mobula):**'
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
      
      console.log(`✅ Made conversational: ${i+1} (${post.response.length} chars)`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`❌ Failed to update post ${i+1}:`, error.message);
    }
  }
  
  console.log('\n🎉 First 5 posts made conversational! Working on remaining 6...');
}

makeConversational().catch(console.error);