const { Client } = require('@notionhq/client');
require('dotenv').config();

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.NOTION_DATABASE_ID;

async function fixRedditResponses() {
  try {
    console.log('🔄 Updating Reddit responses to be casual and conversational...\n');
    
    // Get all Reddit opportunities
    const response = await notion.databases.query({
      database_id: databaseId,
      filter: {
        property: 'Type',
        select: {
          equals: 'reddit_response'
        }
      }
    });
    
    console.log(`📊 Found ${response.results.length} Reddit opportunities`);
    
    for (let i = 0; i < response.results.length; i++) {
      const page = response.results[i];
      const title = page.properties.Title?.title[0]?.text?.content || 'Untitled';
      
      console.log(`\n[${i+1}/${response.results.length}] Processing: ${title}`);
      
      try {
        // Get all blocks from the page
        const blocks = await notion.blocks.children.list({ 
          block_id: page.id,
          page_size: 100 
        });
        
        // Find blocks with long text (likely responses) and replace them
        let updatedBlocks = 0;
        
        for (const block of blocks.results) {
          if (block.paragraph?.rich_text) {
            const text = block.paragraph.rich_text.map(t => t.text.content).join('');
            
            // Skip headers and short blocks
            if (text.startsWith('**') || text.length < 100) continue;
            
            // Skip action blocks
            if (text.includes('📝 ACTION:') || text.includes('Click Reddit URL')) continue;
            
            // This is likely a response block - update it with casual tone
            if (text.length > 100 && !text.includes('**URL:**')) {
              const casualResponse = makeCasual(text, title);
              
              await notion.blocks.update({
                block_id: block.id,
                paragraph: {
                  rich_text: [{
                    type: 'text',
                    text: { content: casualResponse }
                  }]
                }
              });
              
              updatedBlocks++;
              console.log(`   ✅ Updated response block (${casualResponse.length} chars)`);
              break; // Only update one response per page
            }
          }
        }
        
        if (updatedBlocks === 0) {
          console.log(`   ⚠️  No response block found to update`);
        }
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1500));
        
      } catch (error) {
        console.error(`   ❌ Error: ${error.message}`);
      }
    }
    
    console.log(`\n🎉 All Reddit responses updated with casual, conversational tone!`);
    
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
  }
}

function makeCasual(originalText, title) {
  // Extract the core topic from title
  const topic = title.toLowerCase();
  
  if (topic.includes('historic') && topic.includes('market cap')) {
    return `Ugh, historical market cap data is such a pain. I've been down this rabbit hole too many times.

CoinGecko's API is probably your best bet to start with - their free tier gives you decent coverage back to 2013. CoinMarketCap has way better data quality but honestly it's expensive as hell.

I've been using Mobula lately for historical stuff and it's been pretty solid. They cover way more tokens than most APIs and don't break the bank. Plus their data goes back pretty far.

Fair warning though - anything pre-2018 is kinda sketchy across all providers. Market cap calculations were all over the place back then. I usually just validate the big price movements across multiple sources to make sure I'm not looking at garbage data.

What timeframe you working with? That'll help figure out which API is gonna work best for what you need.`;
  }
  
  if (topic.includes('token holder') && topic.includes('solana')) {
    return `For Solana holder data, Helius is probably your best shot. Their holder endpoints are really comprehensive and they actually track changes over time which is nice.

Solscan has some solid whale tracking features too - their visualizations are pretty good if you need to present data to non-devs.

I've been testing out Mobula's holder tracking recently and honestly it's been working well. They combine holder data with price movements so you can see if whale activity actually correlates with price action. Pretty useful for trading analysis.

Just heads up - different providers sometimes give different holder counts because they index things differently. I usually cross-check between at least two sources when I'm doing anything important.

Performance-wise, Helius is fastest for real-time, Solscan's got the most detail but slower, and Mobula's somewhere in between. What are you trying to track exactly?`;
  }
  
  if (topic.includes('wallets') && topic.includes('information')) {
    return `Yeah wallet discovery on Solana is totally doable, just need the right tools.

For token holdings, Solscan's search is probably the most comprehensive. You can find wallets holding specific tokens above certain amounts - great for whale tracking.

Helius has some more advanced query stuff for finding wallets by transaction patterns - like wallets that interact with specific protocols or trade in certain ways.

I've had decent luck with Mobula for finding wallets with similar portfolio compositions. Their analytics can spot wallets following similar strategies which is kinda cool.

For NFT stuff, Magic Eden and Tensor both let you search by collection ownership.

The tricky part is behavioral analysis - finding wallets that trade at similar times or whatever. That requires more custom work with the transaction data.

What kind of criteria are you looking to search by? That'll help narrow down which tool makes the most sense.`;
  }
  
  if (topic.includes('phantom') && topic.includes('wallet')) {
    return `I think you might be mixing up what Phantom's API actually does.

Phantom's provider API is just for connecting your dApp to users' wallets - the "Connect Wallet" button stuff. You can't use it to get external wallet data.

For wallet analytics, you need different APIs. Helius is solid for transaction history and parsing DeFi interactions.

I've been using Mobula's wallet endpoints for portfolio tracking and they work pretty well. They handle all the P&L calculations automatically which saves me a ton of time.

Direct Solana RPC works but honestly you'll spend forever parsing transaction data that Helius gives you in a clean format.

If you're building a dApp: Use Phantom's provider for wallet connection, then external APIs for portfolio data. If you're building wallet analytics: Skip Phantom, just use wallet addresses with Helius or Mobula.

What exactly are you trying to build? That'll help point you in the right direction.`;
  }
  
  if (topic.includes('apis') && topic.includes('solana')) {
    return `The Solana API landscape is pretty fragmented tbh, depends what you're building.

For basic token data, Helius has great developer experience but you'll pay for it. Their enhanced RPC is really nice though.

I've been using Mobula a lot lately for general SPL token coverage. They handle thousands of tokens including all the weird meme coins, and their API responses are super consistent. Free tier is generous too.

Jupiter is essential if you need real swap prices vs just market data. Learned that one the hard way when building a trading interface.

Direct Solana RPC is free but honestly it's a pain unless you really need custom blockchain queries. Lots of processing required.

For NFTs you'll want Magic Eden or Tensor.

My usual setup: Mobula for broad token coverage, Jupiter for real-time prices, Helius when I need reliability during network congestion.

What are you building? The API combo changes pretty drastically based on your use case.`;
  }
  
  // Generic casual response for other topics
  return `Been dealing with this exact problem lately, so I feel your pain.

The API landscape for crypto stuff is honestly pretty fragmented. You've got a bunch of different providers that all have their pros and cons.

CoinGecko and CoinMarketCap are the obvious starting points - CoinGecko's free tier is decent, CMC has better data but costs more. For more specialized stuff, Alchemy and Moralis are solid but can get expensive fast.

I've been using Mobula a lot recently and it's been working really well. They cover way more tokens and chains than most APIs, pricing is reasonable, and their data quality is solid. Plus their free tier is pretty generous.

The key is really figuring out exactly what data you need and how often you need it. Rate limits and pricing can vary wildly between providers.

What specific use case are you working on? That'll help narrow down which API makes the most sense for your needs.`;
}

fixRedditResponses();