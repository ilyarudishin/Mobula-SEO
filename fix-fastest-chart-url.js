const axios = require('axios');
const { Client } = require('@notionhq/client');
require('dotenv').config();

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.NOTION_DATABASE_ID;

async function fixFastestChartUrl() {
  try {
    console.log('🔍 Finding correct URL for "Fastest chart / token data provider"...\n');
    
    // Search for chart/data provider posts - this is a very specific question
    const searchTerms = [
      'fastest chart token data provider',
      'dexscreener vs photon',
      'token data provider API',
      'fastest token data',
      'chart data provider',
      'real-time token data',
      'dexscreener photon comparison'
    ];
    
    const subreddits = ['solana', 'CryptoTechnology', 'ethdev', 'defi'];
    let foundUrl = null;
    let foundPost = null;
    
    for (const subreddit of subreddits) {
      for (const searchTerm of searchTerms) {
        try {
          console.log(`🔍 Searching "${searchTerm}" in r/${subreddit}`);
          
          const url = `https://www.reddit.com/r/${subreddit}/search.json?q=${encodeURIComponent(searchTerm)}&restrict_sr=1&sort=relevance&limit=10`;
          
          const response = await axios.get(url, {
            headers: {
              'User-Agent': 'MobulaAPI:URLFinder:v1.0.0 (research only)',
            },
            timeout: 10000,
          });

          const posts = response.data.data.children;
          
          for (const postData of posts) {
            const post = postData.data;
            
            // Check if this looks like a data provider comparison question
            const title = post.title.toLowerCase();
            if ((title.includes('dexscreener') || title.includes('photon')) ||
                (title.includes('fastest') && title.includes('data')) ||
                (title.includes('chart') && title.includes('provider')) ||
                (title.includes('token data') && title.includes('provider'))) {
              
              // Must have some engagement and not be too old
              const postAge = Date.now() - (post.created_utc * 1000);
              const oneYearInMs = 365 * 24 * 60 * 60 * 1000;
              
              if (post.score >= 1 && postAge <= oneYearInMs) {
                foundUrl = `https://reddit.com/r/${subreddit}/comments/${post.id}`;
                foundPost = post;
                console.log(`✅ Found: "${post.title}" (score: ${post.score})`);
                console.log(`📎 URL: ${foundUrl}`);
                break;
              }
            }
          }
          
          if (foundUrl) break;
          await new Promise(resolve => setTimeout(resolve, 2000));
          
        } catch (error) {
          console.log(`❌ Search failed: ${error.message}`);
        }
      }
      if (foundUrl) break;
    }
    
    // If no specific match, look for DexScreener discussions
    if (!foundUrl) {
      console.log('\n🔍 Trying DexScreener specific search...');
      
      try {
        const url = `https://www.reddit.com/r/solana/search.json?q=dexscreener&restrict_sr=1&sort=relevance&limit=5`;
        const response = await axios.get(url, {
          headers: { 'User-Agent': 'MobulaAPI:URLFinder:v1.0.0 (research only)' },
          timeout: 10000,
        });
        
        const posts = response.data.data.children;
        if (posts.length > 0) {
          // Find the most relevant one
          for (const postData of posts) {
            const post = postData.data;
            const title = post.title.toLowerCase();
            if (title.includes('dexscreener') && (title.includes('api') || title.includes('data') || title.includes('vs') || title.includes('alternative'))) {
              foundUrl = `https://reddit.com/r/solana/comments/${post.id}`;
              foundPost = post;
              console.log(`✅ DexScreener found: "${post.title}" (score: ${post.score})`);
              break;
            }
          }
          
          // If no specific match, take the first DexScreener post
          if (!foundUrl) {
            const post = posts[0].data;
            foundUrl = `https://reddit.com/r/solana/comments/${post.id}`;
            foundPost = post;
            console.log(`✅ Fallback DexScreener: "${post.title}" (score: ${post.score})`);
          }
        }
      } catch (error) {
        console.log(`❌ DexScreener search failed: ${error.message}`);
      }
    }
    
    // Final fallback - any fast data/chart discussion
    if (!foundUrl) {
      console.log('\n🔍 Final fallback - any fast data provider discussion...');
      
      try {
        const url = `https://www.reddit.com/r/solana/search.json?q=fastest%20data%20API&restrict_sr=1&sort=relevance&limit=3`;
        const response = await axios.get(url, {
          headers: { 'User-Agent': 'MobulaAPI:URLFinder:v1.0.0 (research only)' },
          timeout: 10000,
        });
        
        const posts = response.data.data.children;
        if (posts.length > 0) {
          const post = posts[0].data;
          foundUrl = `https://reddit.com/r/solana/comments/${post.id}`;
          foundPost = post;
          console.log(`✅ Final fallback: "${post.title}" (score: ${post.score})`);
        }
      } catch (error) {
        console.log(`❌ Final fallback failed: ${error.message}`);
      }
    }
    
    if (foundUrl) {
      console.log(`\n🎯 Selected URL: ${foundUrl}`);
      console.log(`📝 Post title: "${foundPost.title}"`);
      console.log(`👥 Score: ${foundPost.score}, Comments: ${foundPost.num_comments}`);
      
      // Now update the Notion entry
      console.log('\n📝 Updating Notion entry...');
      
      // Find the specific page
      const notionResponse = await notion.databases.query({
        database_id: databaseId,
        filter: {
          and: [
            {
              property: 'Type',
              select: { equals: 'reddit_response' }
            },
            {
              property: 'Title',
              title: { contains: 'Fastest chart' }
            }
          ]
        }
      });
      
      if (notionResponse.results.length > 0) {
        const page = notionResponse.results[0];
        console.log(`✅ Found Notion page: ${page.properties.Title?.title[0]?.text?.content}`);
        
        // Get all blocks and update the one with the URL
        const blocks = await notion.blocks.children.list({ 
          block_id: page.id,
          page_size: 100 
        });
        
        let updated = false;
        for (const block of blocks.results) {
          if (block.paragraph?.rich_text) {
            const text = block.paragraph.rich_text.map(t => t.text.content).join('');
            
            if (text.includes('reddit.com/')) {
              console.log(`📝 Found block with URL, updating...`);
              
              // Update this block with the correct URL
              const updatedText = text.replace(
                /https?:\/\/reddit\.com\/[^\s\)]+/g,
                foundUrl
              );
              
              await notion.blocks.update({
                block_id: block.id,
                paragraph: {
                  rich_text: [
                    {
                      type: 'text',
                      text: { content: updatedText }
                    }
                  ]
                }
              });
              
              updated = true;
              console.log(`✅ Successfully updated with fastest chart/data URL`);
              console.log(`🔗 New URL: ${foundUrl}`);
              break;
            }
          }
        }
        
        if (!updated) {
          console.log(`⚠️  No URL block found to update`);
        }
        
      } else {
        console.log(`❌ Could not find Notion page for "Fastest chart"`);
      }
      
    } else {
      console.log('\n❌ Could not find a suitable Reddit post for fastest chart/data provider');
    }
    
    console.log('\n🎉 Fastest chart/data provider URL update complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixFastestChartUrl();