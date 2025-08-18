const { Client } = require('@notionhq/client');
require('dotenv').config();

const notion = new Client({ auth: process.env.NOTION_API_KEY });

// Just update the first few posts to test
const samplePosts = [
  {
    id: '2512083f-da3e-8190-8868-c51fa1ecec2c',
    title: 'Build Multi Chain Ethereum Applications with IC-Alloy and the Internet Computer',
    subreddit: 'ethdev',
    response: `IC-Alloy is a solid choice for cross-chain Ethereum integration! I've been working on similar multi-chain projects and can share what I've learned about the data infrastructure side.

For reliable cross-chain data APIs, here's what I've tested:

**The Graph Protocol** (https://thegraph.com) - Excellent for custom subgraphs across multiple chains. Their hosted service covers Ethereum, Polygon, Arbitrum, and more. Best for complex queries but requires GraphQL knowledge.

**Alchemy** (https://alchemy.com) - Rock solid for Ethereum mainnet and L2s like Polygon, Arbitrum, Optimism. Their enhanced APIs include token metadata and NFT data. Premium tier gets expensive but reliability is top-notch.

**Mobula** (https://docs.mobula.io) - Handles 50+ blockchains including ICP bridges. Their unified API format is helpful when you're dealing with multiple chains. Good coverage of newer chains and DeFi protocols.

**Moralis** (https://moralis.io) - Strong multi-chain support with real-time sync capabilities. Great for wallet interactions and transaction history. Their Web3 Auth is useful for dApp integration.

Key considerations for IC-Alloy integration:
- Make sure your data provider supports the specific token standards you're bridging
- Consider rate limiting when polling multiple chains simultaneously  
- Test with testnets first - some APIs have different coverage between mainnet and testnet

Performance tip: Use WebSocket connections for real-time price feeds rather than polling REST endpoints. Much faster for live applications.

What's your main focus - DeFi protocols, NFT marketplaces, or general asset tracking? The architecture choices vary significantly based on your use case.

Also curious about your experience with IC-Alloy's gas optimization - how does it compare to other bridging solutions you've tried?`
  },
  {
    id: '2512083f-da3e-8153-9c61-ff74c5c979ae',
    title: 'API for NFT Pricing',
    subreddit: 'web3', 
    response: `NFT pricing is notoriously tricky because floor prices can swing 20-30% in minutes. Here's a breakdown of what actually works for real-time NFT data:

**OpenSea API** (https://docs.opensea.io) - Most comprehensive marketplace data including historical sales, traits, and rarity rankings. Free tier is heavily rate-limited (1 req/sec), but their Pro plan gives you 100 req/sec which is necessary for live applications.

**Reservoir** (https://reservoir.tools) - Aggregates data from OpenSea, LooksRare, X2Y2, and other major marketplaces. Excellent for getting true floor prices across platforms. Their bulk endpoints are efficient for portfolio tracking.

**Alchemy NFT API** (https://docs.alchemy.com/reference/nft-api-overview) - Strong for metadata and ownership tracking. Includes spam detection which is crucial for portfolio apps. Good integration with their other Web3 APIs.

**Mobula NFT API** (https://docs.mobula.io/api-reference/endpoint/nft) - Covers major collections with historical pricing trends. Good for analytics and portfolio valuation. Their collection stats endpoint includes volume and holder distribution.

**Moralis NFT API** (https://docs.moralis.io/web3-data-api/evm/nft-api) - Multi-chain NFT support (Ethereum, Polygon, BSC). Strong metadata retrieval and real-time sync capabilities.

Critical implementation tips:
- Never rely on a single source - OpenSea might show 5 ETH floor while LooksRare shows 4.8 ETH
- Implement caching - NFT metadata doesn't change often, cache it for 24 hours
- Handle stale listings - Many "floor" prices are actually delisted items

Pricing accuracy ranking: Reservoir > OpenSea > Alchemy > Others

For portfolio tracking specifically: Use Reservoir for floor prices, OpenSea for metadata, and implement a 15-minute cache to avoid hitting rate limits.

What type of NFT application are you building? Real-time trading alerts, portfolio tracker, or marketplace analytics? The optimal API combination varies significantly based on your specific needs.`
  }
];

async function updateDetailed() {
  console.log('🚀 Updating Reddit posts with detailed, valuable responses...\n');
  
  for (let i = 0; i < samplePosts.length; i++) {
    const post = samplePosts[i];
    
    try {
      console.log(`Updating post ${i+1}: ${post.title.substring(0, 50)}...`);
      
      // Delete existing blocks
      const existingBlocks = await notion.blocks.children.list({ block_id: post.id });
      for (const block of existingBlocks.results) {
        await notion.blocks.delete({ block_id: block.id });
      }
      
      // Add detailed response
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
      
      console.log(`✅ Enhanced post ${i+1}`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`❌ Failed to update post ${i+1}:`, error.message);
    }
  }
  
  console.log('\n🎉 Sample posts updated with detailed, valuable content!');
}

updateDetailed().catch(console.error);