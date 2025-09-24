import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { DataForSeoService } from './dataforseo.service';
import { NotionService } from './notion.service';

@Injectable()
export class WeeklyOpportunityScannerService {
  private readonly logger = new Logger(WeeklyOpportunityScannerService.name);
  
  constructor(
    private readonly configService: ConfigService,
    private readonly dataForSeoService: DataForSeoService,
    private readonly notionService: NotionService,
  ) {}

  // Run every Tuesday at 9:00 AM UTC
  @Cron('0 9 * * 2', {
    name: 'weekly-mobula-opportunities',
    timeZone: 'UTC',
  })
  async scanWeeklyOpportunities() {
    this.logger.log('🚀 Starting weekly Mobula opportunity scan');
    
    try {
      const opportunities = await this.findMobulaOpportunities();
      const savedCount = await this.saveOpportunitiesToNotion(opportunities);
      
      this.logger.log(`✅ Weekly scan complete: ${savedCount} opportunities saved`);
      
      // Optional: Send Slack notification
      await this.sendScanSummary(opportunities, savedCount);
      
    } catch (error) {
      this.logger.error(`❌ Weekly scan failed: ${error.message}`, error.stack);
    }
  }

  private async findMobulaOpportunities(): Promise<any[]> {
    const searchQueries = [
      'coinmarketcap api alternative',
      'coingecko api alternative', 
      'moralis api alternative',
      'crypto wallet tracker api',
      'solana trading bot api',
      'real time crypto websocket api',
      'defi portfolio tracker api',
      'multi chain crypto api',
      'crypto market data api comparison',
      'best crypto price api developers'
    ];

    const opportunities = [];

    for (const query of searchQueries) {
      this.logger.log(`🔍 Searching: "${query}"`);
      
      try {
        const results = await this.executeSearch(query);
        const relevantResults = this.filterForMobulaRelevance(results, query);
        opportunities.push(...relevantResults);
        
        this.logger.log(`   ✅ Found ${relevantResults.length} relevant opportunities`);
        
        // Rate limiting
        await this.sleep(2500);
      } catch (error) {
        this.logger.warn(`   ❌ Search failed for "${query}": ${error.message}`);
      }
    }

    // Remove duplicates and sort by relevance
    const uniqueOpportunities = Array.from(
      new Map(opportunities.map(opp => [opp.url, opp])).values()
    ).sort((a, b) => b.relevanceScore - a.relevanceScore);

    return uniqueOpportunities.slice(0, 15); // Top 15 per week
  }

  private async executeSearch(keyword: string): Promise<any[]> {
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
          username: this.configService.get('DATAFORSEO_LOGIN'),
          password: this.configService.get('DATAFORSEO_PASSWORD')
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

  private filterForMobulaRelevance(results: any[], query: string): any[] {
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

  private analyzeMobulaRelevance(result: any): any {
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
    
    return {
      relevanceScore: Math.min(100, score),
      mobulaServices: [...new Set(mobulaServices)],
      reason: reason || 'General crypto API content',
      actionPlan: actionPlan || 'Share Mobula\'s advantages in the discussion'
    };
  }

  private async saveOpportunitiesToNotion(opportunities: any[]): Promise<number> {
    if (opportunities.length === 0) return 0;

    this.logger.log(`💾 Saving ${opportunities.length} opportunities to Notion`);
    
    let savedCount = 0;
    const weekPrefix = `WEEK-${new Date().toISOString().split('T')[0]}`;

    for (const opp of opportunities) {
      try {
        const keywords = await this.generateRealKeywords(opp);
        
        await this.notionService.createOpportunity({
          type: 'blog_article',
          title: `${weekPrefix}: ${opp.title}`,
          content: `**WEEKLY MOBULA OUTREACH OPPORTUNITY**

**Article:** ${opp.title}
**URL:** ${opp.url}
**Platform:** ${opp.domain}
**Relevance Score:** ${opp.relevanceScore}/100
**Search Query:** ${opp.searchQuery}

**Why This is Relevant to Mobula:**
${opp.reason}

**Recommended Action:**
${opp.actionPlan}

**Target Keywords:** ${keywords.join(', ')}

---

**📝 ACTION NEEDED:** 
Review this article and engage with valuable insights that naturally mention Mobula's advantages. Focus on providing genuine technical value to the community.`,
          priorityScore: opp.relevanceScore,
          status: 'identified',
          targetKeywords: keywords,
          competitionDifficulty: 50, // Default medium difficulty
          trafficPotential: Math.min(100, opp.relevanceScore * 1.2), // Estimate based on relevance
          generatedAt: new Date(),
          additionalData: {
            url: opp.url,
            domain: opp.domain,
            searchQuery: opp.searchQuery,
            mobulaServices: opp.mobulaServices,
            weeklyScanner: true,
            scanDate: new Date().toISOString().split('T')[0]
          }
        });
        
        savedCount++;
        this.logger.log(`✅ [${savedCount}] ${opp.title.substring(0, 50)}...`);
        
        await this.sleep(1000);
      } catch (error) {
        this.logger.warn(`❌ Failed to save: ${opp.title.substring(0, 40)}... - ${error.message}`);
      }
    }

    return savedCount;
  }

  private async generateRealKeywords(opportunity: any): Promise<string[]> {
    try {
      const serpApiKey = this.configService.get('SERPAPI_KEY');
      if (serpApiKey) {
        return await this.getRealKeywordsFromAPI(opportunity.title, serpApiKey);
      } else {
        return this.extractVerifiedKeywords(opportunity.title);
      }
    } catch (error) {
      this.logger.warn(`Keyword generation failed: ${error.message}`);
      return this.extractVerifiedKeywords(opportunity.title);
    }
  }

  private async getRealKeywordsFromAPI(title: string, apiKey: string): Promise<string[]> {
    const response = await axios.get('https://serpapi.com/search', {
      params: {
        engine: 'google',
        q: title.toLowerCase().replace(/[^\w\s]/g, '').substring(0, 100),
        api_key: apiKey,
        num: 5
      },
      timeout: 15000
    });

    const results = response.data.organic_results || [];
    const realKeywords = new Set<string>();

    results.forEach((result: any) => {
      const text = `${result.title || ''} ${result.snippet || ''}`.toLowerCase();
      const cryptoTerms = [
        'crypto api', 'cryptocurrency api', 'blockchain api',
        'trading api', 'price api', 'market data',
        'solana api', 'defi api', 'wallet api',
        'coinmarketcap', 'coingecko', 'moralis'
      ];

      cryptoTerms.forEach((term: string) => {
        if (text.includes(term)) {
          realKeywords.add(term);
        }
      });
    });

    return Array.from(realKeywords).slice(0, 5);
  }

  private extractVerifiedKeywords(title: string): string[] {
    const text = title.toLowerCase();
    const keywords = [];
    
    const keywordMap = {
      'api': 'crypto api',
      'solana': 'solana api', 
      'trading': 'trading api',
      'wallet': 'wallet api',
      'portfolio': 'portfolio tracker',
      'coinmarketcap': 'coinmarketcap alternative',
      'moralis': 'moralis alternative',
      'defi': 'defi api'
    };
    
    Object.entries(keywordMap).forEach(([term, keyword]) => {
      if (text.includes(term)) {
        keywords.push(keyword);
      }
    });
    
    return keywords.slice(0, 4);
  }

  private async sendScanSummary(opportunities: any[], savedCount: number): Promise<void> {
    // Optional: Send Slack notification with results
    const summary = {
      total: opportunities.length,
      saved: savedCount,
      topOpportunities: opportunities.slice(0, 3).map(opp => ({
        title: opp.title,
        score: opp.relevanceScore,
        url: opp.url
      }))
    };
    
    this.logger.log('📊 Weekly scan summary:', JSON.stringify(summary, null, 2));
  }

  private extractDomain(url: string): string {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return '';
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}