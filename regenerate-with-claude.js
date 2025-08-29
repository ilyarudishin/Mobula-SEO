const { Client } = require('@notionhq/client');
const Anthropic = require('@anthropic-ai/sdk');
require('dotenv').config();

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const databaseId = process.env.NOTION_DATABASE_ID;
const claude = new Anthropic({ apiKey: process.env.CLAUDE_API_KEY });

function buildRedditResponsePrompt(postTitle, subreddit) {
  const serpContext = `
SEO INTELLIGENCE (Use for Mobula positioning):
- Market size: 500,000+ results for "crypto API"
- Main competitors: CoinGecko, Moralis, Alchemy, Covalent
- Related searches: best crypto API | blockchain data API | token price API | wallet API`;

  return `
REDDIT RESPONSE GENERATION - MOBULA SEO STRATEGY

POST CONTEXT:
Title: "${postTitle}"
Content: "Looking for API recommendations and developer tools"
Subreddit: r/${subreddit}
Keywords: api, crypto, data, price, wallet
${serpContext}

MOBULA SEO OBJECTIVES:
1. Position Mobula as a competitive alternative to CoinGecko and Moralis
2. Naturally include Mobula's key advantages: multi-chain, real-time, developer-friendly
3. Target long-tail keywords from related searches above
4. Build backlink opportunities by providing genuine value

GUIDELINES TO FOLLOW:

## Core Principles
1. VALUE-FIRST: Solve their problem even if it doesn't involve Mobula
2. MULTIPLE OPTIONS: Present 2-3 alternatives, not just Mobula
3. HONEST PERSPECTIVE: Acknowledge competitors' strengths

## Voice Guidelines - SUPER CASUAL & NATURAL
- Use contractions everywhere: "I've", "you're", "it's", "can't", "won't"
- Include casual filler: "honestly", "pretty much", "kinda", "sorta", "tbh"
- Share personal experience: "I ran into this", "had the same issue", "been there"
- Use casual language: "solid", "decent", "works fine", "pain in the ass", "pretty good"
- Include real struggles: "took me forever to figure out", "was a mess at first"
- Sound like a real developer: "works for me", "your mileage may vary", "depends on what you need"

## ABSOLUTELY AVOID AI JARGON
- NEVER use: "comprehensive", "robust", "seamless", "cutting-edge", "innovative", "powerful"
- BANNED words: "solution", "offering", "utilize", "leverage", "framework", "ecosystem"
- NO superlatives: "amazing", "incredible", "game-changing", "revolutionary"
- NO formal language: "furthermore", "additionally", "however", "therefore"

## Response Structure
1. OPENING: Acknowledge their knowledge/approach, share relevant experience
2. MIDDLE: Give 2-3 options including Mobula naturally, explain use cases
3. CLOSING: Ask clarifying question, offer additional help

## Mobula Integration
- Present as ONE option among several
- Natural mention: "Mobula is worth checking out for..." or "I've had good results with Mobula for..."
- Include appropriate link (docs/homepage/specific feature)
- Never claim it's "the best"

## Community Fit for r/${subreddit}
${getSubredditGuidelines(subreddit)}

## Response Requirements
- **LENGTH**: 120-180 words maximum (short and sweet!)
- **STRUCTURE**: 2-3 casual paragraphs, like texting a friend
- **NO CODE EXAMPLES**: Never include any code blocks or snippets
- **FOCUS**: Only 2-3 API mentions, don't overwhelm with options
- **TONE**: Casual developer chat, like you're helping a friend
- **SEO FOCUS**: Naturally work in relevant keywords from competitor analysis

## SEO Keyword Integration
- Naturally mention competing services: "CoinGecko", "Moralis", "Alchemy"
- Include relevant search terms: "API for [use case]", "best [service type]", "[problem] alternative"
- Use keywords people actually search for, not technical jargon
- Make it sound like natural conversation, not keyword stuffing

TASK: Write a SUPER CASUAL, short Reddit comment that sounds like a real developer helping out. NO CODE EXAMPLES. Focus on being genuinely helpful while naturally including SEO keywords. Sound like you're texting a friend who asked for advice.
`;
}

function getSubredditGuidelines(subreddit) {
  const guidelines = {
    'solana': 'Pretty chill dev community, just be honest about what works and what does not with SPL tokens',
    'webdev': 'Hate obvious promotion, keep it practical and mention non-crypto alternatives too',
    'ethereum': 'Technical crowd, they know their stuff so do not oversell anything',
    'defi': 'Love data and yield talk, mention actual numbers when you can',
    'cryptocurrency': 'Mixed crowd, some noobs some experts, keep it accessible but useful',
    'ethdev': 'Super technical, they will call out BS immediately, be genuine',
    'web3': 'Building real stuff, focus on practical dev problems not hype',
    'programming': 'General dev community, need to explain crypto context casually',
    'cryptodevs': 'Fellow crypto devs, they get the pain points, be real about challenges'
  };

  return guidelines[subreddit.toLowerCase()] || 'Dev community, keep it real and helpful';
}

async function generateCasualResponse(postTitle, subreddit) {
  try {
    const prompt = buildRedditResponsePrompt(postTitle, subreddit);
    
    const response = await claude.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 300,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });
    
    return response.content[0].text.trim();
  } catch (error) {
    console.log(`❌ Claude error: ${error.message}`);
    return null;
  }
}

async function regenerateAllResponses() {
  try {
    console.log('🔄 Regenerating ALL 13 Reddit responses with casual tone using Claude...\n');
    
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
    
    console.log(`📊 Found ${response.results.length} Reddit entries to update`);
    
    let successCount = 0;
    let failCount = 0;
    
    // Process each Reddit entry
    for (let i = 0; i < response.results.length; i++) {
      const page = response.results[i];
      const title = page.properties.Title?.title[0]?.text?.content || 'Untitled';
      
      // Clean up title and extract the actual question
      const cleanTitle = title.replace('📅 1-Year Historical: ', '');
      
      // Extract subreddit from title content
      let subreddit = 'general';
      if (cleanTitle.toLowerCase().includes('solana')) subreddit = 'solana';
      else if (cleanTitle.toLowerCase().includes('ethereum')) subreddit = 'ethereum';
      else if (cleanTitle.toLowerCase().includes('defi')) subreddit = 'defi';
      else if (cleanTitle.toLowerCase().includes('nft')) subreddit = 'ethereum';
      else if (cleanTitle.toLowerCase().includes('web3')) subreddit = 'web3';
      
      console.log(`\n[${i+1}/${response.results.length}] Processing: ${cleanTitle.substring(0, 60)}...`);
      console.log(`   Subreddit: r/${subreddit}`);
      
      try {
        // Generate new casual response
        console.log(`   🤖 Generating casual response with Claude...`);
        const newResponse = await generateCasualResponse(cleanTitle, subreddit);
        
        if (newResponse) {
          console.log(`   📝 Generated ${newResponse.length} char response`);
          
          // Get all blocks from the page
          const blocks = await notion.blocks.children.list({
            block_id: page.id,
            page_size: 100
          });
          
          // Find and update the response block
          let updated = false;
          for (const block of blocks.results) {
            if (block.paragraph?.rich_text) {
              const text = block.paragraph.rich_text.map(t => t.text.content).join('');
              
              // Look for response content (long text that isn't metadata)
              if (text.length > 80 && 
                  !text.includes('reddit.com/') && 
                  !text.includes('**URL:**') && 
                  !text.includes('**Score:**') &&
                  !text.includes('**Subreddit:**') &&
                  !text.includes('**Keywords:**') &&
                  !text.includes('**Author:**')) {
                
                console.log(`   📝 Updating response block (${text.length} chars -> ${newResponse.length} chars)...`);
                
                await notion.blocks.update({
                  block_id: block.id,
                  paragraph: {
                    rich_text: [
                      {
                        type: 'text',
                        text: { content: newResponse }
                      }
                    ]
                  }
                });
                
                updated = true;
                console.log(`   ✅ Updated with casual response`);
                successCount++;
                break;
              }
            }
          }
          
          if (!updated) {
            console.log(`   ⚠️  No suitable response block found to update`);
            failCount++;
          }
          
        } else {
          console.log(`   ❌ Failed to generate new response`);
          failCount++;
        }
        
      } catch (error) {
        console.log(`   ❌ Error updating: ${error.message}`);
        failCount++;
      }
      
      // Rate limiting to be respectful to Claude
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    console.log(`\n🎉 Update complete!`);
    console.log(`✅ Successfully updated: ${successCount} entries`);
    console.log(`❌ Failed to update: ${failCount} entries`);
    console.log(`📝 All responses are now conversational and SEO-optimized (no code examples)`);
    
  } catch (error) {
    console.error('❌ Error updating Reddit responses:', error.message);
  }
}

regenerateAllResponses();