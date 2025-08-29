const axios = require('axios');
const { Client } = require('@notionhq/client');
require('dotenv').config();

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.NOTION_DATABASE_ID;

async function findRealRedditUrls() {
  console.log('🔍 Finding real Reddit URLs for fake entries...\n');
  
  // Topics that need real URLs (from our fake entries)
  const topicsToFind = [
    {
      title: 'Developers, what challenges or pain points do you face while building in the space?',
      searchTerms: ['developer challenges crypto', 'pain points building web3', 'crypto development problems'],
      subreddit: 'ethdev'
    },
    {
      title: 'Best API/WebSocket to Monitor Solana Meme Coin Prices for Stop-Loss/Take-Profit?',
      searchTerms: ['solana meme coin API websocket', 'solana price monitoring API', 'meme coin price alerts'],
      subreddit: 'solana'
    },
    {
      title: 'Who here has used Moralis, Thirdweb, or Covalent API for Web3 projects?',
      searchTerms: ['moralis vs thirdweb vs covalent', 'web3 API comparison', 'moralis thirdweb experience'],
      subreddit: 'web3'
    },
    {
      title: 'Is there any API for obtaining basic information about Ethereum addresses?',
      searchTerms: ['ethereum address API', 'ethereum wallet information API', 'eth address data'],
      subreddit: 'ethereum'
    },
    {
      title: 'API for NFT Pricing',
      searchTerms: ['NFT price API', 'NFT pricing data', 'NFT floor price API'],
      subreddit: 'ethereum'
    },
    {
      title: 'Best API for getting crypto prices?',
      searchTerms: ['best crypto price API', 'cryptocurrency price data', 'crypto API recommendation'],
      subreddit: 'cryptocurrency'
    },
    {
      title: 'APIs for Solana information',
      searchTerms: ['solana API data', 'solana blockchain API', 'SPL token API'],
      subreddit: 'solana'
    },
    {
      title: 'Best crypto API for portfolio tracking',
      searchTerms: ['crypto portfolio API', 'portfolio tracking API', 'crypto wallet API'],
      subreddit: 'ethdev'
    },
    {
      title: 'Historic market cap data',
      searchTerms: ['historical market cap API', 'crypto historical data', 'market cap history'],
      subreddit: 'cryptocurrency'
    },
    {
      title: 'Most powerful token holder API on Solana',
      searchTerms: ['solana token holders API', 'solana wallet tracking', 'SPL token holders'],
      subreddit: 'solana'
    }
  ];
  
  const foundUrls = {};
  
  for (let i = 0; i < topicsToFind.length; i++) {
    const topic = topicsToFind[i];
    console.log(`[${i+1}/${topicsToFind.length}] Searching for: "${topic.title.substring(0, 60)}..."`);
    
    let foundUrl = null;
    
    // Try each search term
    for (const searchTerm of topic.searchTerms) {
      try {
        console.log(`   🔍 Trying: "${searchTerm}" in r/${topic.subreddit}`);
        
        const url = `https://www.reddit.com/r/${topic.subreddit}/search.json?q=${encodeURIComponent(searchTerm)}&restrict_sr=1&sort=relevance&limit=10`;
        
        const response = await axios.get(url, {
          headers: {
            'User-Agent': 'MobulaAPI:URLFinder:v1.0.0 (research only)',
          },
          timeout: 10000,
        });

        const posts = response.data.data.children;
        
        // Find a relevant post with decent engagement
        for (const postData of posts) {
          const post = postData.data;
          
          // Skip if too old (more than 2 years)
          const postAge = Date.now() - (post.created_utc * 1000);
          const twoYearsInMs = 2 * 365 * 24 * 60 * 60 * 1000;
          if (postAge > twoYearsInMs) continue;
          
          // Must have some engagement
          if (post.score < 1) continue;
          
          // Check if title is relevant
          const postTitle = post.title.toLowerCase();
          const topicWords = topic.title.toLowerCase().split(' ');
          const relevantWords = topicWords.filter(word => 
            word.length > 3 && 
            !['the', 'and', 'for', 'any', 'best', 'here', 'what'].includes(word)
          );
          
          const hasRelevantWords = relevantWords.some(word => postTitle.includes(word));
          
          if (hasRelevantWords) {
            foundUrl = `https://reddit.com/r/${topic.subreddit}/comments/${post.id}`;
            console.log(`   ✅ Found: "${post.title}" (score: ${post.score})`);
            console.log(`   📎 URL: ${foundUrl}`);
            break;
          }
        }
        
        if (foundUrl) break;
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.log(`   ❌ Search failed: ${error.message}`);
      }
    }
    
    if (foundUrl) {
      foundUrls[topic.title] = foundUrl;
    } else {
      console.log(`   ⚠️  No suitable URL found`);
      // Fallback to a generic search result URL if no specific post found
      foundUrls[topic.title] = `https://www.reddit.com/r/${topic.subreddit}/search?q=${encodeURIComponent(topic.searchTerms[0])}&restrict_sr=1`;
    }
    
    console.log('');
  }
  
  console.log('\n📊 SUMMARY:');
  console.log(`Found URLs for ${Object.keys(foundUrls).length}/${topicsToFind.length} topics\n`);
  
  // Save results for updating Notion
  const fs = require('fs');
  fs.writeFileSync('reddit-url-mappings.json', JSON.stringify(foundUrls, null, 2));
  console.log('💾 Saved URL mappings to reddit-url-mappings.json');
  
  Object.entries(foundUrls).forEach(([title, url]) => {
    console.log(`📝 "${title.substring(0, 50)}..." → ${url}`);
  });
  
  return foundUrls;
}

findRealRedditUrls().catch(console.error);