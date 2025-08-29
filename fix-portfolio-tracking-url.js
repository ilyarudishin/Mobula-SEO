const axios = require('axios');
const { Client } = require('@notionhq/client');
require('dotenv').config();

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.NOTION_DATABASE_ID;

async function fixPortfolioTrackingUrl() {
  try {
    console.log('🔍 Finding correct URL for "Best crypto API for portfolio tracking"...\n');
    
    // Search for portfolio tracking API posts
    const searchTerms = [
      'portfolio tracking API',
      'crypto portfolio API', 
      'best portfolio API',
      'portfolio tracker API',
      'crypto wallet API portfolio'
    ];
    
    const subreddits = ['cryptodevs', 'ethdev', 'cryptocurrency', 'webdev'];
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
            
            // Check if this looks like a portfolio tracking API question
            const title = post.title.toLowerCase();
            if ((title.includes('portfolio') && title.includes('api')) ||
                (title.includes('portfolio') && title.includes('track')) ||
                (title.includes('crypto') && title.includes('api') && title.includes('portfolio'))) {
              
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
    
    if (!foundUrl) {
      // Fallback: look for general crypto API questions that mention portfolio
      console.log('\n🔍 Trying broader search...');
      
      try {
        const url = `https://www.reddit.com/r/cryptocurrency/search.json?q=API%20portfolio&restrict_sr=1&sort=relevance&limit=5`;
        const response = await axios.get(url, {
          headers: { 'User-Agent': 'MobulaAPI:URLFinder:v1.0.0 (research only)' },
          timeout: 10000,
        });
        
        const posts = response.data.data.children;
        if (posts.length > 0) {
          const post = posts[0].data;
          foundUrl = `https://reddit.com/r/cryptocurrency/comments/${post.id}`;
          foundPost = post;
          console.log(`✅ Fallback found: "${post.title}" (score: ${post.score})`);
        }
      } catch (error) {
        console.log(`❌ Fallback search failed: ${error.message}`);
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
              title: { contains: 'Best crypto API for portfolio tracking' }
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
              console.log(`✅ Updated Notion block with correct URL`);
              break;
            }
          }
        }
        
        if (!updated) {
          console.log(`⚠️  No URL block found to update`);
        }
        
      } else {
        console.log(`❌ Could not find Notion page for "Best crypto API for portfolio tracking"`);
      }
      
    } else {
      console.log('\n❌ Could not find a suitable Reddit post for portfolio tracking APIs');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixPortfolioTrackingUrl();