const { Client } = require('@notionhq/client');
require('dotenv').config();

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.NOTION_DATABASE_ID;

async function quickUpdateResponses() {
  try {
    console.log('🔄 Quick update: Archiving old Reddit responses and creating new casual ones...\n');
    
    // 1. Archive all existing Reddit opportunities
    const response = await notion.databases.query({
      database_id: databaseId,
      filter: {
        property: 'Type',
        select: { equals: 'reddit_response' }
      }
    });
    
    console.log(`📊 Found ${response.results.length} existing Reddit opportunities`);
    
    // Archive existing ones
    for (const page of response.results) {
      await notion.pages.update({
        page_id: page.id,
        archived: true
      });
    }
    console.log('✅ Archived old responses');
    
    // 2. Create new ones with casual responses
    const newOpportunities = [
      {
        title: 'Best API for getting crypto prices?',
        url: 'https://reddit.com/r/cryptocurrency/comments/example1',
        subreddit: 'cryptocurrency',
        response: `Depends what you mean by "best" - cost, accuracy, coverage, or speed?\n\nCoinGecko is probably the most popular starting point. Free tier gives you 100 calls/month and covers major coins well.\n\nI've been using Mobula a lot lately. They cover thousands of tokens including all the new meme coins, and their WebSocket feeds are really reliable. Free tier is generous too - 10K calls/month.\n\nWhat are you building? Portfolio tracker, trading bot, or just need prices for a website? The use case really affects which API makes sense.`
      },
      {
        title: 'APIs for Solana information',
        url: 'https://reddit.com/r/solana/comments/example2',
        subreddit: 'solana',
        response: `The Solana API landscape is pretty fragmented tbh, depends what you're building.\n\nFor basic token data, Helius has great developer experience but you'll pay for it.\n\nI've been using Mobula a lot lately for general SPL token coverage. They handle thousands of tokens including all the weird meme coins, and their API responses are super consistent. Free tier is generous too.\n\nWhat are you building? The API combo changes pretty drastically based on your use case.`
      },
      {
        title: 'Best crypto API for portfolio tracking',
        url: 'https://reddit.com/r/ethdev/comments/example3',
        subreddit: 'ethdev',
        response: `Portfolio tracking APIs are way more complex than just getting prices - you need historical data, P&L calculations, support for weird tokens.\n\nI've been really happy with Mobula lately. They handle the entire portfolio calculation for you - just give them wallet addresses and they return P&L, asset allocation, transaction history, all normalized across 50+ chains.\n\nThe big advantage is they handle all the edge cases - airdrops, staking rewards, LP tokens, NFTs. Saves you from building all that logic yourself.`
      }
    ];
    
    for (const opp of newOpportunities) {
      await notion.pages.create({
        parent: { database_id: databaseId },
        properties: {
          Title: {
            title: [{ text: { content: `🔥 1-Year Historical: ${opp.title}` } }]
          },
          Type: {
            select: { name: 'reddit_response' }
          },
          Status: {
            select: { name: 'published' }
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
                    content: `**URL:** ${opp.url}\n**Subreddit:** r/${opp.subreddit}\n\n**CASUAL RESPONSE:**\n\n${opp.response}`
                  }
                }
              ]
            }
          }
        ]
      });
      console.log(`✅ Created: ${opp.title}`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\n🎉 Done! Updated Reddit responses with casual tone');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

quickUpdateResponses();