/**
 * Weekly Mobula Opportunity Scanner
 * Automatically scans for blog articles and discussions where Mobula should be mentioned
 * Runs every Tuesday at 9 AM via GitHub Actions
 */

const axios = require('axios');
require('dotenv').config();

// Environment variables
const NOTION_TOKEN = process.env.NOTION_API_KEY;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;
const DATAFORSEO_LOGIN = process.env.DATAFORSEO_LOGIN;
const DATAFORSEO_PASSWORD = process.env.DATAFORSEO_PASSWORD;

class MobulaOpportunityScanner {
  constructor() {
    this.searchQueries = [
      // Direct competitor alternatives (highest conversion)
      'coinmarketcap api alternative',
      'coingecko api alternative',
      'moralis api alternative',
      
      // Mobula's core strengths
      'crypto wallet tracker api',
      'solana trading bot api',
      'real time crypto websocket api',
      'defi portfolio tracker api',
      'multi chain crypto api',
      
      // High-volume general searches
      'crypto market data api comparison',
      'best crypto price api developers'
    ];
  }

  async runWeeklyScan() {
    console.log('🚀 WEEKLY MOBULA OPPORTUNITY SCANNER');
    console.log(`📅 Scan Date: ${new Date().toLocaleDateString()}`);
    console.log('🎯 Targeting articles related to Mobula\'s documented services\n');

    const opportunities = [];

    try {
      // Execute searches
      for (let i = 0; i < this.searchQueries.length; i++) {
        const query = this.searchQueries[i];
        console.log(`🔍 [${i + 1}/${this.searchQueries.length}] "${query}"`);
        
        try {
          const results = await this.executeSearch(query);
          const relevantResults = this.filterForMobulaRelevance(results, query);
          opportunities.push(...relevantResults);
          
          console.log(`   ✅ Found ${relevantResults.length} relevant opportunities`);
          
          // Rate limiting
          await this.sleep(2500);
        } catch (error) {
          console.log(`   ❌ Error: ${error.message}`);
        }
      }

      // Process and save opportunities
      const processedOpportunities = this.processOpportunities(opportunities);
      const savedCount = await this.saveToNotion(processedOpportunities);

      // Generate summary
      this.generateWeeklySummary(processedOpportunities, savedCount);

    } catch (error) {
      console.log(`❌ Scanner failed: ${error.message}`);
      throw error;
    }
  }

  async executeSearch(keyword) {
    const postData = [{
      keyword: keyword,
      language_code: 'en',
      location_code: 2840, // United States
      device: 'desktop'
    }];

    const response = await axios.post(
      'https://api.dataforseo.com/v3/serp/google/organic/live/advanced', 
      postData, 
      {
        auth: {
          username: DATAFORSEO_LOGIN,
          password: DATAFORSEO_PASSWORD
        },
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000
      }
    );

    if (response.data.status_code !== 20000) {
      throw new Error(`DataForSEO API error: ${response.data.status_message}`);
    }

    return response.data.tasks[0].result[0].items
      .filter(item => item.type === 'organic')
      .map(item => ({
        title: item.title || '',
        url: item.url || '',
        description: item.description || '',
        domain: this.extractDomain(item.url || ''),
        position: item.rank_group
      }));
  }

  filterForMobulaRelevance(results, query) {
    return results
      .slice(0, 5) // Top 5 results per query
      .map(result => {
        const analysis = this.analyzeMobulaRelevance(result);
        return {
          ...result,
          ...analysis,
          searchQuery: query,
          foundDate: new Date().toISOString().split('T')[0]
        };
      })
      .filter(result => result.relevanceScore >= 75); // High threshold for quality
  }

  analyzeMobulaRelevance(result) {
    const text = `${result.title} ${result.description}`.toLowerCase();
    const domain = result.domain;
    
    let score = 0;
    const mobulaServices = [];
    let reason = '';
    let actionPlan = '';
    
    // Direct competitor mentions (highest priority)
    if (text.includes('coinmarketcap') && text.includes('alternative')) {
      score += 40;
      reason = 'Direct CMC alternative discussion';
      actionPlan = 'Position Mobula as superior CMC alternative with better pricing and Solana coverage';
    } else if (text.includes('moralis') && text.includes('alternative')) {
      score += 35;
      reason = 'Moralis alternative (wallet analytics competitor)';
      actionPlan = 'Highlight Mobula\'s superior wallet analytics and multi-chain support';
      mobulaServices.push('Wallet Explorer API');
    }
    
    // Core Mobula services
    if ((text.includes('wallet') && (text.includes('tracker') || text.includes('portfolio'))) || 
        text.includes('defi position')) {
      score += 30;
      reason += (reason ? ' + ' : '') + 'Wallet analytics focus';
      actionPlan = 'Showcase Mobula\'s unique wallet tracking and DeFi position features';
      mobulaServices.push('Wallet Explorer API');
    }
    
    if (text.includes('real time') || text.includes('websocket') || text.includes('streaming')) {
      score += 25;
      reason += (reason ? ' + ' : '') + 'Real-time data focus';
      actionPlan = 'Emphasize Mobula\'s low-latency streaming and WebSocket capabilities';
      mobulaServices.push('WebSocket Streaming');
    }
    
    if (text.includes('solana') && (text.includes('api') || text.includes('trading'))) {
      score += 25;
      reason += (reason ? ' + ' : '') + 'Solana ecosystem relevance';
      actionPlan = 'Demonstrate Mobula\'s superior Solana coverage and real-time capabilities';
      mobulaServices.push('Solana Support');
    }
    
    if (text.includes('trading bot') && text.includes('api')) {
      score += 22;
      reason += (reason ? ' + ' : '') + 'Trading bot API focus';
      actionPlan = 'Show how Mobula\'s APIs enhance trading bot performance with comprehensive data';
      mobulaServices.push('Trading APIs');
    }
    
    // Platform authority bonus
    const platformBonuses = {
      'dev.to': 15,
      'medium.com': 12,
      'coincodecap.com': 15,
      'hackernoon.com': 10,
      'reddit.com': 18,
      'quicknode.com': 12
    };
    
    for (const [platformDomain, bonus] of Object.entries(platformBonuses)) {
      if (domain.includes(platformDomain)) {
        score += bonus;
        break;
      }
    }
    
    // Content type bonuses
    if (text.includes('comparison') || text.includes('vs') || text.includes('alternative')) {
      score += 10;
    }
    
    return {
      relevanceScore: Math.min(100, score),
      mobulaServices: [...new Set(mobulaServices)],
      reason: reason || 'General crypto API content',
      actionPlan: actionPlan || 'Share Mobula\'s advantages in the discussion'
    };
  }

  processOpportunities(opportunities) {
    // Remove duplicates by URL
    const uniqueOpportunities = Array.from(
      new Map(opportunities.map(opp => [opp.url, opp])).values()
    );

    // Sort by relevance score (highest first)
    return uniqueOpportunities
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 15); // Limit to top 15 per week
  }

  async saveToNotion(opportunities) {
    if (opportunities.length === 0) return 0;

    console.log(`\n💾 Saving ${opportunities.length} opportunities to Notion...\n`);
    
    let savedCount = 0;
    const weekPrefix = `WEEK-${new Date().toISOString().split('T')[0]}`;

    for (const opp of opportunities) {
      try {
        await this.saveOpportunityToNotion(opp, weekPrefix);
        savedCount++;
        
        console.log(`✅ [${savedCount}] ${opp.title.substring(0, 50)}...`);
        console.log(`   🎯 Score: ${opp.relevanceScore}/100 - ${opp.reason}`);
        console.log(`   🔗 ${opp.url}`);
        console.log('');
        
        await this.sleep(1000);
      } catch (error) {
        console.log(`❌ Failed to save: ${opp.title.substring(0, 40)}... - ${error.message}`);
      }
    }

    return savedCount;
  }

  async saveOpportunityToNotion(opportunity, weekPrefix) {
    const notionData = {
      parent: {
        database_id: NOTION_DATABASE_ID
      },
      properties: {
        'Title': {
          title: [{ text: { content: `${weekPrefix}: ${opportunity.title}` } }]
        },
        'URL': {
          url: opportunity.url
        },
        'Priority Score': {
          number: opportunity.relevanceScore
        },
        'Type': {
          select: { name: 'Weekly Scan' }
        },
        'Target Keywords': {
          multi_select: this.generateKeywords(opportunity).map(keyword => ({
            name: keyword
          }))
        },
        'Status': {
          status: { name: 'Not started' }
        },
        'Generated At': {
          date: { start: new Date().toISOString().split('T')[0] }
        }
      }
    };

    const response = await axios.post('https://api.notion.com/v1/pages', notionData, {
      headers: {
        'Authorization': `Bearer ${NOTION_TOKEN}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      }
    });

    return response.data;
  }

  generateKeywords(opportunity) {
    const keywords = [];
    const text = opportunity.title.toLowerCase();
    
    // Add relevant keywords based on content
    if (text.includes('api')) keywords.push('crypto api');
    if (text.includes('solana')) keywords.push('solana api');
    if (text.includes('trading')) keywords.push('trading bot');
    if (text.includes('wallet')) keywords.push('wallet tracker');
    if (text.includes('portfolio')) keywords.push('portfolio tracker');
    if (text.includes('coinmarketcap')) keywords.push('coinmarketcap alternative');
    if (text.includes('moralis')) keywords.push('moralis alternative');
    if (text.includes('defi')) keywords.push('defi analytics');
    
    return keywords.slice(0, 5);
  }

  generateWeeklySummary(opportunities, savedCount) {
    console.log('\n🎯 WEEKLY SCAN SUMMARY');
    console.log('=' .repeat(50));
    console.log(`📊 Opportunities found: ${opportunities.length}`);
    console.log(`💾 Successfully saved: ${savedCount}`);
    console.log(`📅 Next scan: ${this.getNextTuesday()}`);
    
    if (opportunities.length > 0) {
      console.log('\n🏆 TOP 5 OPPORTUNITIES:');
      opportunities.slice(0, 5).forEach((opp, i) => {
        console.log(`\n${i + 1}. ${opp.title}`);
        console.log(`   📍 ${opp.domain}`);
        console.log(`   🎯 ${opp.relevanceScore}/100 - ${opp.reason}`);
        console.log(`   🔗 ${opp.url}`);
        console.log(`   💡 ${opp.actionPlan}`);
      });

      // Category breakdown
      const categories = {};
      opportunities.forEach(opp => {
        const services = opp.mobulaServices || ['General'];
        services.forEach(service => {
          categories[service] = (categories[service] || 0) + 1;
        });
      });

      console.log('\n📈 OPPORTUNITIES BY CATEGORY:');
      Object.entries(categories)
        .sort(([,a], [,b]) => b - a)
        .forEach(([category, count]) => {
          console.log(`   ${category}: ${count}`);
        });
    }

    console.log('\n✅ Weekly scan completed successfully!');
  }

  getNextTuesday() {
    const nextTuesday = new Date();
    const daysUntilTuesday = (2 - nextTuesday.getDay() + 7) % 7 || 7; // 2 = Tuesday
    nextTuesday.setDate(nextTuesday.getDate() + daysUntilTuesday);
    return nextTuesday.toLocaleDateString();
  }

  extractDomain(url) {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return '';
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Main execution
async function main() {
  const scanner = new MobulaOpportunityScanner();
  
  try {
    await scanner.runWeeklyScan();
    process.exit(0);
  } catch (error) {
    console.error('❌ Weekly scan failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = MobulaOpportunityScanner;