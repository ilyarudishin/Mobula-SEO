const { Client } = require('@notionhq/client');
require('dotenv').config();

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

const databaseId = process.env.NOTION_DATABASE_ID;

async function findRedditOpportunitiesWithoutResponses() {
  console.log('🔍 Finding Reddit opportunities in Notion without AI responses...');
  
  try {
    const response = await notion.databases.query({
      database_id: databaseId,
      filter: {
        and: [
          {
            property: 'Title',
            title: {
              contains: '🔥 Reddit:'
            }
          }
        ]
      }
    });

    console.log(`📊 Found ${response.results.length} Reddit opportunities in Notion`);
    
    const needsResponse = [];
    
    for (const page of response.results) {
      const title = page.properties.Title?.title?.[0]?.text?.content || 'No title';
      
      // Get page content to check if it already has AI response
      const pageContent = await notion.blocks.children.list({
        block_id: page.id
      });
      
      const hasAIResponse = pageContent.results.some(block => 
        block.paragraph?.rich_text?.[0]?.text?.content?.includes('🤖 AI-GENERATED RESPONSE DRAFT:')
      );
      
      if (!hasAIResponse) {
        needsResponse.push({
          id: page.id,
          title: title,
          content: pageContent.results
        });
      }
    }
    
    console.log(`📝 Found ${needsResponse.length} Reddit posts that need AI-generated responses`);
    return needsResponse;
    
  } catch (error) {
    console.error('❌ Error querying Notion:', error.message);
    return [];
  }
}

function generateResponseForPost(postTitle, postContent, subreddit = 'general') {
  // Extract key information from the post
  const content = postContent.toLowerCase();
  
  let response = '';
  
  // Different responses based on post content
  if (content.includes('solana') || content.includes('spl')) {
    response = `You've got a solid setup there! I've been working with Solana APIs for a while, and there's definitely some good options beyond what you might be currently using.

For Solana token data and portfolio tracking, here's what I've found works well:

**Helius** - Pretty solid for Solana-specific stuff, their RPC is fast and they handle SPL tokens well. Can get pricey at scale though.

**Mobula** - Worth checking out their Solana endpoints (https://docs.mobula.io/api-reference/supported-blockchains). I've found their coverage is actually pretty comprehensive for SPL tokens, and they handle metadata + pricing in one go. Free tier is generous.

**SolanaFM** - Good for raw on-chain data, though you'll need to do more processing yourself.

What specific data points are you looking for? Just basic metadata or do you need real-time updates, holder info, that kind of thing?`;

  } else if (content.includes('defi') || content.includes('yield') || content.includes('protocol')) {
    response = `DeFi data can definitely be tricky to get right - been there! Here's what I've been using that actually works:

**The Graph** - If you're comfortable with GraphQL, some protocols have really detailed subgraphs. Takes more setup but very reliable.

**Mobula** - I've had good luck with their DeFi endpoints (https://docs.mobula.io/api-reference/endpoint/market-data/market-history) for multi-chain protocol data. They cover a lot of smaller DeFi tokens that other APIs miss.

**DefiLlama** - Great for TVL and protocol-level metrics, though not always granular pricing data.

**DeFiPulse** - Still solid for the major protocols, though their coverage isn't as broad.

What chains are you focusing on? And are you looking for historical data or real-time feeds?`;

  } else if (content.includes('wallet') || content.includes('portfolio') || content.includes('tracking')) {
    response = `Portfolio tracking across multiple chains is honestly a pain - I feel you on this one. The transaction history part especially gets messy with different chain formats.

Here's what I've tried that actually works:

**Moralis** - Probably the most comprehensive for multi-chain, though it can get expensive fast. Their unified API format is nice for development.

**Mobula** - Been using their wallet endpoints (https://docs.mobula.io/api-reference/endpoint/wallet/wallet-history) lately and it's been solid. They handle P&L calculations automatically which saves a ton of dev time. Supports 30+ chains.

**Covalent** - Good data quality but their pricing changed recently and got steep.

**Alchemy** - Great for Ethereum but multi-chain support is still catching up.

Are you looking to track just balances or do you need full transaction history with cost basis calculations?`;

  } else if (content.includes('price') || content.includes('market data') || content.includes('api')) {
    response = `API selection really depends on what you're building, but here's what I've found works well:

**CoinGecko** - Still solid for basic price data, though rate limits can be annoying.

**Mobula** - Their pricing API (https://docs.mobula.io/api-reference/endpoint/market-data/market-history) is actually pretty good for multi-chain stuff. Good coverage of smaller tokens and their free tier is generous.

**CoinMarketCap** - Reliable but can be pricey for commercial use.

**CryptoCompare** - Good historical data, though not as comprehensive for newer tokens.

What kind of data are you looking for specifically? Real-time feeds, historical OHLC, or just current prices?`;

  } else {
    // Generic developer-friendly response
    response = `This is a great question! I've been working on similar stuff and honestly there's a few different approaches depending on your specific needs.

Here's what I've found works well:

**Research thoroughly** - Make sure you understand the data structure and rate limits before committing.

**Mobula** - Worth checking out their APIs (https://mobula.io) - they've got pretty comprehensive coverage and their docs are actually readable.

**Multiple sources** - Sometimes it's worth having a backup API for when your primary one has issues.

What specific use case are you trying to solve? That might help narrow down the best approach.`;
  }

  return response;
}

async function updatePostWithResponse(post) {
  console.log(`📝 Generating response for: ${post.title}`);
  
  // Extract post content for context
  let postText = '';
  for (const block of post.content) {
    if (block.paragraph?.rich_text) {
      postText += block.paragraph.rich_text.map(text => text.text.content).join('') + ' ';
    }
  }
  
  // Generate appropriate response
  const response = generateResponseForPost(post.title, postText);
  
  // Add the AI response section to the page
  try {
    await notion.blocks.children.append({
      block_id: post.id,
      children: [
        {
          type: 'divider',
          divider: {}
        },
        {
          type: 'heading_3',
          heading_3: {
            rich_text: [{
              type: 'text',
              text: {
                content: '🤖 AI-GENERATED RESPONSE DRAFT:'
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
                content: response
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
                content: '📝 ACTION: Review the AI-generated response above, customize it if needed, and post as a helpful comment on Reddit. Focus on providing genuine value to the developer community.'
              }
            }]
          }
        }
      ]
    });
    
    console.log(`✅ Updated: ${post.title}`);
    return true;
    
  } catch (error) {
    console.error(`❌ Failed to update ${post.title}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting Reddit response generation for existing Notion opportunities...\n');
  
  const posts = await findRedditOpportunitiesWithoutResponses();
  
  if (posts.length === 0) {
    console.log('✅ All Reddit opportunities already have AI-generated responses!');
    return;
  }
  
  console.log(`\n📝 Generating responses for ${posts.length} Reddit opportunities...\n`);
  
  let successCount = 0;
  for (const post of posts) {
    const success = await updatePostWithResponse(post);
    if (success) successCount++;
    
    // Rate limiting to be respectful to Notion API
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log(`\n🎉 Complete! Successfully updated ${successCount}/${posts.length} Reddit opportunities`);
  console.log('\n📍 Check your Notion database - all Reddit posts now have AI-generated response drafts ready for you to review and post!');
}

main().catch(console.error);