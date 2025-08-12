import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { ConfigService } from '../config/config.service';

export interface KeywordData {
  keyword: string;
  searchVolume: number;
  cpc: number;
  competition: number;
  competitionLevel: 'low' | 'medium' | 'high';
  trends: number[];
  difficulty: number;
}

export interface SerpResult {
  position: number;
  title: string;
  url: string;
  description: string;
  domain: string;
  type: string;
}

export interface CompetitorAnalysis {
  domain: string;
  organicKeywords: number;
  organicTraffic: number;
  organicCost: number;
  topKeywords: KeywordData[];
}

@Injectable()
export class DataForSeoService {
  private readonly logger = new Logger(DataForSeoService.name);
  private readonly client: AxiosInstance;
  private readonly baseUrl = 'https://api.dataforseo.com/v3';

  constructor(private configService: ConfigService) {
    const config = this.configService.config;
    
    this.client = axios.create({
      baseURL: this.baseUrl,
      auth: {
        username: config.dataForSeo.login,
        password: config.dataForSeo.password,
      },
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  async testConnection(): Promise<boolean> {
    try {
      // Use the appendix/user_data endpoint to check connection
      const response = await this.client.get('/appendix/user_data');
      
      if (response.data && response.data.status_code === 20000) {
        this.logger.log('DataForSEO connection successful');
        this.logger.log(`User data: ${JSON.stringify(response.data.tasks?.[0]?.result || 'No result')}`);
        return true;
      } else {
        this.logger.error(`DataForSEO API error: ${response.data?.status_message || 'Unknown error'}`);
        return false;
      }
    } catch (error) {
      this.logger.error(`DataForSEO connection failed: ${error.message}`, error.stack);
      return false;
    }
  }

  async getKeywordData(keywords: string[], location = 2840): Promise<KeywordData[]> {
    this.logger.log(`Getting keyword data for ${keywords.length} keywords`);

    const postData = [
      {
        keywords: keywords,
        language_code: 'en',
        location_code: location, // United States
        include_serp_info: true,
      },
    ];

    try {
      const response = await this.client.post('/keywords_data/google_ads/search_volume/live', postData);
      
      if (response.data.status_code === 20000) {
        const results = response.data.tasks[0].result;
        
        return results.map((item: any) => ({
          keyword: item.keyword,
          searchVolume: item.search_volume || 0,
          cpc: item.cpc || 0,
          competition: item.competition || 0,
          competitionLevel: this.getCompetitionLevel(item.competition || 0),
          trends: item.monthly_searches?.map((m: any) => m.search_volume) || [],
          difficulty: this.calculateKeywordDifficulty(item),
        }));
      } else {
        throw new Error(`DataForSEO API error: ${response.data.status_message}`);
      }
    } catch (error) {
      this.logger.error(`Failed to get keyword data: ${error.message}`, error.stack);
      throw new Error(`Keyword data request failed: ${error.message}`);
    }
  }

  async getSerpResults(keyword: string, location = 2840): Promise<SerpResult[]> {
    this.logger.log(`Getting SERP results for keyword: ${keyword}`);

    const postData = [
      {
        keyword: keyword,
        language_code: 'en',
        location_code: location,
        device: 'desktop',
        os: 'windows',
      },
    ];

    try {
      const response = await this.client.post('/serp/google/organic/live/advanced', postData);

      if (response.data.status_code === 20000) {
        const items = response.data.tasks[0].result[0].items || [];
        
        return items
          .filter((item: any) => item.type === 'organic')
          .map((item: any, index: number) => ({
            position: index + 1,
            title: item.title || '',
            url: item.url || '',
            description: item.description || '',
            domain: this.extractDomain(item.url || ''),
            type: item.type || 'organic',
          }));
      } else {
        throw new Error(`DataForSEO SERP API error: ${response.data.status_message}`);
      }
    } catch (error) {
      this.logger.error(`Failed to get SERP results: ${error.message}`, error.stack);
      throw new Error(`SERP request failed: ${error.message}`);
    }
  }

  async getCompetitorAnalysis(domain: string): Promise<CompetitorAnalysis> {
    this.logger.log(`Analyzing competitor domain: ${domain}`);

    const postData = [
      {
        target: domain,
        location_code: 2840,
        language_code: 'en',
      },
    ];

    try {
      // Get organic keywords overview
      const overviewResponse = await this.client.post('/domain_analytics/google/organic/overview/live', postData);
      
      if (overviewResponse.data.status_code !== 20000) {
        throw new Error(`DataForSEO Domain API error: ${overviewResponse.data.status_message}`);
      }

      const overview = overviewResponse.data.tasks[0].result[0] || {};

      // Get top organic keywords
      const keywordsResponse = await this.client.post('/domain_analytics/google/organic/keywords/live', [
        {
          ...postData[0],
          limit: 100,
          order_by: ['organic_etv,desc'],
        },
      ]);

      const topKeywords = keywordsResponse.data.status_code === 20000 
        ? keywordsResponse.data.tasks[0].result.map((item: any) => ({
            keyword: item.keyword || '',
            searchVolume: item.search_volume || 0,
            cpc: item.cpc || 0,
            competition: item.competition_level || 0,
            competitionLevel: this.getCompetitionLevel(item.competition_level || 0),
            trends: [],
            difficulty: item.keyword_difficulty || 50,
          }))
        : [];

      return {
        domain,
        organicKeywords: overview.organic_keywords || 0,
        organicTraffic: overview.organic_etv || 0,
        organicCost: overview.organic_count || 0,
        topKeywords: topKeywords.slice(0, 20),
      };
    } catch (error) {
      this.logger.error(`Failed to analyze competitor: ${error.message}`, error.stack);
      throw new Error(`Competitor analysis failed: ${error.message}`);
    }
  }

  async findKeywordOpportunities(seedKeywords: string[]): Promise<KeywordData[]> {
    this.logger.log(`Finding keyword opportunities from ${seedKeywords.length} seed keywords`);

    const allOpportunities: KeywordData[] = [];

    for (const seedKeyword of seedKeywords) {
      try {
        // Get keyword suggestions
        const postData = [
          {
            keyword: seedKeyword,
            language_code: 'en',
            location_code: 2840,
            include_serp_info: true,
            limit: 100,
            filters: [
              ['search_volume', '>', 100],
              ['cpc', '>', 0.5],
            ],
          },
        ];

        const response = await this.client.post('/keywords_data/google_ads/keywords_for_keywords/live', postData);

        if (response.data.status_code === 20000) {
          const suggestions = response.data.tasks[0].result || [];
          
          const opportunities = suggestions
            .map((item: any) => ({
              keyword: item.keyword,
              searchVolume: item.search_volume || 0,
              cpc: item.cpc || 0,
              competition: item.competition || 0,
              competitionLevel: this.getCompetitionLevel(item.competition || 0),
              trends: item.monthly_searches?.map((m: any) => m.search_volume) || [],
              difficulty: this.calculateKeywordDifficulty(item),
            }))
            .filter((kw: KeywordData) => kw.searchVolume > 100 && kw.difficulty < 70)
            .sort((a: KeywordData, b: KeywordData) => b.searchVolume - a.searchVolume);

          allOpportunities.push(...opportunities);
        }

        // Rate limiting
        await this.sleep(1000);
      } catch (error) {
        this.logger.warn(`Failed to get opportunities for ${seedKeyword}: ${error.message}`);
      }
    }

    // Remove duplicates and sort by opportunity score
    const uniqueOpportunities = allOpportunities
      .filter((kw, index, self) => self.findIndex(k => k.keyword === kw.keyword) === index)
      .map(kw => ({
        ...kw,
        opportunityScore: this.calculateOpportunityScore(kw),
      }))
      .sort((a, b) => (b as any).opportunityScore - (a as any).opportunityScore);

    this.logger.log(`Found ${uniqueOpportunities.length} unique keyword opportunities`);
    return uniqueOpportunities.slice(0, 50); // Return top 50
  }

  private getCompetitionLevel(competition: number): 'low' | 'medium' | 'high' {
    if (competition < 0.33) return 'low';
    if (competition < 0.66) return 'medium';
    return 'high';
  }

  private calculateKeywordDifficulty(keywordData: any): number {
    // Simplified difficulty calculation based on competition and CPC
    const competition = keywordData.competition || 0;
    const cpc = keywordData.cpc || 0;
    
    let difficulty = competition * 100;
    
    // High CPC usually indicates competitive keywords
    if (cpc > 5) difficulty += 20;
    else if (cpc > 2) difficulty += 10;
    
    return Math.min(100, Math.round(difficulty));
  }

  private calculateOpportunityScore(keyword: KeywordData): number {
    let score = 0;
    
    // Higher search volume = higher score
    if (keyword.searchVolume > 10000) score += 40;
    else if (keyword.searchVolume > 1000) score += 30;
    else if (keyword.searchVolume > 500) score += 20;
    else score += 10;
    
    // Lower competition = higher score
    if (keyword.competitionLevel === 'low') score += 30;
    else if (keyword.competitionLevel === 'medium') score += 15;
    else score += 5;
    
    // Lower difficulty = higher score
    score += Math.max(0, 30 - keyword.difficulty);
    
    return Math.min(100, score);
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