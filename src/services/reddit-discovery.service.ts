import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '../config/config.service';
import { OpenAIService } from './openai.service';
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
  
  // SEARCH-TARGETED: Use search terms that find API discussions from the last year
  private readonly subredditConfigs: SubredditConfig[] = [
    {
      name: 'ethdev',
      keywords: ['"what do you use"', '"which api"', '"recommend api"', 'coingecko', 'moralis', 'api', '"data source"', 'endpoint'],
      maxPostsPerScan: 30,
      minScore: 1,
    },
    {
      name: 'ethereum', 
      keywords: ['"best api"', '"what api"', 'coingecko', 'moralis', 'alchemy', 'api', '"price data"', 'endpoint'],
      maxPostsPerScan: 30,
      minScore: 1,
    },
    {
      name: 'solana',
      keywords: ['"what api"', '"which api"', '"recommend api"', 'coingecko', 'moralis', 'alchemy', '"data api"', 'api', 'endpoint', '"price feed"'],
      maxPostsPerScan: 30,
      minScore: 1,
    },
    {
      name: 'cryptocurrency',
      keywords: ['"what do you use"', 'api', 'coingecko', 'coinmarketcap', '"data source"', 'endpoint', '"price api"'],
      maxPostsPerScan: 25,
      minScore: 2,
    },
    {
      name: 'defi',
      keywords: ['api', '"price data"', 'coingecko', 'moralis', '"data feed"', 'endpoint', '"what do you use"'],
      maxPostsPerScan: 20,
      minScore: 2,
    },
    {
      name: 'web3',
      keywords: ['api', '"which api"', 'coingecko', 'moralis', 'alchemy', '"data source"', 'endpoint'],
      maxPostsPerScan: 20,
      minScore: 2,
    }
  ];

  // MOBULA DOCS ONLY: Must match exact services from Mobula documentation
  private readonly mobulaDocServices = [
    // Market Data API (Octopus) - Mobula's core offering
    'price api', 'market data', 'crypto prices', 'token prices', 'trading pairs',
    'price feed', 'market cap', 'volume data', 'ohlc', 'price chart',
    
    // Wallet Data API - Mobula's wallet analytics
    'wallet data', 'wallet api', 'transaction history', 'wallet activity',
    'token holdings', 'wallet balance', 'portfolio data', 'defi positions',
    
    // Metadata API (Metacore) - Mobula's token metadata
    'token metadata', 'token info', 'token data', 'contract data',
    'token details', 'asset metadata',
    
    // Multi-chain Data - Mobula's 30+ chains
    'multi chain', 'cross chain', 'multiple blockchains', 'all chains',
    
    // WebSocket/Real-time - Mobula's streaming
    'websocket', 'real time', 'live data', 'streaming',
    
    // Common API search terms that developers use
    'json api', 'rest api', 'api call', 'api request', 'api response', 'api key',
    'rate limit', 'api documentation', 'api pricing', 'free api', 'paid api',
    
    // Competitor mentions (perfect opportunities)
    'coingecko api', 'coinmarketcap api', 'moralis api', 'alchemy api',
    'coingecko', 'coinmarketcap', 'moralis', 'alchemy'
  ];

  // REQUIRE: Posts must contain both a question word AND development context
  private readonly questionWords = ['how', 'what', 'which', 'where', 'who', 'why', 'when', 'help', 'need', 'looking for', 'recommend', 'suggest', 'advice', 'anyone', 'does anyone', 'thoughts', 'opinions', 'experience', 'best way', 'alternative'];
  private readonly buildingWords = ['build', 'create', 'develop', 'make', 'implement', 'integrate', 'code', 'program', 'api', 'bot', 'dashboard', 'app', 'platform', 'trading', 'project', 'solution', 'tool', 'service', 'data', 'feed', 'source'];

  constructor(
    private configService: ConfigService,
    private openaiService: OpenAIService,
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
    // Get all opportunities but filter for new ones only
    const allOpportunities = await this.discoverOpportunities();
    
    // Filter for only new opportunities (not seen before)
    const newOpportunities = allOpportunities.filter(opp => !this.seenPostIds.has(opp.postId));
    
    // Add new post IDs to our seen set
    newOpportunities.forEach(opp => this.seenPostIds.add(opp.postId));
    
    this.lastScanTimestamp = new Date();
    
    if (newOpportunities.length > 0) {
      this.logger.log(`🆕 Found ${newOpportunities.length} NEW Reddit opportunities (${allOpportunities.length} total scanned, ${allOpportunities.length - newOpportunities.length} already seen)`);
    } else {
      this.logger.log(`✅ No new Reddit opportunities found (scanned ${allOpportunities.length} posts, all previously seen)`);
    }
    
    return newOpportunities;
  }

  private async scrapeSubreddit(config: SubredditConfig): Promise<RedditOpportunity[]> {
    const opportunities: RedditOpportunity[] = [];

    try {
      // Search through the last year, not just hot posts
      const url = `https://www.reddit.com/r/${config.name}/search.json?q=${config.keywords.join(' OR ')}&restrict_sr=1&sort=relevance&t=year&limit=${config.maxPostsPerScan}`;
      
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'MobulaAPI:SEOMonitor:v1.0.0 (monitoring only)',
        },
        timeout: 10000,
      });

      const posts = response.data.data.children;

      for (const postData of posts) {
        const post = postData.data;
        
        // Skip if we've already seen this post
        if (this.seenPostIds.has(post.id)) continue;
        
        // Skip if post score is too low
        if (post.score < config.minScore) continue;

        // ULTRA-STRICT: Post must be a development question about APIs/building
        const postText = `${post.title} ${post.selftext || ''}`.toLowerCase();
        
        // REQUIREMENT 1: Must match services from Mobula's documentation
        const docServiceMatches = this.mobulaDocServices.filter(phrase => 
          postText.includes(phrase.toLowerCase())
        );
        if (docServiceMatches.length === 0) continue;

        // REQUIREMENT 2: Must be asking for help or building something
        const hasQuestionWord = this.questionWords.some(word => postText.includes(word));
        const hasBuildingContext = this.buildingWords.some(word => postText.includes(word));
        if (!hasQuestionWord && !hasBuildingContext) continue;
        
        // SIMPLIFIED SPAM FILTER: Reject obvious spam/memes/investment advice
        const rejectKeywords = [
          'buy', 'sell', 'hold', 'moon', 'pump', 'dump', 'hodl', 'to the moon',
          'check out my', 'follow me', 'dm me', 'telegram', 'discord',
          'airdrop', 'giveaway', 'promo code', 'referral',
          'meme coin', 'joke token', 'lol', 'haha', 'ser', 'anon'
        ];
        
        // Reject posts containing spam keywords
        if (rejectKeywords.some(reject => postText.includes(reject.toLowerCase()))) continue;
        
        // REQUIRE: Must have crypto/blockchain context OR be in relevant subreddit
        const cryptoKeywords = [
          'crypto', 'blockchain', 'bitcoin', 'ethereum', 'defi', 'web3',
          'binance', 'coinbase', 'uniswap', 'trading', 'token', 'wallet'
        ];
        
        const hasCryptoContext = cryptoKeywords.some(crypto => postText.includes(crypto.toLowerCase()));
        const isRelevantSubreddit = ['ethereum', 'ethdev', 'solana', 'web3', 'defi'].includes(config.name);
        
        // Skip if neither crypto context nor relevant subreddit  
        if (!hasCryptoContext && !isRelevantSubreddit) continue;
        
        // Use the Mobula documentation services that matched
        const allMatchedKeywords = docServiceMatches;

        // Calculate opportunity score
        const opportunityScore = this.calculateOpportunityScore(
          post,
          allMatchedKeywords,
          config
        );

        // Quality threshold - focus on genuinely valuable opportunities
        if (opportunityScore < 55) continue;

        // CRITICAL: Filter out posts older than 1 year (stale opportunities)
        const postAge = Date.now() - (post.created_utc * 1000);
        const oneYearInMs = 365 * 24 * 60 * 60 * 1000;
        if (postAge > oneYearInMs) {
          continue; // Skip posts older than 1 year
        }

        // Generate engagement suggestion (not automated response)
        const engagementSuggestion = await this.generateEngagementSuggestion(post, allMatchedKeywords);

        // Add to seen posts to prevent duplicates
        this.seenPostIds.add(post.id);

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
          keywords: allMatchedKeywords,
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
      'solana': 1.4,
      'defi': 1.3,
      'web3': 1.3,
    };
    score *= subredditMultipliers[config.name] || 1.0;

    // Quality developer discussion indicators
    const postText = `${post.title} ${post.selftext}`.toLowerCase();
    
    // Question indicators (developers asking for help)
    const questionWords = ['how', 'what', 'where', 'which', 'help', 'need', 'looking for', 'recommend'];
    const hasQuestion = questionWords.some(word => postText.includes(word));
    if (hasQuestion) score += 20;
    
    // Technical depth indicators (quality discussions)
    const technicalWords = ['integrate', 'implementation', 'build', 'develop', 'code', 'api key', 'endpoint', 'response'];
    const technicalMatches = technicalWords.filter(word => postText.includes(word)).length;
    score += technicalMatches * 5;
    
    // Data/trading specific bonus
    const dataWords = ['real-time', 'historical', 'price feed', 'market data', 'trading data', 'ohlc', 'volume'];
    const dataMatches = dataWords.filter(word => postText.includes(word)).length;
    score += dataMatches * 8;

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
      const response = await this.openaiService.generateContent({
        type: 'reddit_response',
        topic: post.title,
        keywords: keywords,
        targetAudience: 'developers',
        additionalContext: prompt,
      });

      return response.content;
    } catch (error) {
      this.logger.error(`Failed to generate engagement suggestion with OpenAI: ${error.message}`);
      return `MANUAL ENGAGEMENT OPPORTUNITY: User asking about ${keywords.join(', ')} - consider offering helpful technical advice about Mobula's blockchain API services. Focus on being genuinely helpful rather than promotional.`;
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