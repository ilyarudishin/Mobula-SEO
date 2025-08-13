import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '../config/config.service';
import { ClaudeService } from './claude.service';
import axios from 'axios';

export interface RedditOpportunity {
  postId: string;
  postTitle: string;
  postUrl: string;
  subreddit: string;
  author: string;
  content: string;
  score: number;
  commentCount: number;
  opportunityScore: number;
  suggestedResponse: string;
  keywords: string[];
  timestamp: Date;
}

export interface SubredditConfig {
  name: string;
  keywords: string[];
  maxPostsPerScan: number;
  minScore: number;
}

@Injectable()
export class RedditDiscoveryService {
  private readonly logger = new Logger(RedditDiscoveryService.name);
  private readonly seenPostIds = new Set<string>();
  private lastScanTimestamp: Date | null = null;
  
  // Target DEVELOPER-focused subreddits for blockchain/API discussions
  private readonly subredditConfigs: SubredditConfig[] = [
    {
      name: 'ethdev',
      keywords: ['api', 'web3', 'blockchain', 'ethereum', 'dapp', 'smart contract', 'solidity'],
      maxPostsPerScan: 50,
      minScore: 3,
    },
    {
      name: 'webdev',
      keywords: ['blockchain api', 'crypto api', 'web3', 'integration', 'backend'],
      maxPostsPerScan: 40,
      minScore: 5,
    },
    {
      name: 'node',
      keywords: ['blockchain', 'crypto api', 'web3', 'ethereum', 'express', 'backend'],
      maxPostsPerScan: 30,
      minScore: 3,
    },
    {
      name: 'reactjs',
      keywords: ['web3', 'crypto', 'blockchain', 'dapp', 'frontend', 'integration'],
      maxPostsPerScan: 30,
      minScore: 3,
    },
    {
      name: 'learnprogramming',
      keywords: ['blockchain api', 'crypto api', 'web3', 'ethereum', 'programming'],
      maxPostsPerScan: 25,
      minScore: 3,
    },
    {
      name: 'javascript',
      keywords: ['blockchain', 'crypto api', 'web3', 'ethereum', 'node.js'],
      maxPostsPerScan: 25,
      minScore: 3,
    },
    {
      name: 'backend',
      keywords: ['blockchain api', 'crypto', 'web3', 'api integration', 'microservices'],
      maxPostsPerScan: 20,
      minScore: 3,
    },
    {
      name: 'defi',
      keywords: ['api', 'development', 'building', 'integration', 'smart contract'],
      maxPostsPerScan: 20,
      minScore: 3,
    }
  ];

  // Keywords that indicate DEVELOPER/API needs (not general crypto discussion)
  private readonly opportunityKeywords = [
    // Technical API needs
    'api integration', 'api documentation', 'api endpoint', 'api key', 'api rate limit',
    'blockchain api', 'crypto api', 'web3 api', 'ethereum api', 'polygon api',
    'how to connect', 'how to integrate', 'how to fetch', 'how to query',
    
    // Developer problems
    'building dapp', 'building app', 'developing', 'coding', 'programming',
    'node.js', 'javascript', 'python', 'react', 'next.js', 'typescript',
    
    // Data access issues
    'get blockchain data', 'fetch transaction', 'query smart contract', 'real-time data',
    'websocket', 'price feeds', 'market data api', 'trading data api',
    
    // Help requests (specific)
    'need help with', 'how do i', 'struggling to', 'cant figure out',
    'looking for api', 'api recommendation', 'best api for', 'which api',
    
    // Infrastructure discussion
    'alchemy alternative', 'moralis alternative', 'infura problems', 'rpc endpoint',
    'node provider', 'infrastructure', 'backend', 'serverless'
  ];

  constructor(
    private configService: ConfigService,
    private claudeService: ClaudeService,
  ) {
    this.logger.log('Reddit Discovery Service initialized - using web scraping for monitoring only');
  }

  async discoverOpportunities(): Promise<RedditOpportunity[]> {
    this.logger.log('🔍 Scanning Reddit for API/blockchain opportunities via web scraping...');

    const allOpportunities: RedditOpportunity[] = [];

    for (const subredditConfig of this.subredditConfigs) {
      try {
        const opportunities = await this.scrapeSubreddit(subredditConfig);
        allOpportunities.push(...opportunities);
        
        // Rate limiting to be respectful
        await this.sleep(2000);
      } catch (error) {
        this.logger.error(`Failed to scrape r/${subredditConfig.name}: ${error.message}`);
      }
    }

    // Sort by opportunity score and return top opportunities
    const sortedOpportunities = allOpportunities
      .sort((a, b) => b.opportunityScore - a.opportunityScore)
      .slice(0, 20);

    this.logger.log(`Found ${sortedOpportunities.length} total Reddit opportunities for manual engagement`);
    
    return sortedOpportunities;
  }

  async getNewOpportunities(): Promise<RedditOpportunity[]> {
    const allOpportunities = await this.discoverOpportunities();
    
    // Filter out opportunities we've already seen
    const newOpportunities = allOpportunities.filter(opp => !this.seenPostIds.has(opp.postId));
    
    // Add new post IDs to our seen set
    newOpportunities.forEach(opp => this.seenPostIds.add(opp.postId));
    
    // Clean up old post IDs (keep only last 500 to prevent memory leaks)
    if (this.seenPostIds.size > 500) {
      const idsArray = Array.from(this.seenPostIds);
      const toKeep = idsArray.slice(-400); // Keep last 400
      this.seenPostIds.clear();
      toKeep.forEach(id => this.seenPostIds.add(id));
    }
    
    this.lastScanTimestamp = new Date();
    
    if (newOpportunities.length > 0) {
      this.logger.log(`🆕 Found ${newOpportunities.length} NEW Reddit opportunities (${allOpportunities.length - newOpportunities.length} already seen)`);
    } else {
      this.logger.log(`✅ No new Reddit opportunities found (scanned ${allOpportunities.length} posts, all previously seen)`);
    }
    
    return newOpportunities;
  }

  private async scrapeSubreddit(config: SubredditConfig): Promise<RedditOpportunity[]> {
    const opportunities: RedditOpportunity[] = [];

    try {
      // Use Reddit's JSON API (public, no auth required)
      const url = `https://www.reddit.com/r/${config.name}/hot.json?limit=${config.maxPostsPerScan}`;
      
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'MobulaAPI:SEOMonitor:v1.0.0 (monitoring only)',
        },
        timeout: 10000,
      });

      const posts = response.data.data.children;

      for (const postData of posts) {
        const post = postData.data;
        
        // Skip if post score is too low
        if (post.score < config.minScore) continue;

        // Check if post contains relevant keywords
        const postText = `${post.title} ${post.selftext || ''}`.toLowerCase();
        const relevantKeywords = config.keywords.filter(keyword => 
          postText.includes(keyword.toLowerCase())
        );

        if (relevantKeywords.length === 0) continue;

        // Check if it's an opportunity (asking for help, looking for solutions)
        const isOpportunity = this.opportunityKeywords.some(keyword => 
          postText.includes(keyword.toLowerCase())
        );

        if (!isOpportunity) continue;

        // Calculate opportunity score
        const opportunityScore = this.calculateOpportunityScore(
          post,
          relevantKeywords,
          config
        );

        // Only consider high-value opportunities
        if (opportunityScore < 60) continue;

        // Generate engagement suggestion (not automated response)
        const engagementSuggestion = await this.generateEngagementSuggestion(post, relevantKeywords);

        opportunities.push({
          postId: post.id,
          postTitle: post.title,
          postUrl: `https://reddit.com/r/${config.name}/comments/${post.id}`,
          subreddit: config.name,
          author: post.author,
          content: post.selftext || '',
          score: post.score,
          commentCount: post.num_comments,
          opportunityScore,
          suggestedResponse: engagementSuggestion,
          keywords: relevantKeywords,
          timestamp: new Date(post.created_utc * 1000),
        });
      }
    } catch (error) {
      this.logger.error(`Error scraping r/${config.name}: ${error.message}`);
    }

    return opportunities;
  }

  private calculateOpportunityScore(
    post: any,
    keywords: string[],
    config: SubredditConfig
  ): number {
    let score = 0;

    // Base score from post engagement
    score += Math.min(30, post.score * 0.5); // Max 30 points from upvotes
    score += Math.min(20, post.num_comments * 2); // Max 20 points from comments

    // Keyword relevance bonus
    score += keywords.length * 10; // 10 points per relevant keyword

    // Subreddit quality multiplier
    const subredditMultipliers: { [key: string]: number } = {
      'cryptocurrency': 1.2,
      'ethdev': 1.5,
      'webdev': 1.3,
      'ethereum': 1.4,
      'defi': 1.3,
    };
    score *= subredditMultipliers[config.name] || 1.0;

    // Opportunity indicators bonus
    const postText = `${post.title} ${post.selftext}`.toLowerCase();
    const questionWords = ['how', 'what', 'where', 'which', 'help', 'need'];
    const hasQuestion = questionWords.some(word => postText.includes(word));
    if (hasQuestion) score += 15;

    // Recency bonus (newer posts are better opportunities)
    const hoursSincePost = (Date.now() - post.created_utc * 1000) / (1000 * 60 * 60);
    if (hoursSincePost < 6) score += 10;
    else if (hoursSincePost < 24) score += 5;

    return Math.min(100, Math.round(score));
  }

  private async generateEngagementSuggestion(post: any, keywords: string[]): Promise<string> {
    const prompt = `REDDIT ENGAGEMENT ANALYSIS - Manual Review Required

POST DETAILS:
Title: "${post.title}"
Content: "${post.selftext || 'No additional content'}"
Keywords: ${keywords.join(', ')}
Subreddit: r/${post.subreddit}

ENGAGEMENT STRATEGY SUGGESTION:

1. PROBLEM IDENTIFICATION:
   [What specific problem/question is the user asking?]

2. RESPONSE APPROACH:
   [How should someone from Mobula manually respond?]

3. VALUE-FIRST CONTENT:
   [What helpful information should be provided first?]

4. TECHNICAL DETAILS:
   [Code examples, resources, or technical advice to include]

5. MOBULA INTEGRATION (if relevant):
   [How to naturally mention Mobula as one solution among others]

6. ENGAGEMENT TYPE:
   [Help request / Comparison question / Technical tutorial / Resource request]

Format as actionable manual engagement guide following Mobula's authentic community engagement principles.`;

    try {
      const response = await this.claudeService.generateContent({
        type: 'reddit_response',
        topic: post.title,
        keywords: keywords,
        targetAudience: 'developers',
        additionalContext: prompt,
      });

      return response.content;
    } catch (error) {
      this.logger.error(`Failed to generate engagement suggestion: ${error.message}`);
      return `MANUAL ENGAGEMENT OPPORTUNITY: User asking about ${keywords.join(', ')} - consider offering helpful technical advice about blockchain API data solutions. Focus on being genuinely helpful rather than promotional.`;
    }
  }

  async getHighValueOpportunities(): Promise<RedditOpportunity[]> {
    const newOpportunities = await this.getNewOpportunities();
    return newOpportunities.filter(opp => opp.opportunityScore >= 80);
  }

  async getRecentOpportunities(hours: number = 24): Promise<RedditOpportunity[]> {
    const opportunities = await this.discoverOpportunities();
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    return opportunities.filter(opp => opp.timestamp > cutoff);
  }

  getDeduplicationStatus(): {
    seenPostsCount: number;
    lastScanTime: string | null;
    isInitialized: boolean;
  } {
    return {
      seenPostsCount: this.seenPostIds.size,
      lastScanTime: this.lastScanTimestamp?.toISOString() || null,
      isInitialized: this.seenPostIds.size > 0,
    };
  }


  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}