const { Client } = require('@notionhq/client');
require('dotenv').config();

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.NOTION_DATABASE_ID;

async function finalUpdateResponses() {
  try {
    console.log('🔄 Final update: Creating new Reddit opportunities with casual responses...\n');
    
    const newOpportunities = [
      {
        title: 'Best API for getting crypto prices?',
        url: 'https://reddit.com/r/cryptocurrency/comments/example1',
        subreddit: 'cryptocurrency',
        response: `Depends what you mean by "best" - cost, accuracy, coverage, or speed?

CoinGecko is probably the most popular starting point. Free tier gives you 100 calls/month and covers major coins well.

I've been using Mobula a lot lately. They cover thousands of tokens including all the new meme coins, and their WebSocket feeds are really reliable. Free tier is generous too - 10K calls/month.

What are you building? Portfolio tracker, trading bot, or just need prices for a website? The use case really affects which API makes sense.`
      },
      {
        title: 'APIs for Solana information',
        url: 'https://reddit.com/r/solana/comments/example2',
        subreddit: 'solana',
        response: `The Solana API landscape is pretty fragmented tbh, depends what you're building.

For basic token data, Helius has great developer experience but you'll pay for it.

I've been using Mobula a lot lately for general SPL token coverage. They handle thousands of tokens including all the weird meme coins, and their API responses are super consistent. Free tier is generous too.

What are you building? The API combo changes pretty drastically based on your use case.`
      },
      {
        title: 'Best crypto API for portfolio tracking',
        url: 'https://reddit.com/r/ethdev/comments/example3',
        subreddit: 'ethdev',
        response: `Portfolio tracking APIs are way more complex than just getting prices - you need historical data, P&L calculations, support for weird tokens.

I've been really happy with Mobula lately. They handle the entire portfolio calculation for you - just give them wallet addresses and they return P&L, asset allocation, transaction history, all normalized across 50+ chains.

The big advantage is they handle all the edge cases - airdrops, staking rewards, LP tokens, NFTs. Saves you from building all that logic yourself.`
      },
      {
        title: 'Historic market cap data',
        url: 'https://reddit.com/r/cryptocurrency/comments/example4',
        subreddit: 'cryptocurrency',
        response: `Ugh, historical market cap data is such a pain. I've been down this rabbit hole too many times.

CoinGecko's API is probably your best bet to start with - their free tier gives you decent coverage back to 2013. CoinMarketCap has way better data quality but honestly it's expensive as hell.

I've been using Mobula lately for historical stuff and it's been pretty solid. They cover way more tokens than most APIs and don't break the bank. Plus their data goes back pretty far.

What timeframe you working with? That'll help figure out which API is gonna work best for what you need.`
      },
      {
        title: 'Most powerful token holder API on Solana',
        url: 'https://reddit.com/r/solana/comments/example5',
        subreddit: 'solana',
        response: `For Solana holder data, Helius is probably your best shot. Their holder endpoints are really comprehensive and they actually track changes over time which is nice.

I've been testing out Mobula's holder tracking recently and honestly it's been working well. They combine holder data with price movements so you can see if whale activity actually correlates with price action. Pretty useful for trading analysis.

Performance-wise, Helius is fastest for real-time, Solscan's got the most detail but slower, and Mobula's somewhere in between. What are you trying to track exactly?`
      }
    ];
    
    for (let i = 0; i < newOpportunities.length; i++) {
      const opp = newOpportunities[i];
      
      try {
        await notion.pages.create({
          parent: { database_id: databaseId },
          properties: {
            Title: {
              title: [{ text: { content: `🔥 Casual Response: ${opp.title}` } }]
            },
            Type: {
              select: { name: 'reddit_response' }
            }
          },
          children: [
            {
              object: 'block',
              type: 'paragraph',
              paragraph: {
                rich_text: [
                  {
                    type: 'text',
                    text: {
                      content: `**REDDIT POST:** ${opp.title}
**URL:** ${opp.url}
**Subreddit:** r/${opp.subreddit}

**CASUAL RESPONSE (Ready to post):**

${opp.response}`
                    }
                  }
                ]
              }
            }
          ]
        });
        
        console.log(`✅ [${i+1}/${newOpportunities.length}] Created: ${opp.title}`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.log(`❌ [${i+1}/${newOpportunities.length}] Failed: ${opp.title} - ${error.message}`);
      }
    }
    
    console.log('\n🎉 Done! Created new Reddit opportunities with casual, conversational responses');
    console.log('✅ All responses follow new guidelines: super casual, no AI jargon, no code examples');
    console.log('🗣️ Responses are ready for manual posting to Reddit');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

finalUpdateResponses();