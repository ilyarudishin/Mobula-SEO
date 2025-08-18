const { Client } = require('@notionhq/client');
require('dotenv').config();

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const redditPostId = '2532083f-da3e-8186-850a-f02c813321c0';

async function updateRedditResponse() {
  try {
    console.log('🚀 Updating Reddit post with enhanced response...');
    
    // Clear existing content first
    const existingBlocks = await notion.blocks.children.list({ block_id: redditPostId });
    
    // Delete all existing blocks
    for (const block of existingBlocks.results) {
      try {
        await notion.blocks.delete({ block_id: block.id });
      } catch (e) {
        console.log('Could not delete block:', e.message);
      }
    }
    
    // Add new enhanced content
    await notion.blocks.children.append({
      block_id: redditPostId,
      children: [
        {
          type: 'paragraph',
          paragraph: {
            rich_text: [{
              type: 'text',
              text: {
                content: '**REDDIT ENGAGEMENT OPPORTUNITY - OMNICHAIN DEFI DISCUSSION**'
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
                content: '**Post:** The game of DeFi is changing, and omnichain might be the next meta\n**Subreddit:** r/defi\n**URL:** https://reddit.com/r/defi/comments/1mtiz77\n**Status:** Several months old - craft response acknowledging the evolution since then'
              }
            }]
          }
        },
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
                content: '🎯 ENHANCED SEO-OPTIMIZED RESPONSE:'
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
                content: `Hey! Really interesting to revisit this thread after several months - omnichain has definitely gained a lot more traction since you posted this.

You were spot on about omnichain being the next evolution. We've seen some major developments in this space:

**Infrastructure that's matured:**
- LayerZero and Axelar have become much more battle-tested
- Wormhole's integration across 20+ chains is getting solid adoption
- Multichain recovery efforts have pushed other cross-chain solutions forward

**The data challenge you mentioned is real though.** I've been building cross-chain analytics tools and the fragmented nature of omnichain liquidity makes tracking incredibly complex. Here's what I've found works:

**For real-time cross-chain data:**
The Graph's new cross-chain subgraphs are helping, but coverage is still patchy. I've had good results combining:
- DefiLlama for protocol-level TVL across chains
- Mobula's API for unified token data (they handle 50+ chains with normalized schemas)
- Direct RPC calls for the most time-sensitive stuff`
              }
            }]
          }
        },
        {
          type: 'code',
          code: {
            language: 'javascript',
            rich_text: [{
              type: 'text',
              text: {
                content: `// Get unified portfolio across all supported chains
const response = await fetch(
  'https://api.mobula.io/api/1/wallet/analytics?address=0x...&chains=all',
  { headers: { 'Authorization': 'API_KEY' } }
)
const { data } = await response.json()
// Returns normalized P&L, balances, tx history across chains`
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
                content: `**What's your take on how omnichain has evolved since you posted this?** Are you seeing the infrastructure mature enough for mainstream adoption, or still too early?

The gas optimization challenges are definitely real - curious what solutions you've been watching in that space.`
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
                content: `📝 **KEY OPTIMIZATION ELEMENTS:**
✅ Acknowledges post age and evolution since then
✅ Technical depth showing genuine expertise  
✅ Natural mention of Mobula as one solution among others
✅ Asks follow-up questions to encourage engagement
✅ SEO keywords: omnichain, cross-chain analytics, DeFi infrastructure
✅ Code examples showing practical implementation`
              }
            }]
          }
        }
      ]
    })
    
    console.log('✅ Reddit post updated with enhanced SEO-optimized response!')
    return true
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    return false
  }
}

updateRedditResponse().catch(console.error);