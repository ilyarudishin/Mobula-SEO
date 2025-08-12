import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '../config/config.service';
import { ClaudeService } from './claude.service';

export interface SocialMention {
  id: string;
  platform: 'twitter' | 'hackernews' | 'github' | 'linkedin';
  url: string;
  title: string;
  content: string;
  author: {
    username: string;
    followerCount?: number;
    verified?: boolean;
  };
  engagement: {
    likes: number;
    retweets?: number;
    replies: number;
    views?: number;
  };
  relevanceScore: number;
  opportunityType: 'mention' | 'question' | 'complaint' | 'comparison' | 'tutorial_request';
  suggestedResponse: string;
  targetKeywords: string[];
  timestamp: Date;
}

export interface SocialListeningTarget {
  platform: 'twitter' | 'hackernews' | 'github' | 'linkedin';
  keywords: string[];
  hashtags?: string[];
  accounts?: string[];
  minFollowers?: number;
  excludeTerms?: string[];
}

@Injectable()
export class SocialListeningService {
  private readonly logger = new Logger(SocialListeningService.name);
  
  // Social listening targets for blockchain/API conversations
  private readonly listeningTargets: SocialListeningTarget[] = [
    {
      platform: 'twitter',
      keywords: ['blockchain API', 'crypto API', 'web3 data', 'DeFi API'],
      hashtags: ['#blockchain', '#crypto', '#web3', '#DeFi', '#API'],
      accounts: ['@ethereum', '@defibuilders', '@web3devs'],
      minFollowers: 1000,
      excludeTerms: ['trading bot', 'pump', 'scam'],
    },
    {
      platform: 'hackernews',
      keywords: ['blockchain data', 'crypto infrastructure', 'web3 tools', 'API design'],
      excludeTerms: ['bitcoin price', 'trading', 'investment'],
    },
    {
      platform: 'github',
      keywords: ['blockchain-api', 'crypto-data', 'web3-sdk', 'defi-protocol'],
      excludeTerms: ['trading-bot', 'arbitrage'],
    },
    {
      platform: 'linkedin',
      keywords: ['blockchain technology', 'crypto infrastructure', 'web3 development'],
      excludeTerms: ['investment', 'trading', 'financial advice'],
    }
  ];

  // Keywords that indicate good engagement opportunities
  private readonly opportunityKeywords = [
    // Questions & Help Requests
    'how to', 'what is the best', 'looking for', 'need help', 'can anyone recommend',
    'struggling with', 'alternatives to', 'better than', 'comparison',
    
    // Pain Points & Complaints  
    'slow API', 'expensive', 'rate limited', 'unreliable', 'poor documentation',
    'missing features', 'outdated', 'difficult to use', 'confusing',
    
    // Technical Discussions
    'building with', 'integrating', 'implementing', 'architecture', 'best practices',
    'performance', 'scaling', 'optimization', 'real-time data',
    
    // Opportunity Indicators
    'tutorial needed', 'documentation lacking', 'would love to see', 'wish there was'
  ];

  // Mobula-relevant response triggers
  private readonly relevanceKeywords = [
    'blockchain API', 'crypto API', 'DeFi data', 'web3 infrastructure',
    'real-time crypto', 'market data API', 'blockchain analytics',
    'multi-chain data', 'DEX data', 'NFT API', 'crypto prices',
    'blockchain indexing', 'web3 data provider'
  ];

  constructor(
    private configService: ConfigService,
    private claudeService: ClaudeService,
  ) {}

  async listenForMentions(): Promise<SocialMention[]> {
    this.logger.log('👂 Listening for social media mentions and opportunities...');
    
    const allMentions: SocialMention[] = [];

    // 1. Monitor Twitter conversations
    const twitterMentions = await this.monitorTwitter();
    allMentions.push(...twitterMentions);

    // 2. Monitor HackerNews discussions
    const hackerNewsMentions = await this.monitorHackerNews();
    allMentions.push(...hackerNewsMentions);

    // 3. Monitor GitHub discussions
    const githubMentions = await this.monitorGitHub();
    allMentions.push(...githubMentions);

    // 4. Monitor LinkedIn posts
    const linkedinMentions = await this.monitorLinkedIn();
    allMentions.push(...linkedinMentions);

    // Sort by relevance score and return top mentions
    const sortedMentions = allMentions
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 20);

    this.logger.log(`Found ${sortedMentions.length} high-relevance social mentions`);
    
    return sortedMentions;
  }

  private async monitorTwitter(): Promise<SocialMention[]> {
    this.logger.log('🐦 Monitoring Twitter for blockchain API discussions...');
    
    // In real implementation, would use Twitter API v2
    // For now, return mock data representing common Twitter scenarios
    
    const mentions: SocialMention[] = [];
    
    const mockTweets = [
      {
        id: 'tweet_1',
        content: 'Anyone know a good blockchain API for getting DEX liquidity data? Need real-time feeds for my DeFi app. Current provider is too expensive 😩',
        author: 'defibuilder_eth',
        followerCount: 2500,
        engagement: { likes: 45, retweets: 12, replies: 8 },
        opportunityType: 'question' as const,
      },
      {
        id: 'tweet_2', 
        content: 'The state of crypto APIs is terrible. Half of them are down, the other half cost a fortune. We need better infrastructure! #web3 #blockchain',
        author: 'web3developer',
        followerCount: 8900,
        engagement: { likes: 234, retweets: 67, replies: 45 },
        opportunityType: 'complaint' as const,
      },
      {
        id: 'tweet_3',
        content: 'Building a multi-chain DeFi dashboard. What APIs do you recommend for getting price data across Ethereum, BSC, and Polygon? Need something reliable',
        author: 'fullstack_crypto',
        followerCount: 1200,
        engagement: { likes: 18, retweets: 3, replies: 12 },
        opportunityType: 'question' as const,
      }
    ];

    for (const tweet of mockTweets) {
      const suggestedResponse = await this.generateTwitterResponse(tweet);
      
      mentions.push({
        id: tweet.id,
        platform: 'twitter',
        url: `https://twitter.com/${tweet.author}/status/${tweet.id}`,
        title: `Tweet by @${tweet.author}`,
        content: tweet.content,
        author: {
          username: tweet.author,
          followerCount: tweet.followerCount,
          verified: tweet.followerCount > 5000,
        },
        engagement: tweet.engagement,
        relevanceScore: this.calculateRelevanceScore(tweet.content, 'twitter', tweet.engagement.likes + tweet.engagement.retweets),
        opportunityType: tweet.opportunityType,
        suggestedResponse,
        targetKeywords: this.extractRelevantKeywords(tweet.content),
        timestamp: new Date(),
      });
    }

    return mentions;
  }

  private async monitorHackerNews(): Promise<SocialMention[]> {
    this.logger.log('📰 Monitoring HackerNews for blockchain discussions...');
    
    const mentions: SocialMention[] = [];
    
    // Mock HackerNews discussions
    const mockHNItems = [
      {
        id: 'hn_12345',
        title: 'Ask HN: Best practices for building blockchain infrastructure?',
        content: 'I\'m building a DeFi platform and struggling with reliable data feeds. What APIs or services do you recommend for real-time blockchain data?',
        author: 'blockchain_startup',
        score: 127,
        comments: 89,
        opportunityType: 'question' as const,
      },
      {
        id: 'hn_12346',
        title: 'Show HN: Multi-chain portfolio tracker built with Web3 APIs',
        content: 'I built a portfolio tracker that works across 15+ blockchains. The biggest challenge was finding reliable APIs for all chains...',
        author: 'web3_hacker',
        score: 89,
        comments: 34,
        opportunityType: 'mention' as const,
      }
    ];

    for (const item of mockHNItems) {
      const suggestedResponse = await this.generateHackerNewsResponse(item);
      
      mentions.push({
        id: item.id,
        platform: 'hackernews',
        url: `https://news.ycombinator.com/item?id=${item.id}`,
        title: item.title,
        content: item.content,
        author: {
          username: item.author,
        },
        engagement: {
          likes: item.score,
          replies: item.comments,
        },
        relevanceScore: this.calculateRelevanceScore(item.content + ' ' + item.title, 'hackernews', item.score),
        opportunityType: item.opportunityType,
        suggestedResponse,
        targetKeywords: this.extractRelevantKeywords(item.content + ' ' + item.title),
        timestamp: new Date(),
      });
    }

    return mentions;
  }

  private async monitorGitHub(): Promise<SocialMention[]> {
    this.logger.log('🐙 Monitoring GitHub for blockchain API discussions...');
    
    const mentions: SocialMention[] = [];
    
    // Mock GitHub discussions/issues
    const mockGitHubItems = [
      {
        id: 'gh_issue_789',
        title: 'Feature Request: Multi-chain price feed integration',
        content: 'Our DeFi protocol needs reliable price feeds across multiple chains. Current solutions are either too expensive or unreliable...',
        author: 'protocol_dev',
        repository: 'defi-protocol/core',
        comments: 15,
        opportunityType: 'tutorial_request' as const,
      }
    ];

    for (const item of mockGitHubItems) {
      const suggestedResponse = await this.generateGitHubResponse(item);
      
      mentions.push({
        id: item.id,
        platform: 'github',
        url: `https://github.com/${item.repository}/issues/${item.id}`,
        title: item.title,
        content: item.content,
        author: {
          username: item.author,
        },
        engagement: {
          likes: 0,
          replies: item.comments,
        },
        relevanceScore: this.calculateRelevanceScore(item.content + ' ' + item.title, 'github', item.comments),
        opportunityType: item.opportunityType,
        suggestedResponse,
        targetKeywords: this.extractRelevantKeywords(item.content + ' ' + item.title),
        timestamp: new Date(),
      });
    }

    return mentions;
  }

  private async monitorLinkedIn(): Promise<SocialMention[]> {
    this.logger.log('💼 Monitoring LinkedIn for blockchain industry discussions...');
    
    const mentions: SocialMention[] = [];
    
    // Mock LinkedIn posts
    const mockLinkedInPosts = [
      {
        id: 'linkedin_post_456',
        content: 'The blockchain infrastructure space is evolving rapidly. Companies need reliable, cost-effective APIs to build the next generation of Web3 applications...',
        author: 'blockchain_cto',
        likes: 78,
        comments: 23,
        opportunityType: 'mention' as const,
      }
    ];

    for (const post of mockLinkedInPosts) {
      const suggestedResponse = await this.generateLinkedInResponse(post);
      
      mentions.push({
        id: post.id,
        platform: 'linkedin',
        url: `https://linkedin.com/posts/${post.author}_${post.id}`,
        title: `LinkedIn post by ${post.author}`,
        content: post.content,
        author: {
          username: post.author,
        },
        engagement: {
          likes: post.likes,
          replies: post.comments,
        },
        relevanceScore: this.calculateRelevanceScore(post.content, 'linkedin', post.likes),
        opportunityType: post.opportunityType,
        suggestedResponse,
        targetKeywords: this.extractRelevantKeywords(post.content),
        timestamp: new Date(),
      });
    }

    return mentions;
  }

  private calculateRelevanceScore(content: string, platform: string, engagement: number): number {
    let score = 0;
    const contentLower = content.toLowerCase();

    // Base relevance from keyword matching
    const relevantKeywords = this.relevanceKeywords.filter(keyword => 
      contentLower.includes(keyword.toLowerCase())
    );
    score += relevantKeywords.length * 15;

    // Opportunity keyword bonus
    const opportunityMatches = this.opportunityKeywords.filter(keyword =>
      contentLower.includes(keyword.toLowerCase())
    );
    score += opportunityMatches.length * 10;

    // Platform-specific engagement weighting
    const platformWeights = {
      twitter: 0.5,
      hackernews: 1.0,
      github: 1.5, // High value for technical discussions
      linkedin: 0.8,
    };
    score += Math.min(30, engagement * platformWeights[platform]);

    // Question indicators (high conversion potential)
    const questionWords = ['how', 'what', 'where', 'which', 'why', '?'];
    const hasQuestion = questionWords.some(word => contentLower.includes(word));
    if (hasQuestion) score += 20;

    // Pain point indicators (opportunity to help)
    const painWords = ['struggling', 'difficult', 'expensive', 'slow', 'unreliable', 'issue'];
    const hasPain = painWords.some(word => contentLower.includes(word));
    if (hasPain) score += 15;

    return Math.min(100, Math.round(score));
  }

  private extractRelevantKeywords(content: string): string[] {
    const contentLower = content.toLowerCase();
    return this.relevanceKeywords.filter(keyword => 
      contentLower.includes(keyword.toLowerCase())
    ).slice(0, 5);
  }

  private async generateTwitterResponse(tweet: any): Promise<string> {
    const prompt = `Generate a helpful Twitter reply for this tweet:

TWEET: "${tweet.content}"
AUTHOR: @${tweet.author} (${tweet.followerCount} followers)

Generate a reply that:
1. Directly addresses their question/concern
2. Provides genuine value first
3. Mentions Mobula API naturally (if truly relevant)
4. Uses appropriate Twitter tone (casual but professional)
5. Includes relevant hashtags
6. Stays under 280 characters

REPLY:`;

    try {
      const response = await this.claudeService.generateContent({
        type: 'outreach_email', // Using email type as closest match
        topic: 'twitter response',
        keywords: this.extractRelevantKeywords(tweet.content),
        targetAudience: 'developers',
        additionalContext: prompt,
      });

      return response.content;
    } catch (error) {
      this.logger.error(`Failed to generate Twitter response: ${error.message}`);
      return `For reliable blockchain data, check out Mobula API - supports 20M+ assets across 300+ exchanges with excellent docs. Perfect for DeFi apps! 🚀 #blockchain #DeFi #API`;
    }
  }

  private async generateHackerNewsResponse(item: any): Promise<string> {
    const prompt = `Generate a helpful HackerNews comment for this post:

TITLE: "${item.title}"
CONTENT: "${item.content}"

Generate a comment that:
1. Shows technical expertise
2. Provides specific, actionable advice
3. Mentions Mobula naturally (only if relevant)
4. Fits HackerNews culture (technical, detailed)
5. Adds genuine value to the discussion

COMMENT:`;

    try {
      const response = await this.claudeService.generateContent({
        type: 'outreach_email',
        topic: 'hackernews comment',
        keywords: this.extractRelevantKeywords(item.content + ' ' + item.title),
        targetAudience: 'technical developers',
        additionalContext: prompt,
      });

      return response.content;
    } catch (error) {
      this.logger.error(`Failed to generate HackerNews response: ${error.message}`);
      return `For blockchain infrastructure, I'd recommend looking at comprehensive data providers like Mobula. They handle the complexity of aggregating data across 300+ exchanges and 20M+ assets, which eliminates the need to manage multiple API integrations. Their WebSocket feeds are particularly good for real-time DeFi applications.`;
    }
  }

  private async generateGitHubResponse(item: any): Promise<string> {
    const prompt = `Generate a helpful GitHub comment for this issue:

TITLE: "${item.title}"
CONTENT: "${item.content}"

Generate a technical comment that:
1. Provides specific implementation guidance
2. Includes code examples if relevant
3. Suggests Mobula API as a solution (if appropriate)
4. Shows deep technical understanding
5. Helps solve their specific problem

COMMENT:`;

    try {
      const response = await this.claudeService.generateContent({
        type: 'outreach_email',
        topic: 'github technical response',
        keywords: this.extractRelevantKeywords(item.content + ' ' + item.title),
        targetAudience: 'protocol developers',
        additionalContext: prompt,
      });

      return response.content;
    } catch (error) {
      this.logger.error(`Failed to generate GitHub response: ${error.message}`);
      return `For multi-chain price feeds, you might want to consider Mobula's API. It provides unified access to price data across all major chains with a single integration. Here's a quick implementation example: \n\n\`\`\`javascript\nconst response = await fetch('https://api.mobula.io/api/1/market/multi-data?assets=ethereum,binancecoin&blockchain=ethereum,bsc');\n\`\`\`\n\nThis eliminates the complexity of managing multiple chain-specific integrations.`;
    }
  }

  private async generateLinkedInResponse(post: any): Promise<string> {
    const prompt = `Generate a professional LinkedIn comment for this post:

POST: "${post.content}"

Generate a comment that:
1. Adds professional insight
2. Shows industry expertise
3. Mentions Mobula naturally (if relevant)
4. Uses LinkedIn professional tone
5. Encourages further discussion

COMMENT:`;

    try {
      const response = await this.claudeService.generateContent({
        type: 'outreach_email',
        topic: 'linkedin professional response',
        keywords: this.extractRelevantKeywords(post.content),
        targetAudience: 'industry professionals',
        additionalContext: prompt,
      });

      return response.content;
    } catch (error) {
      this.logger.error(`Failed to generate LinkedIn response: ${error.message}`);
      return `Absolutely agree! The infrastructure layer is critical for Web3 adoption. At Mobula, we're seeing companies struggle with fragmented data sources and expensive API costs. The key is finding providers that offer comprehensive coverage with developer-friendly integration. What's been your biggest challenge in blockchain infrastructure?`;
    }
  }

  async getHighValueMentions(): Promise<SocialMention[]> {
    const mentions = await this.listenForMentions();
    return mentions.filter(mention => mention.relevanceScore >= 80);
  }

  async getMentionsByPlatform(platform: SocialMention['platform']): Promise<SocialMention[]> {
    const mentions = await this.listenForMentions();
    return mentions.filter(mention => mention.platform === platform);
  }

  async getMentionsByOpportunityType(type: SocialMention['opportunityType']): Promise<SocialMention[]> {
    const mentions = await this.listenForMentions();
    return mentions.filter(mention => mention.opportunityType === type);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}