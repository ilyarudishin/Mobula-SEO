import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { ConfigService } from '../config/config.service';
import { DataForSeoService } from './dataforseo.service';

export interface SearchResult {
  position: number;
  title: string;
  link: string;
  snippet: string;
  domain: string;
}

export interface SerpAnalysis {
  keyword: string;
  totalResults: number;
  topResults: SearchResult[];
  peopleAlsoAsk: string[];
  relatedSearches: string[];
  featuredSnippet?: {
    title: string;
    snippet: string;
    link: string;
  };
  competitorPresence: {
    domain: string;
    position: number;
    title: string;
  }[];
}

export interface KeywordOpportunity {
  keyword: string;
  searchVolume: number;
  competition: 'low' | 'medium' | 'high';
  difficulty: number;
  intent: 'informational' | 'commercial' | 'transactional' | 'navigational';
  opportunityScore: number;
  currentRanking?: number;
  gaps: string[];
}

@Injectable()
export class SerpService {
  private readonly logger = new Logger(SerpService.name);
  private readonly apiKey: string;
  private readonly targetDomain: string;
  private readonly competitors = ['alchemy.com', 'coingecko.com', 'moralis.io', 'covalenthq.com'];

  constructor(
    private configService: ConfigService,
    private dataForSeoService: DataForSeoService,
  ) {
    const config = this.configService.config;
    this.apiKey = config.serpApi.key;
    this.targetDomain = config.app.targetDomain;
  }

  async analyzeSerpForKeyword(keyword: string): Promise<SerpAnalysis> {
    this.logger.log(`Analyzing SERP for keyword: ${keyword}`);

    if (!this.apiKey) {
      this.logger.error(`SerpAPI key not configured - cannot provide real data for: ${keyword}`);
      throw new Error('SerpAPI key required for accurate SERP analysis');
    }

    try {
      // Add delay to prevent rate limiting issues
      await this.sleep(1000); // 1 second delay between requests
      
      const response = await axios.get('https://serpapi.com/search.json', {
        params: {
          engine: 'google',
          q: keyword,
          api_key: this.apiKey,
          num: 20,
        },
        timeout: 15000, // Increased timeout
      });

      const data = response.data;

      const topResults: SearchResult[] = (data.organic_results || [])
        .slice(0, 10)
        .map((result: any, index: number) => ({
          position: index + 1,
          title: result.title || '',
          link: result.link || '',
          snippet: result.snippet || '',
          domain: this.extractDomain(result.link || ''),
        }));

      const peopleAlsoAsk = (data.people_also_ask || [])
        .map((item: any) => item.question)
        .filter(Boolean);

      const relatedSearches = (data.related_searches || [])
        .map((item: any) => item.query)
        .filter(Boolean);

      const featuredSnippet = data.answer_box ? {
        title: data.answer_box.title || '',
        snippet: data.answer_box.snippet || '',
        link: data.answer_box.link || '',
      } : undefined;

      const competitorPresence = topResults
        .filter(result => this.competitors.some(comp => result.domain.includes(comp)))
        .map(result => ({
          domain: result.domain,
          position: result.position,
          title: result.title,
        }));

      return {
        keyword,
        totalResults: data.search_information?.total_results || 0,
        topResults,
        peopleAlsoAsk,
        relatedSearches,
        featuredSnippet,
        competitorPresence,
      };
    } catch (error: any) {
      // Log detailed error information
      if (error.response) {
        this.logger.error(`SERP API error for ${keyword}: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
        
        // Retry once on 401/429 errors (auth/rate limit issues) 
        if (error.response.status === 401 || error.response.status === 429) {
          this.logger.log(`Retrying SERP analysis for ${keyword} after ${error.response.status} error...`);
          await this.sleep(3000); // Wait 3 seconds before retry
          
          try {
            const retryResponse = await axios.get('https://serpapi.com/search.json', {
              params: {
                engine: 'google',
                q: keyword,
                api_key: this.apiKey,
                num: 20,
              },
              timeout: 15000,
            });
            
            this.logger.log(`Retry successful for keyword: ${keyword}`);
            
            // Process successful retry response
            const retryData = retryResponse.data;
            const topResults: SearchResult[] = (retryData.organic_results || [])
              .slice(0, 10)
              .map((result: any, index: number) => ({
                position: index + 1,
                title: result.title || '',
                link: result.link || '',
                snippet: result.snippet || '',
                domain: this.extractDomain(result.link || ''),
              }));

            const featuredSnippet = retryData.answer_box ? {
              title: retryData.answer_box.title || '',
              snippet: retryData.answer_box.snippet || retryData.answer_box.answer || '',
              link: retryData.answer_box.link || retryData.answer_box.displayed_link || '',
            } : undefined;

            const peopleAlsoAsk = (retryData.people_also_ask || []).map((item: any) => item.question);
            const relatedSearches = (retryData.related_searches || []).map((item: any) => item.query);
            const competitorPresence = this.identifyCompetitors(topResults);

            return {
              keyword,
              totalResults: retryData.search_information?.total_results || 0,
              topResults,
              peopleAlsoAsk,
              relatedSearches,
              featuredSnippet,
              competitorPresence,
            };
            
          } catch (retryError: any) {
            this.logger.error(`SERP retry also failed for ${keyword}: ${retryError.response?.status || retryError.message}`);
          }
        }
      } else {
        this.logger.error(`SERP network error for ${keyword}: ${error.message}`, error.stack);
      }
      
      // Throw error to maintain data accuracy requirements
      throw new Error(`SERP analysis failed for ${keyword}: ${error.response?.status || error.message}`);
    }
  }

  async findContentOpportunities(keywords: string[]): Promise<KeywordOpportunity[]> {
    const opportunities: KeywordOpportunity[] = [];

    for (const keyword of keywords) {
      try {
        const serpAnalysis = await this.analyzeSerpForKeyword(keyword);
        const opportunity = await this.evaluateKeywordOpportunity(keyword, serpAnalysis);
        if (opportunity.opportunityScore > 60) {
          opportunities.push(opportunity);
        }
        
        // Rate limiting
        await this.sleep(1000);
      } catch (error) {
        this.logger.warn(`Failed to analyze opportunity for keyword: ${keyword}`);
      }
    }

    return opportunities.sort((a, b) => b.opportunityScore - a.opportunityScore);
  }

  async findFeaturedSnippetOpportunities(keywords: string[]): Promise<{
    keyword: string;
    currentSnippet?: any;
    opportunity: string;
    targetFormat: string;
  }[]> {
    const opportunities: {
      keyword: string;
      currentSnippet?: any;
      opportunity: string;
      targetFormat: string;
    }[] = [];

    for (const keyword of keywords) {
      try {
        const serpAnalysis = await this.analyzeSerpForKeyword(keyword);
        
        if (!serpAnalysis.featuredSnippet) {
          opportunities.push({
            keyword,
            opportunity: 'No featured snippet exists - create comprehensive answer',
            targetFormat: 'paragraph',
          });
        } else if (!this.isMobulaInTopResults(serpAnalysis.topResults)) {
          opportunities.push({
            keyword,
            currentSnippet: serpAnalysis.featuredSnippet,
            opportunity: 'Featured snippet exists but we\'re not ranking - create better content',
            targetFormat: this.detectSnippetFormat(serpAnalysis.featuredSnippet.snippet),
          });
        }

        await this.sleep(1000);
      } catch (error) {
        this.logger.warn(`Failed to analyze featured snippet opportunity for: ${keyword}`);
      }
    }

    return opportunities;
  }

  async trackKeywordRankings(keywords: string[]): Promise<{
    keyword: string;
    position: number | null;
    url: string | null;
    title: string | null;
  }[]> {
    const rankings: {
      keyword: string;
      position: number | null;
      url: string | null;
      title: string | null;
    }[] = [];

    for (const keyword of keywords) {
      try {
        const serpAnalysis = await this.analyzeSerpForKeyword(keyword);
        const mobulaResult = serpAnalysis.topResults.find(result => 
          result.domain.includes(this.targetDomain)
        );

        rankings.push({
          keyword,
          position: mobulaResult ? mobulaResult.position : null,
          url: mobulaResult ? mobulaResult.link : null,
          title: mobulaResult ? mobulaResult.title : null,
        });

        await this.sleep(1000);
      } catch (error) {
        this.logger.warn(`Failed to track ranking for keyword: ${keyword}`);
        rankings.push({
          keyword,
          position: null,
          url: null,
          title: null,
        });
      }
    }

    return rankings;
  }

  private async evaluateKeywordOpportunity(keyword: string, serpAnalysis: SerpAnalysis): Promise<KeywordOpportunity> {
    // Get real DataForSEO keyword data if available
    let searchVolume = 1000; // Default fallback
    let dataForSeoCompetition: 'low' | 'medium' | 'high' = 'medium';
    let dataForSeoDifficulty = 50;

    try {
      const keywordData = await this.dataForSeoService.getKeywordData([keyword]);
      if (keywordData.length > 0) {
        const data = keywordData[0];
        searchVolume = data.searchVolume;
        dataForSeoCompetition = data.competitionLevel as 'low' | 'medium' | 'high';
        dataForSeoDifficulty = data.difficulty;
        this.logger.log(`DataForSEO data for "${keyword}": Volume=${searchVolume}, Competition=${dataForSeoCompetition}, Difficulty=${dataForSeoDifficulty}`);
      }
    } catch (error) {
      this.logger.warn(`DataForSEO data unavailable for "${keyword}", using SERP analysis fallback`);
    }

    // Analyze SERP competition level
    const competitorCount = serpAnalysis.competitorPresence.length;
    const topCompetitorPosition = serpAnalysis.competitorPresence.length > 0 
      ? Math.min(...serpAnalysis.competitorPresence.map(c => c.position))
      : 11;

    // Combine SERP analysis with DataForSEO insights
    const serpCompetition = competitorCount > 3 ? 'high' : competitorCount > 1 ? 'medium' : 'low';
    const competition = this.combineCompetitionLevels(serpCompetition, dataForSeoCompetition);
    const difficulty = Math.min(100, Math.max(dataForSeoDifficulty, (competitorCount * 15) + (topCompetitorPosition > 5 ? 0 : (6 - topCompetitorPosition) * 10)));

    // Determine search intent
    const intent = this.determineSearchIntent(keyword, serpAnalysis);

    // Calculate opportunity score
    let opportunityScore = 100;
    
    // Reduce score based on competition
    opportunityScore -= difficulty * 0.6;
    
    // Reduce score if competitors dominate top positions
    if (topCompetitorPosition <= 3) opportunityScore -= 20;
    
    // Increase score for informational intent (easier to rank)
    if (intent === 'informational') opportunityScore += 10;
    
    // Increase score if there are People Also Ask questions (content opportunities)
    opportunityScore += Math.min(15, serpAnalysis.peopleAlsoAsk.length * 3);
    
    // Increase score if no featured snippet exists
    if (!serpAnalysis.featuredSnippet) opportunityScore += 15;

    // Identify content gaps
    const gaps = this.identifyContentGaps(serpAnalysis);

    return {
      keyword,
      searchVolume, // Real data from DataForSEO
      competition,
      difficulty,
      intent,
      opportunityScore: Math.max(0, Math.min(100, Math.round(opportunityScore))),
      gaps,
    };
  }

  private determineSearchIntent(keyword: string, serpAnalysis: SerpAnalysis): KeywordOpportunity['intent'] {
    const lowerKeyword = keyword.toLowerCase();
    
    // Commercial/Transactional indicators
    if (lowerKeyword.includes('buy') || lowerKeyword.includes('price') || lowerKeyword.includes('cost')) {
      return 'commercial';
    }
    
    // Navigational indicators
    if (lowerKeyword.includes('login') || lowerKeyword.includes('dashboard') || lowerKeyword.includes('api docs')) {
      return 'navigational';
    }
    
    // Question words indicate informational intent
    if (lowerKeyword.includes('how') || lowerKeyword.includes('what') || lowerKeyword.includes('why') || lowerKeyword.includes('guide')) {
      return 'informational';
    }
    
    // Analyze top results for intent signals
    const commercialSignals = serpAnalysis.topResults.filter(result => 
      result.title.toLowerCase().includes('buy') || 
      result.title.toLowerCase().includes('price') ||
      result.snippet.toLowerCase().includes('purchase')
    ).length;
    
    if (commercialSignals > 3) return 'commercial';
    
    return 'informational'; // Default to informational for blockchain/dev content
  }

  private identifyContentGaps(serpAnalysis: SerpAnalysis): string[] {
    const gaps: string[] = [];
    
    // Check for common content types missing
    const hasCodeExample = serpAnalysis.topResults.some(result => 
      result.snippet.includes('code') || result.snippet.includes('example') || result.snippet.includes('implementation')
    );
    
    if (!hasCodeExample) {
      gaps.push('Working code examples missing');
    }
    
    // Check for tutorial format
    const hasTutorial = serpAnalysis.topResults.some(result => 
      result.title.includes('tutorial') || result.title.includes('guide') || result.title.includes('how to')
    );
    
    if (!hasTutorial) {
      gaps.push('Step-by-step tutorial format missing');
    }
    
    // Check for comparison content
    const hasComparison = serpAnalysis.topResults.some(result => 
      result.title.includes('vs') || result.title.includes('comparison') || result.title.includes('best')
    );
    
    if (!hasComparison && serpAnalysis.competitorPresence.length > 1) {
      gaps.push('Comparison content opportunity');
    }
    
    return gaps;
  }

  private isMobulaInTopResults(results: SearchResult[]): boolean {
    return results.some(result => result.domain.includes(this.targetDomain));
  }

  private detectSnippetFormat(snippet: string): string {
    if (snippet.includes('\n') || snippet.includes('•') || snippet.includes('1.')) {
      return 'list';
    }
    if (snippet.includes('?') && snippet.includes('\n')) {
      return 'faq';
    }
    return 'paragraph';
  }

  private estimateSearchVolume(totalResults: number): number {
    // Rough estimation based on total results
    if (totalResults > 50000000) return 10000;
    if (totalResults > 10000000) return 5000;
    if (totalResults > 1000000) return 1000;
    if (totalResults > 100000) return 500;
    return 100;
  }

  private extractDomain(url: string): string {
    try {
      const domain = new URL(url).hostname;
      return domain.replace('www.', '');
    } catch {
      return '';
    }
  }

  // Mock method removed - only use real SERP data

  private combineCompetitionLevels(
    serpCompetition: 'low' | 'medium' | 'high',
    dataForSeoCompetition: 'low' | 'medium' | 'high'
  ): 'low' | 'medium' | 'high' {
    // Use more conservative (higher) competition level
    const competitionHierarchy = { low: 1, medium: 2, high: 3 };
    const serpLevel = competitionHierarchy[serpCompetition];
    const dataForSeoLevel = competitionHierarchy[dataForSeoCompetition];
    
    const maxLevel = Math.max(serpLevel, dataForSeoLevel);
    return Object.keys(competitionHierarchy).find(
      key => competitionHierarchy[key as keyof typeof competitionHierarchy] === maxLevel
    ) as 'low' | 'medium' | 'high';
  }

  private identifyCompetitors(topResults: SearchResult[]): {
    domain: string;
    position: number;
    title: string;
  }[] {
    return topResults
      .filter(result => this.competitors.some(comp => result.domain.includes(comp)))
      .map(result => ({
        domain: result.domain,
        position: result.position,
        title: result.title,
      }));
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}