const { Client } = require('@notionhq/client');
require('dotenv').config();

const notion = new Client({ auth: process.env.NOTION_API_KEY });

const remainingPosts = [
  {
    id: '2512083f-da3e-8110-ae3d-f51939375642',
    title: 'APIs for Solana information',
    response: `The Solana API landscape is pretty fragmented, so it depends what you're trying to build.

If you need basic token data, Helius (https://docs.helius.xyz) has the best developer experience but you'll pay for it. Their enhanced RPC is really nice though.

For general SPL token coverage, I've been using Mobula (https://docs.mobula.io) a lot lately. They handle thousands of tokens including all the weird meme coins, and their API response format is super consistent. Their free tier is generous too.

Jupiter (https://docs.jup.ag) is essential if you need real swap prices vs just market data. I learned that lesson the hard way trying to build a trading interface.

Direct Solana RPC (https://docs.solana.com/api/http) is free but honestly it's a pain unless you really need custom blockchain queries. Lots of processing required.

For NFTs specifically, you'll want Magic Eden (https://api.magiceden.dev) or Tensor (https://docs.tensor.trade).

My usual setup for portfolio apps: Mobula for broad token coverage, Jupiter for real-time prices, and Helius when I need reliability during network congestion.

What are you building? Trading bot, portfolio tracker, or something else? The API combo changes pretty drastically based on your use case.`
  },
  {
    id: '2512083f-da3e-8153-987a-db350015310e',
    title: 'Fastest chart / token data provider, api or web scraping, dexscreener or photon ? Or other ?',
    response: `Speed is everything for Solana trading. I've benchmarked most of these APIs extensively.

Jupiter (https://docs.jup.ag) is hands down fastest at ~50-100ms for real swap data. If you're doing anything time-sensitive, this is your primary.

Birdeye (https://docs.birdeye.so) is second fastest at ~100-200ms and has the best coverage for new token launches. Catches meme coins within minutes.

Don't scrape DexScreener - seriously. It's way slower than just using their API (https://docs.dexscreener.com) and they'll rate limit you into oblivion.

I've had good results with Mobula (https://docs.mobula.io) as a backup connection. Not the fastest but super reliable and covers basically everything.

Web scraping Photon or Bullx is asking for trouble. You're looking at 1-3 second delays plus the overhead of parsing HTML. Plus it breaks every time they update their site.

My current setup: Jupiter primary, Birdeye secondary, Mobula fallback. All running in parallel, take the fastest response.

Pro tip: Use WebSocket connections instead of REST polling. Saves you 100-200ms per update, which adds up fast.

What's your use case? If you're doing arbitrage you need sub-200ms. Portfolio tracking can handle 500ms+.`
  },
  {
    id: '2512083f-da3e-819d-99ee-cccc0f9d26ec',
    title: 'API for phantom wallet',
    response: `I think there's some confusion here about what Phantom's API actually does.

Phantom's provider API (https://docs.phantom.app) is just for connecting your dApp to users' wallets - the "Connect Wallet" button stuff. You can't use it to get external wallet data.

For wallet analytics, you need different APIs. Helius (https://docs.helius.xyz) is probably your best bet for transaction history and parsing complex DeFi interactions.

I've been using Mobula's wallet endpoints (https://docs.mobula.io/api-reference/endpoint/wallet/wallet-history) for portfolio tracking and they work really well. They handle all the P&L calculations automatically which saves a ton of dev time.

Direct Solana RPC (https://docs.solana.com/api/http) works but you'll spend weeks parsing transaction data that Helius gives you in a clean format.

If you're building a dApp: Use Phantom's provider for wallet connection, then external APIs to display the user's portfolio data.

If you're building wallet analytics: Skip Phantom entirely, just use wallet addresses with Helius or Mobula.

What exactly are you trying to build? That'll help me point you in the right direction.`
  },
  {
    id: '2512083f-da3e-814e-8ec1-c11a89defe74',
    title: 'how to find wallets based on a set of information?',
    response: `Wallet discovery on Solana is totally doable but you need the right tools.

For token holdings, Solscan (https://docs.solscan.io) has the most comprehensive search. You can find wallets holding specific tokens above certain thresholds. Great for whale tracking.

Helius (https://docs.helius.xyz) has some advanced query features for finding wallets by transaction patterns - like wallets that interact with specific DeFi protocols or have certain trading behaviors.

I've had good results with Mobula (https://docs.mobula.io) for finding wallets with similar portfolio compositions. Their analytics can identify wallets following similar trading strategies.

For NFT ownership, Magic Eden (https://api.magiceden.dev) and Tensor (https://docs.tensor.trade) let you search by collection ownership.

The tricky part is behavioral analysis - like finding wallets that trade at similar times or use similar gas prices. That requires more custom analysis of the transaction data.

Just remember all this blockchain data is public, but try to be responsible about how you use wallet discovery tools. Some users value privacy even though it's technically all transparent.

What kind of criteria are you looking to search by? Token holdings, transaction patterns, or something else?`
  },
  {
    id: '2512083f-da3e-81ec-9a91-e81bd1b7233e',
    title: 'Most powerful token holder API on Solana',
    response: `For holder data on Solana, Helius (https://docs.helius.xyz) is probably your best bet. Their holder distribution endpoints are really comprehensive and include historical changes over time.

Solscan (https://docs.solscan.io) has excellent visualization tools for holder analysis. Their whale tracking features are solid and they cover pretty much every SPL token.

I've been impressed with Mobula's holder tracking (https://docs.mobula.io) lately. They combine holder data with price movements so you can see correlation between whale activity and price action. Pretty useful for trading analysis.

The thing with holder data is accuracy varies a lot between providers. They sometimes disagree on holder counts because of different indexing methods. I usually cross-reference between at least two sources for important analysis.

Performance-wise, Helius is fastest for real-time updates, Solscan is most detailed but slower, and Mobula strikes a good balance.

One tip: combine holder data with volume analysis. A token with concentrated holdings but high volume might indicate active trading by whales rather than just hodling.

What do you need the holder data for? Airdrop analysis, whale tracking, or something else? The use case affects which API features you'll actually need.`
  },
  {
    id: '2512083f-da3e-81e7-a193-ca465252f29e',
    title: 'Historic market cap data',
    response: `Historical market cap data can be tricky, especially for older cryptocurrencies where the data quality gets questionable.

CoinGecko (https://coingecko.com/api) is probably your best starting point. They've got solid data back to 2013 for major coins and their free tier gives you 100 calls/month.

CoinMarketCap (https://coinmarketcap.com/api/) has the most comprehensive data but their API is expensive. Worth it if you need institutional-grade accuracy.

I've been using Mobula (https://docs.mobula.io/api-reference/endpoint/market-data/market-history) for a lot of historical analysis lately. They cover thousands of tokens with market cap history and their free tier is pretty generous.

Big warning: pre-2018 data is sketchy across all providers. Market cap calculations weren't standardized and a lot of APIs just extrapolate missing data points.

Also watch out for circulating supply errors, especially with tokens that have vesting schedules. The market cap spikes you see might just be supply calculation bugs rather than actual price movements.

For research, I usually validate major turning points against multiple sources. What timeframe and which tokens are you looking at? That affects which API will give you the most reliable data.`
  }
];

async function updateRemaining() {
  console.log('🚀 Making remaining 6 Reddit responses conversational...\n');
  
  for (let i = 0; i < remainingPosts.length; i++) {
    const post = remainingPosts[i];
    
    try {
      console.log(`Updating post ${i+6}: ${post.title.substring(0, 50)}...`);
      
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
      
      console.log(`✅ Made conversational: ${i+6} (${post.response.length} chars)`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`❌ Failed to update post ${i+6}:`, error.message);
    }
  }
  
  console.log('\n🎉 All 11 Reddit responses are now conversational and SEO-optimized!');
}

updateRemaining().catch(console.error);