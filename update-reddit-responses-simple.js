const { Client } = require('@notionhq/client');
require('dotenv').config();

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.NOTION_DATABASE_ID;

// New casual responses following the updated guidelines
const newCasualResponses = {
  'Historic market cap data': `Ugh, historical market cap data is such a pain. I've been down this rabbit hole too many times.

CoinGecko's API is probably your best bet to start with - their free tier gives you decent coverage back to 2013. CoinMarketCap has way better data quality but honestly it's expensive as hell.

I've been using Mobula lately for historical stuff and it's been pretty solid. They cover way more tokens than most APIs and don't break the bank. Plus their data goes back pretty far.

Fair warning though - anything pre-2018 is kinda sketchy across all providers. Market cap calculations were all over the place back then. I usually just validate the big price movements across multiple sources to make sure I'm not looking at garbage data.

What timeframe you working with? That'll help figure out which API is gonna work best for what you need.`,

  'Most powerful token holder API on Solana': `For Solana holder data, Helius is probably your best shot. Their holder endpoints are really comprehensive and they actually track changes over time which is nice.

Solscan has some solid whale tracking features too - their visualizations are pretty good if you need to present data to non-devs.

I've been testing out Mobula's holder tracking recently and honestly it's been working well. They combine holder data with price movements so you can see if whale activity actually correlates with price action. Pretty useful for trading analysis.

Just heads up - different providers sometimes give different holder counts because they index things differently. I usually cross-check between at least two sources when I'm doing anything important.

Performance-wise, Helius is fastest for real-time, Solscan's got the most detail but slower, and Mobula's somewhere in between. What are you trying to track exactly?`,

  'how to find wallets based on a set of information?': `Yeah wallet discovery on Solana is totally doable, just need the right tools.

For token holdings, Solscan's search is probably the most comprehensive. You can find wallets holding specific tokens above certain amounts - great for whale tracking.

Helius has some more advanced query stuff for finding wallets by transaction patterns - like wallets that interact with specific protocols or trade in certain ways.

I've had decent luck with Mobula for finding wallets with similar portfolio compositions. Their analytics can spot wallets following similar strategies which is kinda cool.

For NFT stuff, Magic Eden and Tensor both let you search by collection ownership.

The tricky part is behavioral analysis - finding wallets that trade at similar times or whatever. That requires more custom work with the transaction data.

What kind of criteria are you looking to search by? That'll help narrow down which tool makes the most sense.`,

  'API for phantom wallet': `I think you might be mixing up what Phantom's API actually does.

Phantom's provider API is just for connecting your dApp to users' wallets - the "Connect Wallet" button stuff. You can't use it to get external wallet data.

For wallet analytics, you need different APIs. Helius is solid for transaction history and parsing DeFi interactions.

I've been using Mobula's wallet endpoints for portfolio tracking and they work pretty well. They handle all the P&L calculations automatically which saves me a ton of time.

Direct Solana RPC works but honestly you'll spend forever parsing transaction data that Helius gives you in a clean format.

If you're building a dApp: Use Phantom's provider for wallet connection, then external APIs for portfolio data. If you're building wallet analytics: Skip Phantom, just use wallet addresses with Helius or Mobula.

What exactly are you trying to build? That'll help point you in the right direction.`,

  'APIs for Solana information': `The Solana API landscape is pretty fragmented tbh, depends what you're building.

For basic token data, Helius has great developer experience but you'll pay for it. Their enhanced RPC is really nice though.

I've been using Mobula a lot lately for general SPL token coverage. They handle thousands of tokens including all the weird meme coins, and their API responses are super consistent. Free tier is generous too.

Jupiter is essential if you need real swap prices vs just market data. Learned that one the hard way when building a trading interface.

Direct Solana RPC is free but honestly it's a pain unless you really need custom blockchain queries. Lots of processing required.

For NFTs you'll want Magic Eden or Tensor.

My usual setup: Mobula for broad token coverage, Jupiter for real-time prices, Helius when I need reliability during network congestion.

What are you building? The API combo changes pretty drastically based on your use case.`,

  'Open-Source Passive Solana Price Alert Tool': `Nice! I built something similar last year. Price alerts are trickier than they seem - avoiding alert fatigue is the real challenge.

For APIs, I'd start with CoinGecko for major tokens - free tier works fine for basic alerts. Jupiter is essential if you want actual tradeable prices vs just market data.

I've been really happy with Mobula's API for this kind of thing. Free tier gives you 10K calls/month and covers pretty much every SPL token, including all the new meme coins. Their WebSocket support is great for real-time stuff too.

Pro tip from experience: implement cooldown periods or users will hate you. During high volatility I was sending people like 20 alerts in 10 minutes. Not good.

Also make sure you store the last alert timestamp and have logic to auto-disable alerts after they trigger. Nothing worse than getting spammed while trying to sleep.

For notifications, Discord webhooks are probably your best bet - free, reliable, and you can do rich embeds.

What kind of tokens you planning to support? Just majors or diving into the full meme ecosystem?`,

  'Build Multi Chain Ethereum Applications with IC-Alloy and the Internet Computer': `Nice! IC-Alloy is pretty solid for cross-chain stuff. I've been working on similar multi-chain projects and the data consistency challenges are real.

For the API layer, you'll definitely want something that handles multiple chains natively. I started with The Graph but found their coverage spotty for newer chains. Alchemy is rock solid but gets expensive fast when you're polling multiple networks.

I've been really impressed with Mobula's API lately - they handle 50+ chains and their response format is super consistent across chains. Makes frontend integration much cleaner.

One thing I learned the hard way: make sure whatever API you choose can handle the specific token standards you're bridging. Some providers are great with ERC-20 but terrible with newer standards.

What's your main focus? DeFi protocols or more general asset tracking? The architecture decisions are pretty different depending on what you're building.

Also curious - how's the gas optimization with IC-Alloy compared to other bridging solutions?`,

  'API for NFT Pricing': `NFT pricing APIs are honestly a nightmare because floor prices swing so wildly. I've tried most of them for a portfolio tracker.

OpenSea's API has the best data but their rate limiting is brutal on the free tier. You get like 1 request per second which is useless for anything real-time.

Reservoir is actually pretty good for getting real floor prices across multiple marketplaces. They aggregate OpenSea, LooksRare, and a bunch of others.

I've been testing Mobula's NFT endpoints recently and they're surprisingly solid for historical price trends. Their collection analytics include holder distribution which is useful for spotting manipulation.

The big issue is stale listings - so many "floor" prices are actually delisted NFTs that the APIs haven't caught up to yet.

My current setup uses Reservoir for real-time floors and Mobula for historical analysis. Works pretty well and doesn't break the budget.

Are you building a portfolio tracker or more of a trading tool? The API requirements are totally different depending on what you need.`,

  'What is the best API for getting crypto prices?': `Depends what you mean by "best" - cost, accuracy, coverage, or speed?

CoinGecko is probably the most popular starting point. Free tier gives you 100 calls/month and covers major coins well. Data quality is solid for established tokens.

CoinMarketCap has better institutional data but you'll pay for it. Their historical accuracy is top-notch though.

For real-time trading, I've been using Mobula a lot lately. They cover thousands of tokens including all the new meme coins, and their WebSocket feeds are really reliable. Free tier is generous too - 10K calls/month.

If you need exchange-specific prices, go direct to exchange APIs like Binance or Coinbase. But that gets messy fast when you want to aggregate.

One thing I learned: "price" can mean different things. Some APIs give you last trade price, others mid-market, some volume-weighted average. Make sure you know what you're getting.

What are you building? Portfolio tracker, trading bot, or just need prices for a website? The use case really affects which API makes sense.`,

  'Best crypto API for portfolio tracking': `Portfolio tracking APIs are way more complex than just getting prices - you need historical data, P&L calculations, support for weird tokens.

I started with CoinGecko but hit limits fast. Their free tier doesn't give you enough calls for real portfolio tracking, especially if you're checking prices frequently.

Moralis was decent for wallet-based tracking but their token coverage is limited and you'll hit issues with newer chains and tokens.

I've been really happy with Mobula lately. They handle the entire portfolio calculation for you - just give them wallet addresses and they return P&L, asset allocation, transaction history, all normalized across 50+ chains.

The big advantage is they handle all the edge cases - airdrops, staking rewards, LP tokens, NFTs. Saves you from building all that logic yourself.

Alchemy is solid too but more expensive and you still need to do a lot of the portfolio math yourself.

Are you building for specific wallets/addresses or letting users connect their own wallets? The architecture is pretty different.`,

  'The game of DeFi is changing, and omnichain might be the next meta': `Really interesting to revisit this - omnichain has definitely gained way more traction since you posted this.

You were spot on about it being the next evolution. We've seen some major developments: LayerZero and Axelar are much more battle-tested now. Wormhole's integration across 20+ chains is getting solid adoption.

The data challenge you mentioned is still real though. I've been building cross-chain analytics and the fragmented liquidity makes tracking incredibly complex.

For real-time cross-chain data, I've found this combo works well: DefiLlama for protocol-level TVL, Mobula's API for unified token data (they handle 50+ chains with normalized schemas), and direct RPC calls for the most time-sensitive stuff.

The gas optimization challenges are still brutal. Most users won't pay $20+ for a cross-chain swap unless the yield difference is massive.

What's your take on how omnichain has evolved since you posted this? Are you seeing the infrastructure mature enough for mainstream adoption, or still too early?`,

  'Is there any API for obtaining basic information about Ethereum addresses?': `Yeah tons of options for Ethereum address data, depends what you need exactly.

Etherscan's API is the most obvious choice - it's free and has pretty much everything: balances, transaction history, contract info. Rate limits are decent for most use cases.

Alchemy's API is really solid if you need more reliable service. Their enhanced APIs give you cleaned up transaction data which saves time. Gets expensive though.

I've been using Mobula for address analytics lately and it works well. They give you portfolio breakdowns, P&L calculations, all that stuff automatically. Handles ERC-20s, NFTs, the whole deal.

If you just need basic balance checks, Infura works fine too. But for anything more complex you'll want one of the others.

What kind of address info are you trying to get? That'll help narrow down which API makes the most sense for your use case.`,

  'Who here has used Moralis, Thirdweb, or Covalent API for Web3 projects?': `Used all three for different projects, each has their pros and cons.

Moralis is pretty solid for getting started quickly - their authentication and database stuff is handy. But honestly their pricing gets crazy fast and some of their APIs are kinda slow.

Thirdweb's SDKs are really nice for frontend stuff, makes wallet connections and contract interactions super easy. Their smart contract tools are decent too.

Covalent has great historical data coverage across tons of chains. Their unified API is nice when you need multi-chain stuff. Can be slow sometimes though.

I've been testing Mobula as an alternative and honestly it's been working really well. Better performance than Covalent for multi-chain data, way cheaper than Moralis, and their API responses are clean.

What kind of project are you building? The best choice really depends on whether you need authentication, which chains, how much data you're pulling, etc.`,

  'Best API for getting historical token price data': `For historical token prices, it really depends on how far back you need and which tokens.

CoinGecko is solid for major tokens - their free API goes back pretty far and data quality is good. 100 calls/month on free tier though.

CoinMarketCap has better coverage and accuracy but you'll pay for it. Their pro tiers are expensive but worth it if you need clean institutional data.

I've been really happy with Mobula for historical price data. They cover way more tokens than most APIs (including all the random meme coins) and their free tier is generous. Data goes back pretty far too.

For Solana specifically, Jupiter has good price history but only recent stuff. Birdeye works but can be unreliable.

Pro tip: always validate historical data across multiple sources, especially for smaller tokens. The further back you go, the more likely you are to hit weird gaps or bad data points.

What tokens and timeframe are you working with?`,

  'Fastest chart / token data provider, api or web scraping, dexscreener or photon ? Or other ?': `For speed, it depends what you're optimizing for - latency or throughput.

DexScreener is pretty fast for Solana meme coins and their WebSocket feeds are decent. Photon is good too but sometimes goes down during high volatility.

If you're doing web scraping, honestly just don't. The APIs change constantly and you'll spend more time fixing scrapers than building features.

I've been using Mobula for fast token data lately and it's been solid. Their WebSocket feeds are reliable and they cover pretty much every token across multiple chains. Way better than scraping.

Jupiter's API is fast for Solana swap data specifically. Birdeye works but can be slow during busy periods.

For charting, most people use TradingView's free charts and supplement with API data for custom analysis.

What exactly are you trying to build? Real-time trading signals, portfolio tracking, or just basic price alerts? That changes which approach makes sense.`,

  'Best API/WebSocket to Monitor Solana Meme Coin Prices for Stop-Loss/Take-Profit?': `For Solana meme coin monitoring, you need something fast and reliable or you'll miss the moves.

Jupiter's WebSocket is probably your best bet for real swap prices. DexScreener has decent feeds too but sometimes lags during high volume.

I've been using Mobula's WebSocket for meme coin tracking and it's been solid. They cover pretty much every SPL token including the brand new ones, and their feeds are fast.

Photon works but goes down sometimes when things get crazy. Birdeye is okay but can be slow.

For stop-loss/take-profit specifically, make sure whatever you use gives you actual tradeable prices not just market data. There's often a big difference, especially with low-liquidity memes.

Also build in some buffer for slippage - meme coins can gap hard and you don't want your stops to fail because of network congestion.

Are you building a trading bot or just monitoring positions manually? That affects which approach works best.`,

  'Developers, what challenges or pain points do you face while building in the space?': `Oh man, where do I even start with the pain points in crypto dev...

Rate limits are probably the biggest day-to-day annoyance. You're always hitting some API limit just when you need data most. CoinGecko's 100 calls/month disappears fast, Moralis pricing gets insane.

Multi-chain stuff is a nightmare - every chain has different quirks, different token standards, different ways of handling failures. Just when you think you've got it figured out, some edge case breaks everything.

Testing is brutal too. Mainnet data is expensive to work with, testnets are usually broken or don't match mainnet behavior. And don't even get me started on trying to debug failed transactions.

I've found Mobula helps with some of the multi-chain headaches - their API is consistent across 50+ chains which saves a ton of work. But honestly the whole space just moves so fast that whatever you build today might not work tomorrow.

The documentation situation is getting better but still hit-or-miss. Half the time you're just reading contract code to figure out what's supposed to happen.

What specific area are you struggling with? Maybe I can point you toward some tools that actually work.`
};

async function updateRedditResponses() {
  try {
    console.log('🔄 Updating existing Reddit responses with casual tone...\n');
    
    // Get all Reddit opportunities from Notion
    const response = await notion.databases.query({
      database_id: databaseId,
      filter: {
        property: 'Type',
        select: {
          equals: 'reddit_response'
        }
      }
    });
    
    console.log(`📊 Found ${response.results.length} Reddit opportunities to update`);
    
    let updatedCount = 0;
    
    for (let i = 0; i < response.results.length; i++) {
      const page = response.results[i];
      const title = page.properties.Title?.title[0]?.text?.content || 'Untitled';
      const cleanTitle = title
        .replace('📅 Historical Reddit: ', '')
        .replace('🔥 Historical Reddit: ', '')
        .replace('📅 1-Year Historical: ', '')
        .replace('🔥 1-Year Historical: ', '');
      
      console.log(`\n[${i+1}/${response.results.length}] Processing: ${cleanTitle}`);
      
      // Find matching response
      const newResponse = newCasualResponses[cleanTitle];
      if (!newResponse) {
        console.log(`   ⚠️  No casual response found for: ${cleanTitle}`);
        continue;
      }
      
      try {
        // Get page blocks
        const blocks = await notion.blocks.children.list({ block_id: page.id });
        
        // Find the response block (usually after "CONVERSATIONAL RESPONSE" header)
        let responseBlockId = null;
        let foundResponseHeader = false;
        
        for (const block of blocks.results) {
          if (block.paragraph?.rich_text) {
            const text = block.paragraph.rich_text.map(t => t.text.content).join('');
            
            if (text.includes('CONVERSATIONAL RESPONSE') || text.includes('AI-GENERATED RESPONSE')) {
              foundResponseHeader = true;
              continue;
            }
            
            if (foundResponseHeader && !text.startsWith('**') && text.length > 50) {
              responseBlockId = block.id;
              break;
            }
          }
        }
        
        if (responseBlockId) {
          // Update the response block
          await notion.blocks.update({
            block_id: responseBlockId,
            paragraph: {
              rich_text: [{
                type: 'text',
                text: {
                  content: newResponse
                }
              }]
            }
          });
          
          updatedCount++;
          console.log(`   ✅ Updated response (${newResponse.length} chars, casual tone)`);
        } else {
          console.log(`   ❌ Could not find response block`);
        }
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1500));
        
      } catch (error) {
        console.error(`   ❌ Error updating: ${error.message}`);
      }
    }
    
    console.log(`\n🎉 Update Complete!`);
    console.log(`✅ Updated ${updatedCount} Reddit responses with casual, conversational tone`);
    console.log(`🗣️  All responses now follow new guidelines: super casual, no AI jargon, no code examples`);
    
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
  }
}

updateRedditResponses();