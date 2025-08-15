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
  
  // COMPREHENSIVE MOBULA COVERAGE: Capture ALL conversations related to Mobula's services
  private readonly subredditConfigs: SubredditConfig[] = [
    {
      name: 'ethdev',
      keywords: ['api', 'data', 'price', 'market', 'wallet', 'token', 'metadata', 'portfolio', 'balance', 'transaction', 'multi-chain', 'websocket', 'real-time', 'octopus', 'metacore'],
      maxPostsPerScan: 50,
      minScore: 1,
    },
    {
      name: 'ethereum', 
      keywords: ['api', 'data', 'price', 'market', 'wallet', 'token', 'dapp', 'web3', 'defi', 'portfolio', 'balance', 'transaction', 'multi-chain'],
      maxPostsPerScan: 50,
      minScore: 1,
    },
    {
      name: 'solana',
      keywords: ['api', 'data', 'price', 'market', 'wallet', 'token', 'portfolio', 'balance', 'transaction', 'multi-chain', 'cross-chain', 'real-time'],
      maxPostsPerScan: 50,
      minScore: 1,
    },
    {
      name: 'cryptocurrency',
      keywords: ['api', 'data', 'price', 'market', 'wallet', 'portfolio', 'token', 'crypto', 'trading', 'coingecko', 'coinmarketcap', 'real-time'],
      maxPostsPerScan: 40,
      minScore: 1,
    },
    {
      name: 'defi',
      keywords: ['api', 'data', 'price', 'market', 'wallet', 'portfolio', 'token', 'protocol', 'yield', 'liquidity', 'tvl', 'multi-chain'],
      maxPostsPerScan: 40,
      minScore: 1,
    },
    {
      name: 'web3',
      keywords: ['api', 'data', 'price', 'market', 'wallet', 'token', 'dapp', 'multi-chain', 'cross-chain', 'metadata', 'portfolio'],
      maxPostsPerScan: 40,
      minScore: 1,
    },
    {
      name: 'CryptoCurrency',
      keywords: ['api', 'data', 'price', 'market', 'wallet', 'portfolio', 'token', 'crypto', 'trading', 'charts', 'real-time'],
      maxPostsPerScan: 30,
      minScore: 2,
    },
    {
      name: 'Bitcoin',
      keywords: ['api', 'data', 'price', 'market', 'wallet', 'transaction', 'portfolio', 'multi-chain', 'cross-chain'],
      maxPostsPerScan: 25,
      minScore: 2,
    },
    {
      name: 'CryptoTechnology',
      keywords: ['api', 'data', 'blockchain', 'multi-chain', 'cross-chain', 'wallet', 'transaction', 'metadata', 'real-time'],
      maxPostsPerScan: 25,
      minScore: 1,
    },
    {
      name: 'cryptodevs',
      keywords: ['api', 'data', 'price', 'market', 'wallet', 'token', 'dapp', 'sdk', 'multi-chain', 'metadata'],
      maxPostsPerScan: 35,
      minScore: 1,
    },
    {
      name: 'programming',
      keywords: ['crypto api', 'blockchain api', 'wallet api', 'token data', 'crypto data', 'market data api'],
      maxPostsPerScan: 20,
      minScore: 3,
    },
    {
      name: 'webdev',
      keywords: ['crypto api', 'blockchain api', 'web3 api', 'token data', 'wallet data', 'market data'],
      maxPostsPerScan: 20,
      minScore: 3,
    }
  ];

  // COMPREHENSIVE MOBULA SERVICES: All services from Mobula documentation
  private readonly mobulaDocServices = [
    // MARKET DATA API (OCTOPUS ENGINE) - Core offering
    'price api', 'market data', 'crypto prices', 'token prices', 'asset prices',
    'price feed', 'market cap', 'volume data', 'ohlc', 'price chart', 'candlestick',
    'trading pairs', 'market pairs', 'price history', 'historical data',
    'octopus engine', 'octopus', 'pricing engine', 'price accuracy', 'price latency',
    '5 second updates', 'real-time prices', 'live prices', 'current price',
    
    // WALLET DATA API - Comprehensive wallet analytics  
    'wallet data', 'wallet api', 'wallet portfolio', 'portfolio api',
    'transaction history', 'wallet activity', 'wallet transactions',
    'token holdings', 'wallet balance', 'portfolio data', 'wallet explorer',
    'defi positions', 'wallet tracking', 'address analysis', 'wallet analytics',
    'pnl calculation', 'profit loss', 'average bought price', 'cost basis',
    'historical balances', 'balance history', 'usd pricing', 'enriched data',
    '30+ chains', 'evm blockchains', 'unified api', 'multi-chain wallet',
    
    // METADATA API (METACORE) - Token metadata and information
    'token metadata', 'token info', 'token data', 'contract data', 'asset data',
    'token details', 'asset metadata', 'metacore', 'token information',
    'logos', 'websites', 'socials', 'social links', 'token socials',
    'cross-checked data', 'coin listing', 'reputation systems', 'hourly updates',
    'new assets', 'token discovery', 'asset discovery',
    
    // MULTI-CHAIN SUPPORT - 50+ blockchains
    'multi chain', 'cross chain', 'multiple blockchains', 'all chains',
    'unified access', '50+ blockchains', 'ethereum', 'solana', 'polygon',
    'bnb chain', 'avalanche', 'arbitrum', 'optimism', 'base', 'fantom',
    'single api', 'multi-blockchain', 'cross-chain data', 'chain agnostic',
    
    // REAL-TIME & STREAMING - WebSockets and live data
    'websocket', 'real time', 'live data', 'streaming', 'real-time streaming',
    'webhooks', 'instant updates', 'push notifications', 'live feed',
    'streaming api', 'websocket api', 'real-time updates', 'live updates',
    
    // ADVANCED FEATURES - Technical capabilities
    'graphql api', 'rest api', 'sql access', 'sql interface', 'database access',
    'the graph', 'ponder', 'octoflow', 'indexing solutions', 'cloud services',
    'token vesting', 'vesting schedules', 'unlock events', 'vesting data',
    'advanced indexing', 'custom queries', 'flexible queries',
    
    // DEVELOPER EXPERIENCE - Tools and integration
    'sdk', 'libraries', 'code samples', 'documentation', 'tutorials',
    'api integration', 'developer tools', 'programming languages',
    'well-maintained', 'simple interfaces', 'integration process',
    'api dashboard', 'free tier', 'generous free tier', 'production ready',
    
    // COMMON API TERMS - What developers search for
    'json api', 'rest api', 'graphql', 'api call', 'api request', 'api response', 
    'api key', 'api keys', 'authentication', 'rate limit', 'rate limiting',
    'api documentation', 'api docs', 'api pricing', 'free api', 'paid api',
    'api endpoint', 'endpoints', 'data provider', 'data source', 'data feed',
    'blockchain data', 'crypto data', 'web3 data', 'defi data',
    
    // COMPETITOR ALTERNATIVES - Perfect opportunities
    'coingecko api', 'coinmarketcap api', 'moralis api', 'alchemy api',
    'coingecko', 'coinmarketcap', 'moralis', 'alchemy', 'infura',
    'alternative to', 'better than', 'replace', 'switch from', 'migrate from',
    'vs coingecko', 'vs moralis', 'vs alchemy', 'comparison',
    
    // PROBLEM/SOLUTION TERMS - Pain points Mobula solves
    'expensive api', 'costly api', 'rate limited', 'slow api', 'unreliable',
    'incomplete data', 'missing data', 'inaccurate prices', 'delayed data',
    'complex integration', 'difficult setup', 'poor documentation',
    'limited chains', 'single chain', 'no multi-chain', 'chain specific',
    'save money', 'cost effective', 'affordable', 'budget friendly',
    
    // USE CASES - What people build with APIs
    'trading bot', 'portfolio tracker', 'dapp', 'dashboard', 'analytics',
    'price tracking', 'wallet tracking', 'defi analytics', 'yield farming',
    'arbitrage', 'market making', 'automated trading', 'crypto app',
    'blockchain app', 'web3 app', 'crypto platform', 'defi platform'
  ];

  // CAPTURE ALL RELEVANT CONVERSATION TYPES - Expanded context words
  private readonly questionWords = [
    // Questions
    'how', 'what', 'which', 'where', 'who', 'why', 'when',
    // Help requests  
    'help', 'need', 'looking for', 'searching for', 'trying to find',
    // Recommendations
    'recommend', 'suggest', 'advice', 'opinion', 'thoughts',
    // Community queries
    'anyone', 'does anyone', 'has anyone', 'anybody',
    // Comparisons
    'best', 'better', 'compare', 'comparison', 'vs', 'versus',
    // Alternatives  
    'alternative', 'instead of', 'replace', 'switch', 'migrate',
    // Problems
    'issue', 'problem', 'trouble', 'struggling', 'difficulty',
    // Experience sharing
    'experience', 'tried', 'using', 'worked with', 'tested'
  ];
  
  private readonly buildingWords = [
    // Development
    'build', 'create', 'develop', 'make', 'implement', 'integrate',
    'code', 'coding', 'program', 'programming', 'script', 'scripting',
    // Projects
    'project', 'app', 'application', 'platform', 'website', 'site',
    'dapp', 'decentralized app', 'web3 app', 'crypto app',
    // Tools & Services
    'api', 'service', 'tool', 'solution', 'system', 'framework',
    'library', 'package', 'module', 'sdk', 'interface',
    // Specific builds
    'bot', 'trading bot', 'dashboard', 'tracker', 'portfolio tracker',
    'analytics', 'monitoring', 'alert', 'notification',
    // Data & feeds
    'data', 'feed', 'source', 'provider', 'endpoint', 'query',
    'database', 'storage', 'cache', 'index', 'search'
  ];

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

        // COMPREHENSIVE FILTERING: Capture all Mobula-relevant conversations
        const postText = `${post.title} ${post.selftext || ''}`.toLowerCase();
        
        // REQUIREMENT 1: Must match services from Mobula's documentation
        const docServiceMatches = this.mobulaDocServices.filter(phrase => 
          postText.includes(phrase.toLowerCase())
        );
        if (docServiceMatches.length === 0) continue;

        // REQUIREMENT 2: Must show engagement intent (questions OR building OR problems OR experience)
        const hasQuestionWord = this.questionWords.some(word => postText.includes(word));
        const hasBuildingContext = this.buildingWords.some(word => postText.includes(word));
        
        // More inclusive: Either asking questions OR building something OR discussing solutions
        if (!hasQuestionWord && !hasBuildingContext) {
          // Allow posts that discuss problems or share experiences even without explicit question words
          const hasRelevantDiscussion = ['discussion', 'sharing', 'feedback', 'review', 'comparison', 'analysis'].some(word => postText.includes(word));
          if (!hasRelevantDiscussion) continue;
        }
        
        // SIMPLIFIED SPAM FILTER: Reject obvious spam/memes/investment advice
        const rejectKeywords = [
          'buy', 'sell', 'hold', 'moon', 'pump', 'dump', 'hodl', 'to the moon',
          'check out my', 'follow me', 'dm me', 'telegram', 'discord',
          'airdrop', 'giveaway', 'promo code', 'referral',
          'meme coin', 'joke token', 'lol', 'haha', 'ser', 'anon'
        ];
        
        // Reject posts containing spam keywords
        if (rejectKeywords.some(reject => postText.includes(reject.toLowerCase()))) continue;
        
        // EXPANDED CRYPTO/BLOCKCHAIN CONTEXT - Include all relevant terms
        const cryptoKeywords = [
          // Core crypto terms
          'crypto', 'cryptocurrency', 'blockchain', 'bitcoin', 'ethereum', 'solana',
          'defi', 'web3', 'nft', 'token', 'coin', 'digital asset',
          // Platforms & protocols  
          'binance', 'coinbase', 'uniswap', 'compound', 'aave', 'makerdao',
          'polygon', 'arbitrum', 'optimism', 'avalanche', 'fantom', 'bsc',
          // Activities & tools
          'trading', 'swap', 'dex', 'cex', 'wallet', 'staking', 'yield',
          'liquidity', 'pool', 'farm', 'mining', 'validator', 'node',
          // Technical terms
          'smart contract', 'dapp', 'protocol', 'consensus', 'hash',
          'decentralized', 'distributed', 'peer-to-peer', 'trustless'
        ];
        
        const hasCryptoContext = cryptoKeywords.some(crypto => postText.includes(crypto.toLowerCase()));
        const isRelevantSubreddit = [
          'ethereum', 'ethdev', 'solana', 'web3', 'defi', 'cryptocurrency', 
          'bitcoin', 'cryptotechnology', 'cryptodevs', 'programming', 'webdev'
        ].includes(config.name.toLowerCase());
        
        // More inclusive: If we're in a crypto subreddit OR have crypto context, allow it
        // For programming subreddits, require explicit crypto context
        if (!isRelevantSubreddit && !hasCryptoContext) continue;
        if (['programming', 'webdev'].includes(config.name.toLowerCase()) && !hasCryptoContext) continue;
        
        // Use the Mobula documentation services that matched
        const allMatchedKeywords = docServiceMatches;

        // Calculate opportunity score
        const opportunityScore = this.calculateOpportunityScore(
          post,
          allMatchedKeywords,
          config
        );

        // Lower quality threshold to capture more conversations
        if (opportunityScore < 45) continue;

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

  // FOR TESTING: Clear seen posts cache
  clearSeenPostsCache(): void {
    this.seenPostIds.clear();
    this.lastScanTimestamp = null;
    this.logger.log('🔄 Cleared seen posts cache for testing purposes');
  }


  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}