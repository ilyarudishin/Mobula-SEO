import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '../config/config.service';
import { RedditResponseGeneratorService } from './reddit-response-generator.service';
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
  private redditAccessToken: string | null = null;
  private tokenExpires: Date | null = null;
  
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
    },
    {
      name: 'solidity',
      keywords: ['api', 'data', 'price', 'market', 'wallet', 'token', 'contract', 'blockchain', 'ethereum', 'web3', 'dapp', 'oracle', 'metadata'],
      maxPostsPerScan: 30,
      minScore: 1,
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
    private redditResponseGenerator: RedditResponseGeneratorService,
  ) {
    this.logger.log('Reddit Discovery Service initialized - using official Reddit API');
    // Authenticate when first needed, not during initialization
    // this.authenticateWithReddit();
  }

  async discoverOpportunities(): Promise<RedditOpportunity[]> {
    this.logger.log('🔍 Scanning Reddit for API/blockchain opportunities via Reddit API...');
    
    const allOpportunities: RedditOpportunity[] = [];

    // Phase 1: Scan specific subreddits (existing approach)
    this.logger.log('Phase 1: Scanning targeted subreddits...');
    for (const subredditConfig of this.subredditConfigs) {
      try {
        const opportunities = await this.scrapeSubreddit(subredditConfig);
        allOpportunities.push(...opportunities);
        
        // Rate limiting to be respectful
        await this.sleep(2000);
      } catch (error) {
        this.logger.error(`Failed to scrape r/${subredditConfig.name}: ${error.message}`);
        // Add exponential backoff for failed requests
        await this.sleep(5000 + Math.random() * 5000);
      }
    }

    // Phase 2: Reddit-wide keyword search for missed opportunities
    this.logger.log('Phase 2: Searching Reddit-wide for keyword opportunities...');
    try {
      const keywordOpportunities = await this.searchRedditWide();
      allOpportunities.push(...keywordOpportunities);
    } catch (error) {
      this.logger.error(`Failed Reddit-wide search: ${error.message}`);
    }

    // Sort by opportunity score and return top opportunities
    const sortedOpportunities = allOpportunities
      .sort((a, b) => b.opportunityScore - a.opportunityScore)
      .slice(0, 30); // Increased limit due to wider search

    this.logger.log(`Found ${sortedOpportunities.length} total Reddit opportunities for manual engagement`);
    
    return sortedOpportunities;
  }

  async discoverOpportunitiesHistorical(months: number = 6): Promise<RedditOpportunity[]> {
    this.logger.log(`🔍 Historical Reddit scan for last ${months} months...`);

    const allOpportunities: RedditOpportunity[] = [];

    for (const subredditConfig of this.subredditConfigs) {
      try {
        const opportunities = await this.scrapeSubredditHistorical(subredditConfig, months);
        allOpportunities.push(...opportunities);
        
        // Rate limiting to be respectful
        await this.sleep(2000);
      } catch (error) {
        this.logger.error(`Failed to scrape r/${subredditConfig.name}: ${error.message}`);
        // Add exponential backoff for failed requests
        await this.sleep(5000 + Math.random() * 5000);
      }
    }

    // Sort by opportunity score and return top opportunities
    const sortedOpportunities = allOpportunities
      .sort((a, b) => b.opportunityScore - a.opportunityScore)
      .slice(0, 50); // More results for historical scan

    this.logger.log(`Found ${sortedOpportunities.length} total historical Reddit opportunities (${months} months)`);
    
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

  async searchRedditWide(): Promise<RedditOpportunity[]> {
    this.logger.log('🌍 Starting Reddit-wide keyword search...');
    
    const allOpportunities: RedditOpportunity[] = [];
    
    // High-value search terms that indicate API/data needs
    const searchKeywords = [
      'crypto api', 'blockchain api', 'web3 api', 'token api', 'price api',
      'market data api', 'wallet api', 'portfolio api', 'defi api',
      'coingecko alternative', 'moralis alternative', 'alchemy alternative',
      'need crypto data', 'need price data', 'need market data',
      'crypto data source', 'blockchain data provider', 'web3 data',
      'real time crypto', 'crypto websocket', 'price feed api',
      'multi chain api', 'cross chain data'
    ];

    for (const keyword of searchKeywords.slice(0, 8)) { // Limit to prevent rate limiting
      try {
        this.logger.log(`Searching Reddit for: "${keyword}"`);
        
        // Use Reddit's search RSS endpoint for site-wide search
        const searchUrl = `https://www.reddit.com/search.rss?q=${encodeURIComponent(keyword)}&sort=new&t=week&limit=25`;
        
        const response = await axios.get(searchUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/rss+xml, application/xml, text/xml'
          },
          timeout: 30000
        });
        
        // Parse the search results
        const searchResults = this.parseRedditSearchRSS(response.data, keyword);
        
        // Process each result
        for (const postData of searchResults.data.children) {
          const post = postData.data;
          await this.processRedditWidePost(post, keyword, allOpportunities);
        }
        
        // Rate limiting between searches
        await this.sleep(3000);
        
      } catch (error) {
        this.logger.error(`Failed to search Reddit for "${keyword}": ${error.message}`);
        await this.sleep(5000); // Longer delay on error
      }
    }

    this.logger.log(`Reddit-wide search completed. Found ${allOpportunities.length} additional opportunities.`);
    return allOpportunities;
  }

  private async scrapeSubreddit(config: SubredditConfig): Promise<RedditOpportunity[]> {
    const opportunities: RedditOpportunity[] = [];

    try {
      // Use RSS feeds directly - more reliable than API
      const rssUrl = `https://www.reddit.com/r/${config.name}/new.rss?limit=${config.maxPostsPerScan}`;
      this.logger.log(`Fetching RSS for r/${config.name}: ${rssUrl}`);
      
      const response = await axios.get(rssUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/rss+xml, application/xml, text/xml'
        },
        timeout: 30000
      });
      
      // Convert RSS XML to Reddit-like JSON format
      response.data = this.parseRedditRSS(response.data, config.name);
      this.logger.log(`Parsed ${response.data.data.children.length} posts from r/${config.name} RSS`);

      const posts = response.data.data.children;
      
      for (const postData of posts) {
        const post = postData.data;
        await this.processPost(post, config, opportunities);
      }
        
    } catch (error) {
      this.logger.error(`Error scraping r/${config.name}: ${error.message}`);
      // Don't throw - continue with next subreddit
    }

    return opportunities;
  }

  private async scrapeSubredditHistorical(config: SubredditConfig, months: number): Promise<RedditOpportunity[]> {
    const opportunities: RedditOpportunity[] = [];

    try {
      // Use search API for historical data with broader terms
      const searchTerms = ['api', 'price api', 'wallet api', 'data api', 'crypto api', 'blockchain api'];
      
      for (const searchTerm of searchTerms.slice(0, 3)) { // Use more search terms for historical
        const url = `https://www.reddit.com/r/${config.name}/search.json?q=${encodeURIComponent(searchTerm)}&restrict_sr=1&sort=new&limit=50&t=year`;
        
        // Use RSS for historical data too
        const rssUrl = `https://www.reddit.com/r/${config.name}/search.rss?q=${encodeURIComponent(searchTerm)}&restrict_sr=1&sort=new&limit=50&t=year`;
        const response = await axios.get(rssUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/rss+xml, application/xml, text/xml'
          },
          timeout: 30000
        });
        
        response.data = this.parseRedditRSS(response.data, config.name);

        const posts = response.data.data.children;
        
        for (const postData of posts) {
          const post = postData.data;
          await this.processPostHistorical(post, config, opportunities, months);
        }
        
        // Rate limiting between searches
        await this.sleep(3000);
      }
    } catch (error) {
      this.logger.error(`Error scraping r/${config.name} (historical): ${error.message}`);
    }

    return opportunities;
  }

  private async processPost(post: any, config: SubredditConfig, opportunities: RedditOpportunity[]): Promise<void> {
    // Skip if we've already seen this post
    if (this.seenPostIds.has(post.id)) return;
    
    // Skip if post score is too low
    if (post.score < config.minScore) return;

    // CRITICAL: Filter out posts older than 48 hours (only fresh opportunities)
    const postAge = Date.now() - (post.created_utc * 1000);
    const twoDaysInMs = 2 * 24 * 60 * 60 * 1000;
    if (postAge > twoDaysInMs) {
      return; // Skip posts older than 48 hours
    }

    const postText = `${post.title} ${post.selftext || ''}`.toLowerCase();
    
    // STRICT FILTERING: Must be asking for API recommendations OR discussing Mobula-relevant topics
    const apiRequestPatterns = [
      'best api', 'good api', 'api recommendation', 'which api', 'what api',
      'recommend api', 'suggest api', 'need api', 'looking for api',
      'api for', 'free api', 'cheap api', 'data api', 'pricing api', 'crypto api',
      'portfolio api', 'wallet api', 'blockchain api', 'web3 api', 'market data'
    ];
    
    const hasApiRequest = apiRequestPatterns.some(pattern => postText.includes(pattern));
    
    // ALSO capture general discussions about our services even without explicit API requests
    const mobulaServiceDiscussion = [
      'price data', 'market data', 'crypto prices', 'token prices', 'portfolio tracking',
      'wallet tracking', 'multi-chain', 'cross-chain', 'real-time data', 'websocket',
      'coingecko alternative', 'moralis alternative', 'alchemy alternative'
    ];
    
    const hasServiceDiscussion = mobulaServiceDiscussion.some(service => postText.includes(service));
    
    if (!hasApiRequest && !hasServiceDiscussion) return;
    
    // Must be asking a question OR discussing relevant topics
    const isQuestion = postText.includes('?') || 
                      postText.includes('recommend') ||
                      postText.includes('suggest') ||
                      postText.includes('which ') ||
                      postText.includes('what ') ||
                      postText.includes('how ') ||
                      postText.includes('need ') ||
                      postText.includes('looking for') ||
                      postText.includes('trying to') ||
                      postText.includes('help') ||
                      postText.includes('advice');
    
    // ALSO capture discussions about competitors (valuable for positioning)
    const competitorMention = [
      'coingecko', 'coinmarketcap', 'moralis', 'alchemy', 'infura', 'quicknode'
    ].some(comp => postText.includes(comp));
    
    if (!isQuestion && !competitorMention) return;
    
    // MUST be crypto/blockchain related first
    const cryptoTerms = [
      'crypto', 'cryptocurrency', 'bitcoin', 'ethereum', 'solana', 'blockchain',
      'token', 'coin', 'defi', 'web3', 'nft', 'dapp', 'smart contract',
      'metamask', 'phantom', 'wallet connect', 'uniswap', 'pancakeswap',
      'binance', 'coinbase', 'kraken', 'polygon', 'arbitrum', 'avalanche',
      'bsc', 'bnb chain', 'base', 'optimism', 'fantom', 'matic'
    ];
    
    const isCryptoRelated = cryptoTerms.some(term => postText.includes(term));
    if (!isCryptoRelated) return;

    // Must match Mobula's services - USE COMPREHENSIVE DOC-BASED LIST
    const matchesMobula = this.mobulaDocServices.some(service => postText.includes(service));
    if (!matchesMobula) return;
    
    // Reject non-API requests and non-crypto terms
    const rejectTerms = [
      'bot', 'trading bot', 'payment', 'guide', 'tutorial',
      'whatsapp', 'telegram', 'discord', 'social media', 'email',
      'sms', 'notification', 'weather', 'news', 'sports'
    ];
    const shouldReject = rejectTerms.some(term => postText.includes(term));
    if (shouldReject) return;

    // Generate keywords and response using FULL Mobula doc services
    const matchedKeywords = this.mobulaDocServices.filter(service => postText.includes(service));
    
    const opportunityScore = this.calculateOpportunityScore(post, matchedKeywords, config);
    // LOWERED THRESHOLD: Capture more opportunities to ensure we don't miss any relevant discussions
    if (opportunityScore < 35) return;

    const engagementSuggestion = await this.generateEngagementSuggestion(post, matchedKeywords);

    // Add to seen posts
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
      keywords: matchedKeywords,
      timestamp: new Date(post.created_utc * 1000),
    });
  }

  private async processPostHistorical(post: any, config: SubredditConfig, opportunities: RedditOpportunity[], months: number): Promise<void> {
    // Skip if we've already seen this post
    if (this.seenPostIds.has(post.id)) return;
    
    // Skip if post score is too low
    if (post.score < config.minScore) return;

    // Check post age - only posts from specified months period
    const postAge = Date.now() - (post.created_utc * 1000);
    const monthsInMs = months * 30 * 24 * 60 * 60 * 1000;
    if (postAge > monthsInMs) {
      return; // Skip posts older than specified months
    }

    const postText = `${post.title} ${post.selftext || ''}`.toLowerCase();
    
    // COMPREHENSIVE FILTERING: Must be asking for API/data recommendations (expanded to catch more)
    const apiRequestPatterns = [
      'best api', 'good api', 'api recommendation', 'which api', 'what api',
      'recommend api', 'suggest api', 'need api', 'looking for api',
      'api for', 'free api', 'cheap api'
    ];
    
    const hasApiRequest = apiRequestPatterns.some(pattern => postText.includes(pattern));
    if (!hasApiRequest) return;
    
    // Must be asking a question
    const isQuestion = postText.includes('?') || 
                      postText.includes('recommend') ||
                      postText.includes('suggest') ||
                      postText.includes('which ') ||
                      postText.includes('what ');
    if (!isQuestion) return;
    
    // MUST be crypto/blockchain related first
    const cryptoTerms = [
      'crypto', 'cryptocurrency', 'bitcoin', 'ethereum', 'solana', 'blockchain',
      'token', 'coin', 'defi', 'web3', 'nft', 'dapp', 'smart contract',
      'metamask', 'phantom', 'wallet connect', 'uniswap', 'pancakeswap',
      'binance', 'coinbase', 'kraken', 'polygon', 'arbitrum', 'avalanche',
      'bsc', 'bnb chain', 'base', 'optimism', 'fantom', 'matic'
    ];
    
    const isCryptoRelated = cryptoTerms.some(term => postText.includes(term));
    if (!isCryptoRelated) return;

    // Must match Mobula's services - USE COMPREHENSIVE DOC-BASED LIST
    const matchesMobula = this.mobulaDocServices.some(service => postText.includes(service));
    if (!matchesMobula) return;
    
    // Reject non-API requests and non-crypto terms
    const rejectTerms = [
      'bot', 'trading bot', 'payment', 'guide', 'tutorial',
      'whatsapp', 'telegram', 'discord', 'social media', 'email',
      'sms', 'notification', 'weather', 'news', 'sports'
    ];
    const shouldReject = rejectTerms.some(term => postText.includes(term));
    if (shouldReject) return;

    // Generate keywords and response using FULL Mobula doc services
    const matchedKeywords = this.mobulaDocServices.filter(service => postText.includes(service));
    
    const opportunityScore = this.calculateOpportunityScore(post, matchedKeywords, config);
    if (opportunityScore < 40) return; // Slightly lower threshold for historical

    const engagementSuggestion = await this.generateEngagementSuggestion(post, matchedKeywords);

    // Add to seen posts
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
      keywords: matchedKeywords,
      timestamp: new Date(post.created_utc * 1000),
    });
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
    try {
      const context = {
        postTitle: post.title,
        postContent: post.selftext || '',
        subreddit: post.subreddit,
        author: post.author,
        url: `https://reddit.com/r/${post.subreddit}/comments/${post.id}`,
        keywords: keywords,
      };

      const response = await this.redditResponseGenerator.generateResponse(context);
      return response.response;
    } catch (error) {
      this.logger.error(`Failed to generate casual Reddit response: ${error.message}`);
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

  private async authenticateWithReddit(): Promise<void> {
    try {
      const clientId = this.configService.config.reddit.clientId;
      const clientSecret = this.configService.config.reddit.clientSecret;
      const userAgent = this.configService.config.reddit.userAgent;
      
      if (!clientId || !clientSecret) {
        this.logger.error('Reddit API credentials not configured - check .env file');
        this.logger.error(`Client ID: ${clientId ? 'configured' : 'missing'}`);
        this.logger.error(`Client Secret: ${clientSecret ? 'configured' : 'missing'}`);
        throw new Error('Reddit API credentials not configured');
      }

      const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
      
      this.logger.log(`Authenticating with Reddit API using client ID: ${clientId.substring(0, 8)}...`);
      
      const response = await axios.post('https://www.reddit.com/api/v1/access_token', 
        'grant_type=client_credentials',
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'User-Agent': userAgent,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          timeout: 10000
        }
      );

      this.redditAccessToken = response.data.access_token;
      this.tokenExpires = new Date(Date.now() + (response.data.expires_in * 1000));
      
      this.logger.log('✅ Successfully authenticated with Reddit API');
    } catch (error) {
      this.logger.error('Failed to authenticate with Reddit API:', error.message);
      this.logger.error('Will retry authentication on next scan');
      // Don't throw - allow service to continue running
    }
  }

  private async ensureAuthenticated(): Promise<void> {
    if (!this.redditAccessToken || !this.tokenExpires || new Date() >= this.tokenExpires) {
      await this.authenticateWithReddit();
    }
  }

  private parseRedditSearchRSS(rssData: string, searchTerm: string): any {
    try {
      // Reddit search also uses Atom format - look for <entry> tags
      const items: any[] = [];
      const itemMatches = rssData.match(/<entry[\s\S]*?<\/entry>/g) || [];
      
      this.logger.log(`Found ${itemMatches.length} search results for "${searchTerm}"`);
      
      for (const entry of itemMatches) {
        const titleMatch = entry.match(/<title>(.*?)<\/title>/);
        const linkMatch = entry.match(/<link href="(.*?)"/);
        const contentMatch = entry.match(/<content type="html">(.*?)<\/content>/s);
        const publishedMatch = entry.match(/<published>(.*?)<\/published>/);
        const authorMatch = entry.match(/<author><name>\/u\/(.*?)<\/name>/);
        
        if (titleMatch && linkMatch) {
          // Extract subreddit and post ID from the URL
          const urlMatch = linkMatch[1].match(/\/r\/([^\/]+)\/comments\/([^\/]+)\//);
          const subreddit = urlMatch?.[1] || 'unknown';
          const postId = urlMatch?.[2] || Math.random().toString(36);
          
          const title = titleMatch[1];
          const content = contentMatch?.[1] || '';
          const publishedDate = publishedMatch?.[1];
          const author = authorMatch?.[1] || 'unknown';
          
          // Extract score from content if available
          const scoreMatch = content.match(/(\d+) points?/);
          const score = scoreMatch ? parseInt(scoreMatch[1]) : 1;
          
          // Extract comment count from content
          const commentMatch = content.match(/(\d+) comments?/);
          const commentCount = commentMatch ? parseInt(commentMatch[1]) : 0;
          
          // Clean HTML from content for selftext
          const cleanContent = content.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ');
          
          items.push({
            data: {
              id: postId,
              title: title,
              selftext: cleanContent,
              author: author,
              score: score,
              num_comments: commentCount,
              created_utc: publishedDate ? new Date(publishedDate).getTime() / 1000 : Date.now() / 1000,
              subreddit: subreddit,
              permalink: linkMatch[1]
            }
          });
        }
      }
      
      return {
        data: {
          children: items
        }
      };
    } catch (error) {
      this.logger.error(`Failed to parse search RSS for "${searchTerm}": ${error.message}`);
      return { data: { children: [] } };
    }
  }

  private async processRedditWidePost(post: any, searchKeyword: string, opportunities: RedditOpportunity[]): Promise<void> {
    // Skip if we've already seen this post
    if (this.seenPostIds.has(post.id)) return;
    
    // Skip low-engagement posts (higher threshold for Reddit-wide search)
    if (post.score < 2) return;

    // Only fresh posts (last 7 days for keyword search)
    const postAge = Date.now() - (post.created_utc * 1000);
    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
    if (postAge > sevenDaysInMs) return;

    const postText = `${post.title} ${post.selftext || ''}`.toLowerCase();
    
    // Must be asking for help/recommendations
    const helpPatterns = [
      'help', 'need', 'looking for', 'recommend', 'suggest', 'advice',
      'which api', 'what api', 'best api', 'good api', 'api for',
      'how to', 'where to find', 'anyone know'
    ];
    
    const isHelpRequest = helpPatterns.some(pattern => postText.includes(pattern));
    if (!isHelpRequest) return;
    
    // Must be a question
    const isQuestion = postText.includes('?') || isHelpRequest;
    if (!isQuestion) return;
    
    // Must be crypto/blockchain related (stronger filter for site-wide)
    const cryptoTerms = [
      'crypto', 'cryptocurrency', 'bitcoin', 'ethereum', 'solana', 'blockchain',
      'token', 'coin', 'defi', 'web3', 'nft', 'dapp', 'smart contract'
    ];
    
    const isCryptoRelated = cryptoTerms.some(term => postText.includes(term));
    if (!isCryptoRelated) return;

    // Must match Mobula services
    const matchesMobula = this.mobulaDocServices.some(service => postText.includes(service));
    if (!matchesMobula) return;
    
    // Generate keywords and response
    const matchedKeywords = this.mobulaDocServices.filter(service => postText.includes(service));
    matchedKeywords.push(searchKeyword); // Add the search keyword that found this post
    
    const opportunityScore = this.calculateOpportunityScoreForSearch(post, matchedKeywords);
    if (opportunityScore < 45) return; // Higher threshold for Reddit-wide search

    const engagementSuggestion = await this.generateEngagementSuggestion(post, matchedKeywords);

    // Add to seen posts
    this.seenPostIds.add(post.id);

    opportunities.push({
      postId: post.id,
      postTitle: post.title,
      postUrl: `https://reddit.com${post.permalink}`,
      subreddit: post.subreddit,
      author: post.author,
      content: post.selftext || '',
      score: post.score,
      commentCount: post.num_comments,
      opportunityScore,
      suggestedResponse: engagementSuggestion,
      keywords: matchedKeywords,
      timestamp: new Date(post.created_utc * 1000),
    });
  }

  private calculateOpportunityScoreForSearch(post: any, keywords: string[]): number {
    let score = 0;

    // Base score from post engagement (slightly higher weights for search results)
    score += Math.min(35, post.score * 0.7); // Max 35 points from upvotes
    score += Math.min(25, post.num_comments * 2.5); // Max 25 points from comments

    // Keyword relevance bonus
    score += keywords.length * 8; // 8 points per relevant keyword

    // Quality indicators for search results
    const postText = `${post.title} ${post.selftext}`.toLowerCase();
    
    // API-specific request indicators
    const apiRequestWords = ['api', 'data', 'feed', 'service', 'provider', 'source', 'endpoint'];
    const apiMatches = apiRequestWords.filter(word => postText.includes(word)).length;
    score += apiMatches * 12;
    
    // Technical implementation words
    const techWords = ['integrate', 'build', 'develop', 'implement', 'code', 'sdk'];
    const techMatches = techWords.filter(word => postText.includes(word)).length;
    score += techMatches * 8;
    
    // Competitor mention bonus (great positioning opportunity)
    const competitors = ['coingecko', 'coinmarketcap', 'moralis', 'alchemy'];
    const competitorMentions = competitors.filter(comp => postText.includes(comp)).length;
    score += competitorMentions * 15;

    // Recency bonus (newer posts are better)
    const hoursSincePost = (Date.now() - post.created_utc * 1000) / (1000 * 60 * 60);
    if (hoursSincePost < 12) score += 15;
    else if (hoursSincePost < 48) score += 8;

    return Math.min(100, Math.round(score));
  }

  private parseRedditRSS(rssData: string, subreddit: string): any {
    try {
      // Reddit uses Atom format, not RSS - look for <entry> tags
      const items: any[] = [];
      const itemMatches = rssData.match(/<entry[\s\S]*?<\/entry>/g) || [];
      
      this.logger.log(`Found ${itemMatches.length} entries in Atom feed for r/${subreddit}`);
      
      for (const entry of itemMatches) {
        const titleMatch = entry.match(/<title>(.*?)<\/title>/);
        const linkMatch = entry.match(/<link href="(.*?)"/);
        const contentMatch = entry.match(/<content type="html">(.*?)<\/content>/s);
        const publishedMatch = entry.match(/<published>(.*?)<\/published>/);
        const authorMatch = entry.match(/<author><name>\/u\/(.*?)<\/name>/);
        
        if (titleMatch && linkMatch) {
          const postId = linkMatch[1].match(/\/comments\/(\w+)\//)?.[1] || Math.random().toString(36);
          const title = titleMatch[1];
          const content = contentMatch?.[1] || '';
          const publishedDate = publishedMatch?.[1];
          const author = authorMatch?.[1] || 'unknown';
          
          // Extract score from content if available (it's in the HTML)
          const scoreMatch = content.match(/(\d+) points?/);
          const score = scoreMatch ? parseInt(scoreMatch[1]) : 1;
          
          // Extract comment count from content
          const commentMatch = content.match(/(\d+) comments?/);
          const commentCount = commentMatch ? parseInt(commentMatch[1]) : 0;
          
          // Clean HTML from content for selftext
          const cleanContent = content.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ');
          
          items.push({
            data: {
              id: postId,
              title: title,
              selftext: cleanContent,
              author: author,
              score: score,
              num_comments: commentCount,
              created_utc: publishedDate ? new Date(publishedDate).getTime() / 1000 : Date.now() / 1000,
              subreddit: subreddit,
              permalink: linkMatch[1]
            }
          });
        }
      }
      
      return {
        data: {
          children: items
        }
      };
    } catch (error) {
      this.logger.error(`Failed to parse RSS for r/${subreddit}: ${error.message}`);
      return { data: { children: [] } };
    }
  }
}