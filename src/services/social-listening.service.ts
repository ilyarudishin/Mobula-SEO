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

    // Focus only on platforms you requested
    try {
      // HackerNews has a public API - monitor for crypto/blockchain discussions
      const hnMentions = await this.monitorHackerNews();
      allMentions.push(...hnMentions);
      
      // Skip GitHub - not requested by user
      this.logger.log('Focusing on HackerNews only for social listening as requested');

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

  // GitHub monitoring removed - not requested by user

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

  // GitHub relevance calculation removed - not needed

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

  // GitHub response generation removed - not needed

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