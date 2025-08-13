import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '../config/config.service';
import { ClaudeService } from './claude.service';
import axios from 'axios';

export interface SocialMention {
  id: string;
  platform: 'twitter' | 'hackernews' | 'github' | 'linkedin';
  title: string;
  content: string;
  url: string;
  author: {
    username: string;
    profileUrl: string;
    followerCount?: number;
  };
  engagement: {
    likes?: number;
    shares?: number;
    comments?: number;
    upvotes?: number;
  };
  relevanceScore: number;
  opportunityType: 'question' | 'complaint' | 'mention' | 'tutorial_request';
  targetKeywords: string[];
  suggestedResponse: string;
  timestamp: Date;
}

@Injectable()
export class SocialListeningService {
  private readonly logger = new Logger(SocialListeningService.name);

  constructor(
    private configService: ConfigService,
    private claudeService: ClaudeService,
  ) {}

  async listenForMentions(): Promise<SocialMention[]> {
    this.logger.log('🎧 Social Listening: Using real data from accessible platforms...');
    
    const allMentions: SocialMention[] = [];

    // Focus on platforms with public APIs for accurate data
    try {
      // HackerNews has a public API - monitor for crypto/blockchain discussions
      const hnMentions = await this.monitorHackerNews();
      allMentions.push(...hnMentions);
      
      // GitHub public API - monitor issues/discussions about crypto APIs
      const githubMentions = await this.monitorGitHub();
      allMentions.push(...githubMentions);

      // Twitter and LinkedIn require extensive API setup - skip for now
      this.logger.log('Twitter/LinkedIn monitoring requires API approval - focusing on accessible platforms');

    } catch (error) {
      this.logger.error(`Social listening error: ${error.message}`);
    }

    // Filter by relevance and age
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    const filteredMentions = allMentions
      .filter(mention => mention.timestamp > oneYearAgo)
      .filter(mention => mention.relevanceScore >= 60)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 10);

    this.logger.log(`Found ${filteredMentions.length} relevant social mentions from real data sources`);
    
    return filteredMentions;
  }

  private async monitorHackerNews(): Promise<SocialMention[]> {
    this.logger.log('📰 Monitoring HackerNews for blockchain API discussions...');
    
    const mentions: SocialMention[] = [];
    
    try {
      // Get top stories from HackerNews API
      const topStoriesResponse = await axios.get('https://hacker-news.firebaseio.com/v0/topstories.json');
      const topStoryIds = topStoriesResponse.data.slice(0, 50); // Check top 50 stories
      
      for (const storyId of topStoryIds) {
        try {
          const storyResponse = await axios.get(`https://hacker-news.firebaseio.com/v0/item/${storyId}.json`);
          const story = storyResponse.data;
          
          if (!story || !story.title) continue;
          
          // Check if story is relevant to crypto/blockchain APIs
          const relevantKeywords = [
            'blockchain api', 'crypto api', 'web3 api', 'defi api', 'ethereum api',
            'bitcoin api', 'cryptocurrency api', 'NFT api', 'solana api', 'polygon api'
          ];
          
          const storyText = `${story.title} ${story.text || ''}`.toLowerCase();
          const matchedKeywords = relevantKeywords.filter(keyword => 
            storyText.includes(keyword.toLowerCase())
          );
          
          if (matchedKeywords.length === 0) continue;
          
          // Calculate relevance score
          const relevanceScore = this.calculateRelevanceScore(story, matchedKeywords);
          
          if (relevanceScore < 60) continue;
          
          // Check age - only recent discussions
          const storyAge = Date.now() - (story.time * 1000);
          const oneYearInMs = 365 * 24 * 60 * 60 * 1000;
          if (storyAge > oneYearInMs) continue;
          
          const mention: SocialMention = {
            id: `hn_${story.id}`,
            platform: 'hackernews',
            title: story.title,
            content: story.title + (story.text ? ` - ${story.text.substring(0, 200)}...` : ''),
            url: `https://news.ycombinator.com/item?id=${story.id}`,
            author: {
              username: story.by || 'anonymous',
              profileUrl: `https://news.ycombinator.com/user?id=${story.by}`,
            },
            engagement: {
              upvotes: story.score || 0,
              comments: story.descendants || 0,
            },
            relevanceScore,
            opportunityType: this.determineOpportunityType(story.title + ' ' + (story.text || '')),
            targetKeywords: matchedKeywords,
            suggestedResponse: await this.generateHNResponse(story, matchedKeywords),
            timestamp: new Date(story.time * 1000),
          };
          
          mentions.push(mention);
          
          // Rate limiting
          await this.sleep(100);
          
        } catch (error) {
          this.logger.warn(`Error processing HN story ${storyId}: ${error.message}`);
        }
      }
      
    } catch (error) {
      this.logger.error(`Error monitoring HackerNews: ${error.message}`);
    }
    
    return mentions;
  }

  private async monitorGitHub(): Promise<SocialMention[]> {
    this.logger.log('🐱 Monitoring GitHub for blockchain API issues/discussions...');
    
    const mentions: SocialMention[] = [];
    
    try {
      // Search GitHub issues for blockchain API discussions
      const searchQueries = [
        'blockchain API rate limit',
        'crypto API slow',
        'web3 API latency',
        'DeFi API alternatives'
      ];
      
      for (const query of searchQueries) {
        const response = await axios.get(`https://api.github.com/search/issues`, {
          params: {
            q: query,
            sort: 'updated',
            per_page: 10,
          },
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'MobulaAPI-SEOAgent/1.0.0',
          },
        });
        
        for (const issue of response.data.items) {
          // Check age
          const issueAge = Date.now() - new Date(issue.updated_at).getTime();
          const oneYearInMs = 365 * 24 * 60 * 60 * 1000;
          if (issueAge > oneYearInMs) continue;
          
          const relevanceScore = this.calculateGitHubRelevance(issue, query);
          if (relevanceScore < 60) continue;
          
          const mention: SocialMention = {
            id: `gh_${issue.id}`,
            platform: 'github',
            title: issue.title,
            content: `${issue.title} - ${issue.body?.substring(0, 200) || ''}...`,
            url: issue.html_url,
            author: {
              username: issue.user.login,
              profileUrl: issue.user.html_url,
            },
            engagement: {
              comments: issue.comments,
            },
            relevanceScore,
            opportunityType: this.determineOpportunityType(issue.title + ' ' + (issue.body || '')),
            targetKeywords: [query],
            suggestedResponse: await this.generateGitHubResponse(issue, query),
            timestamp: new Date(issue.updated_at),
          };
          
          mentions.push(mention);
        }
        
        // Rate limiting for GitHub API
        await this.sleep(1000);
      }
      
    } catch (error) {
      this.logger.error(`Error monitoring GitHub: ${error.message}`);
    }
    
    return mentions;
  }

  private calculateRelevanceScore(item: any, keywords: string[]): number {
    let score = 0;
    
    // Base score from keyword matches
    score += keywords.length * 20;
    
    // Engagement bonus
    if (item.score) score += Math.min(20, item.score * 0.1); // HN score
    if (item.descendants) score += Math.min(15, item.descendants * 0.5); // Comments
    
    // Recency bonus
    const itemAge = Date.now() - (item.time * 1000);
    const dayInMs = 24 * 60 * 60 * 1000;
    if (itemAge < dayInMs) score += 15;
    else if (itemAge < dayInMs * 7) score += 10;
    else if (itemAge < dayInMs * 30) score += 5;
    
    return Math.min(100, score);
  }

  private calculateGitHubRelevance(issue: any, query: string): number {
    let score = 0;
    
    // Base relevance
    score += 40;
    
    // Issue activity
    score += Math.min(20, issue.comments * 2);
    
    // Recency
    const issueAge = Date.now() - new Date(issue.updated_at).getTime();
    const dayInMs = 24 * 60 * 60 * 1000;
    if (issueAge < dayInMs * 7) score += 15;
    else if (issueAge < dayInMs * 30) score += 10;
    
    // Keywords in title/body
    const text = `${issue.title} ${issue.body || ''}`.toLowerCase();
    const relevantTerms = ['api', 'rate limit', 'slow', 'latency', 'performance', 'alternative'];
    relevantTerms.forEach(term => {
      if (text.includes(term)) score += 5;
    });
    
    return Math.min(100, score);
  }

  private determineOpportunityType(content: string): 'question' | 'complaint' | 'mention' | 'tutorial_request' {
    content = content.toLowerCase();
    
    if (content.includes('?') || content.includes('how') || content.includes('what') || content.includes('which')) {
      return 'question';
    }
    if (content.includes('slow') || content.includes('expensive') || content.includes('bad') || content.includes('terrible')) {
      return 'complaint';
    }
    if (content.includes('tutorial') || content.includes('guide') || content.includes('learn')) {
      return 'tutorial_request';
    }
    
    return 'mention';
  }

  private async generateHNResponse(story: any, keywords: string[]): Promise<string> {
    return `Helpful technical response about ${keywords.join(', ')} for HackerNews discussion. Focus on providing value first, mention Mobula naturally if relevant to the specific technical problem being discussed.`;
  }

  private async generateGitHubResponse(issue: any, query: string): Promise<string> {
    return `Technical solution for GitHub issue about ${query}. Provide concrete code examples or architectural suggestions. Mention Mobula only if directly relevant to solving the specific technical problem.`;
  }

  async getHighValueMentions(): Promise<SocialMention[]> {
    const mentions = await this.listenForMentions();
    return mentions.filter(mention => mention.relevanceScore >= 80);
  }

  async getRecentMentions(hours: number = 24): Promise<SocialMention[]> {
    const mentions = await this.listenForMentions();
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    return mentions.filter(mention => mention.timestamp > cutoff);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}