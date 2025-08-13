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
  
  // Target subreddits with CRYPTO DATA PROVIDER discussions
  private readonly subredditConfigs: SubredditConfig[] = [
    {
      name: 'ethdev',
      keywords: ['data api', 'price api', 'market data', 'defi data', 'web3 data', 'moralis', 'alchemy'],
      maxPostsPerScan: 50,
      minScore: 2,
    },
    {
      name: 'defi',
      keywords: ['data provider', 'api', 'analytics', 'dashboard', 'tracking', 'yield data', 'protocol data'],
      maxPostsPerScan: 40,
      minScore: 2,
    },
    {
      name: 'cryptodevs',
      keywords: ['crypto api', 'blockchain api', 'data provider', 'price feeds', 'market data'],
      maxPostsPerScan: 30,
      minScore: 2,
    },
    {
      name: 'cryptocurrency',
      keywords: ['data api', 'price api', 'trading bot', 'portfolio tracker', 'analytics', 'dashboard'],
      maxPostsPerScan: 25,
      minScore: 5,
    },
    {
      name: 'webdev',
      keywords: ['crypto data', 'blockchain api', 'web3 api', 'price feeds', 'trading data'],
      maxPostsPerScan: 25,
      minScore: 3,
    },
    {
      name: 'node',
      keywords: ['crypto api', 'blockchain data', 'price feeds', 'trading bot', 'market data'],
      maxPostsPerScan: 20,
      minScore: 2,
    },
    {
      name: 'reactjs',
      keywords: ['crypto dashboard', 'defi dashboard', 'price tracker', 'web3 data', 'crypto data'],
      maxPostsPerScan: 20,
      minScore: 2,
    },
    {
      name: 'algotrading',
      keywords: ['crypto data', 'price feeds', 'market data', 'trading api', 'real-time data'],
      maxPostsPerScan: 15,
      minScore: 2,
    }
  ];

  // LASER-FOCUSED on crypto data provider conversations
  private readonly opportunityKeywords = [
    // Crypto Data Provider Needs
    'crypto data api', 'crypto data provider', 'crypto data service', 'blockchain data api',
    'crypto price api', 'crypto market data', 'real-time crypto data', 'crypto data feed',
    'web3 data', 'defi data', 'nft data', 'token data', 'crypto analytics api',
    
    // COMPREHENSIVE COMPETITOR LIST - ALL MAJOR CRYPTO DATA PROVIDERS
    // Tier 1 Competitors (Large Scale)
    'coingecko api', 'coinmarketcap api', 'coinbase api', 'binance api', 'kraken api',
    'coindesk api', 'cryptocompare api', 'nomics api', 'livecoinwatch api',
    
    // Web3 Infrastructure Providers
    'moralis api', 'alchemy api', 'infura api', 'quicknode api', 'getblock api',
    'nodereal api', 'ankr api', 'chainstack api', 'pocket network', 'blast api',
    
    // Blockchain Data Analytics
    'covalent api', 'dune analytics', 'the graph', 'bitquery', 'glassnode api', 
    'messari api', 'chainalysis api', 'elliptic api', 'nansen api', 'footprint analytics',
    'flipside crypto', 'santiment api', 'lunarcrush api', 'defipulse api',
    
    // DeFi Specific Data
    'debank api', 'zapper api', '1inch api', 'uniswap api', 'compound api',
    'aave api', 'curve api', 'yearn api', 'defillama api', 'coingecko defi',
    
    // NFT Data Providers
    'opensea api', 'rarible api', 'nftport api', 'moralis nft', 'alchemy nft',
    'reservoir api', 'simplehash api', 'nft api', 'nftgo api',
    
    // Market Data & Trading
    'tradingview api', 'yahoo finance', 'alpha vantage', 'polygon.io crypto',
    'iex cloud crypto', 'tiingo crypto', 'quandl crypto', 'marketstack crypto',
    
    // Real-time & WebSocket Providers
    'websocket api', 'real-time crypto', 'live price feeds', 'streaming data',
    'pusher crypto', 'socket.io crypto', 'ws crypto data',
    
    // Data Provider Comparisons & Alternatives
    'alternative to', 'vs', 'comparison', 'better than', 'cheaper than',
    'switch from', 'migrate from', 'replace', 'substitute for',
    
    // Specific Data Needs & Use Cases
    'price feeds', 'market data', 'trading data', 'defi protocols', 'liquidity data',
    'transaction history', 'wallet data', 'token metadata', 'nft metadata',
    'yield farming data', 'staking data', 'governance data', 'cross-chain data',
    'bridge data', 'layer 2 data', 'ethereum data', 'bitcoin data', 'polygon data',
    
    // LOW LATENCY & HIGH THROUGHPUT PAIN POINTS (Mobula's Key Advantages)
    'rate limits', 'api limits', 'data latency', 'high latency', 'slow api', 'slow data',
    'rate limited', 'throttled', 'timeout', 'connection timeout', 'response time',
    'real-time updates', 'websocket', 'low latency', 'high throughput', 'fast api',
    'instant data', 'millisecond latency', 'sub-second data', 'real-time pricing',
    
    // Data Quality & Coverage Issues
    'historical data', 'bulk data', 'data accuracy', 'data coverage', 'missing data',
    'blockchain coverage', '300+ chains', 'multi-chain', 'cross-chain', 'chain support',
    'outdated data', 'stale data', 'data freshness', 'data reliability',
    
    // Cost & Access Pain Points
    'expensive api', 'limited free tier', 'pricing', 'cost per request', 'monthly limits',
    'credit limits', 'quota exceeded', 'usage limits', 'subscription cost',
    
    // Reliability & Performance Issues
    'unreliable api', 'downtime', 'api downtime', 'service interruption', 'outage',
    'poor documentation', 'complex integration', 'difficult setup', 'auth issues',
    'api errors', '503 error', '429 error', 'timeout error',
    
    // Use Case Discussions
    'trading bot', 'portfolio tracker', 'defi dashboard', 'analytics platform',
    'crypto dashboard', 'price tracker', 'arbitrage bot', 'dex aggregator',
    'yield farming bot', 'liquidation bot', 'mev bot', 'crypto exchange',
    'wallet app', 'portfolio app', 'trading platform', 'crypto app development'
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