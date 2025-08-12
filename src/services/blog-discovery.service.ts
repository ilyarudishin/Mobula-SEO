import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '../config/config.service';
import { ClaudeService } from './claude.service';

export interface BlogOpportunity {
  id: string;
  url: string;
  domain: string;
  title: string;
  type: 'broken_link' | 'guest_post' | 'mention' | 'resource_page';
  opportunityScore: number;
  description: string;
  suggestedPitch: string;
  contactInfo: {
    email?: string;
    contactPage?: string;
    authorName?: string;
  };
  relevanceKeywords: string[];
  contentGap: string;
  timestamp: Date;
}

export interface BlogTarget {
  domain: string;
  searchQueries: string[];
  minDA: number; // Domain Authority
  contentTypes: string[];
}

@Injectable()
export class BlogDiscoveryService {
  private readonly logger = new Logger(BlogDiscoveryService.name);
  
  // Target blog categories for blockchain/API outreach
  private readonly blogTargets: BlogTarget[] = [
    {
      domain: 'dev.to',
      searchQueries: ['blockchain API broken link', 'crypto API guide outdated'],
      minDA: 90,
      contentTypes: ['technical_guide', 'tutorial'],
    },
    {
      domain: 'medium.com',
      searchQueries: ['web3 API best practices', 'DeFi development resources'],
      minDA: 95,
      contentTypes: ['blog_article', 'technical_guide'],
    },
    {
      domain: 'hackernoon.com',
      searchQueries: ['blockchain infrastructure guide', 'crypto data API tutorial'],
      minDA: 85,
      contentTypes: ['blog_article', 'technical_guide'],
    },
    {
      domain: 'hashnode.com',
      searchQueries: ['web3 development blog', 'blockchain API tutorial'],
      minDA: 75,
      contentTypes: ['technical_guide', 'tutorial'],
    }
  ];

  // Keywords that indicate good outreach opportunities
  private readonly opportunityKeywords = [
    'broken link', '404 error', 'link not working', 'outdated',
    'dead link', 'resource page', 'best tools', 'recommended APIs',
    'guest post', 'write for us', 'contribute', 'submissions',
    'looking for writers', 'content partnership'
  ];

  // Mobula-relevant keywords for targeting
  private readonly relevanceKeywords = [
    'blockchain API', 'crypto API', 'DeFi API', 'web3 data',
    'blockchain data', 'crypto market data', 'trading API',
    'NFT API', 'DEX data', 'crypto analytics', 'blockchain infrastructure'
  ];

  constructor(
    private configService: ConfigService,
    private claudeService: ClaudeService,
  ) {}

  async discoverOpportunities(): Promise<BlogOpportunity[]> {
    this.logger.log('🔍 Scanning for blog outreach opportunities...');
    
    const allOpportunities: BlogOpportunity[] = [];

    // 1. Find broken link opportunities
    const brokenLinkOpps = await this.findBrokenLinkOpportunities();
    allOpportunities.push(...brokenLinkOpps);

    // 2. Find guest posting opportunities
    const guestPostOpps = await this.findGuestPostOpportunities();
    allOpportunities.push(...guestPostOpps);

    // 3. Find resource page opportunities
    const resourcePageOpps = await this.findResourcePageOpportunities();
    allOpportunities.push(...resourcePageOpps);

    // Sort by opportunity score and return top opportunities
    const sortedOpportunities = allOpportunities
      .sort((a, b) => b.opportunityScore - a.opportunityScore)
      .slice(0, 15);

    this.logger.log(`Found ${sortedOpportunities.length} blog opportunities with scores > 70`);
    
    return sortedOpportunities;
  }

  private async findBrokenLinkOpportunities(): Promise<BlogOpportunity[]> {
    this.logger.log('🔗 Searching for broken link opportunities...');
    
    // Simulate broken link discovery - in real implementation, would use:
    // - Ahrefs API for broken backlinks
    // - SEMrush API for competitor broken links  
    // - Custom scraping with dead link checker
    
    const opportunities: BlogOpportunity[] = [];
    
    // Mock broken link opportunities for development
    const mockBrokenLinks = [
      {
        url: 'https://dev.to/author123/building-defi-apps-with-apis-2023',
        domain: 'dev.to',
        title: 'Building DeFi Apps with APIs - Complete Guide 2023',
        brokenLinkText: 'Best crypto data API providers',
        brokenUrl: 'https://old-crypto-api.com/docs',
        authorContact: 'author123@dev.to',
      },
      {
        url: 'https://medium.com/@blockchaindev/web3-development-resources',
        domain: 'medium.com',
        title: 'Essential Web3 Development Resources Every Developer Needs',
        brokenLinkText: 'reliable blockchain data API',
        brokenUrl: 'https://defunct-blockchain-service.com',
        authorContact: 'blockchaindev@example.com',
      }
    ];

    for (const brokenLink of mockBrokenLinks) {
      const suggestedPitch = await this.generateBrokenLinkPitch(brokenLink);
      
      opportunities.push({
        id: `broken_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        url: brokenLink.url,
        domain: brokenLink.domain,
        title: brokenLink.title,
        type: 'broken_link',
        opportunityScore: this.calculateOpportunityScore('broken_link', brokenLink.domain),
        description: `Broken link to "${brokenLink.brokenLinkText}" - opportunity to suggest Mobula API as replacement`,
        suggestedPitch,
        contactInfo: {
          email: brokenLink.authorContact,
          authorName: brokenLink.url.split('/')[3], // Extract username
        },
        relevanceKeywords: this.relevanceKeywords.filter(keyword => 
          brokenLink.title.toLowerCase().includes(keyword.split(' ')[0].toLowerCase())
        ).slice(0, 3),
        contentGap: `Broken link to ${brokenLink.brokenUrl} needs replacement`,
        timestamp: new Date(),
      });
    }

    return opportunities;
  }

  private async findGuestPostOpportunities(): Promise<BlogOpportunity[]> {
    this.logger.log('✍️ Searching for guest post opportunities...');
    
    // Mock guest post opportunities - in real implementation would search for:
    // - "write for us" + blockchain/crypto keywords
    // - Guest post submission pages
    // - Author bylines on target blogs
    
    const opportunities: BlogOpportunity[] = [];
    
    const mockGuestPosts = [
      {
        url: 'https://hackernoon.com/write-for-us',
        domain: 'hackernoon.com',
        title: 'Write for HackerNoon - Web3 & Blockchain Content',
        guidelines: 'Looking for technical blockchain content, API tutorials, DeFi guides',
        contactEmail: 'submissions@hackernoon.com',
      },
      {
        url: 'https://hashnode.com/write-for-us',
        domain: 'hashnode.com', 
        title: 'Hashnode Technical Writing Program',
        guidelines: 'Developer-focused content, blockchain tutorials, API guides welcome',
        contactEmail: 'writers@hashnode.com',
      }
    ];

    for (const guestPost of mockGuestPosts) {
      const suggestedPitch = await this.generateGuestPostPitch(guestPost);
      
      opportunities.push({
        id: `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        url: guestPost.url,
        domain: guestPost.domain,
        title: guestPost.title,
        type: 'guest_post',
        opportunityScore: this.calculateOpportunityScore('guest_post', guestPost.domain),
        description: `Guest posting opportunity: ${guestPost.guidelines}`,
        suggestedPitch,
        contactInfo: {
          email: guestPost.contactEmail,
          contactPage: guestPost.url,
        },
        relevanceKeywords: ['blockchain API', 'web3', 'DeFi'],
        contentGap: 'Need comprehensive blockchain API content for developers',
        timestamp: new Date(),
      });
    }

    return opportunities;
  }

  private async findResourcePageOpportunities(): Promise<BlogOpportunity[]> {
    this.logger.log('📋 Searching for resource page opportunities...');
    
    // Mock resource page opportunities
    const opportunities: BlogOpportunity[] = [];
    
    const mockResourcePages = [
      {
        url: 'https://awesome-blockchain.github.io/awesome-blockchain/',
        domain: 'github.io',
        title: 'Awesome Blockchain - Curated List of Resources',
        description: 'Comprehensive list of blockchain tools, APIs, and resources',
        maintainer: 'awesome-blockchain',
      }
    ];

    for (const resourcePage of mockResourcePages) {
      const suggestedPitch = await this.generateResourcePagePitch(resourcePage);
      
      opportunities.push({
        id: `resource_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        url: resourcePage.url,
        domain: resourcePage.domain,
        title: resourcePage.title,
        type: 'resource_page',
        opportunityScore: this.calculateOpportunityScore('resource_page', resourcePage.domain),
        description: resourcePage.description,
        suggestedPitch,
        contactInfo: {
          authorName: resourcePage.maintainer,
        },
        relevanceKeywords: ['blockchain API', 'resources', 'tools'],
        contentGap: 'Missing comprehensive blockchain data API in resource list',
        timestamp: new Date(),
      });
    }

    return opportunities;
  }

  private calculateOpportunityScore(type: BlogOpportunity['type'], domain: string): number {
    let score = 0;

    // Base score by opportunity type
    const typeScores = {
      broken_link: 85, // High conversion rate
      guest_post: 75,  // Good for authority building
      mention: 60,     // Lower effort, medium impact
      resource_page: 80 // High value, long-term benefit
    };
    score += typeScores[type];

    // Domain authority bonus
    const domainScores: { [key: string]: number } = {
      'dev.to': 15,
      'medium.com': 20,
      'hackernoon.com': 18,
      'hashnode.com': 12,
      'github.io': 10,
    };
    score += domainScores[domain] || 5;

    // Relevance bonus (if keywords match)
    score += 10; // Assume relevant since we're targeting these domains

    return Math.min(100, score);
  }

  private async generateBrokenLinkPitch(brokenLink: any): Promise<string> {
    const prompt = `Generate a professional, helpful email for broken link outreach:

TARGET ARTICLE: "${brokenLink.title}"
BROKEN LINK: "${brokenLink.brokenUrl}" 
ARTICLE URL: "${brokenLink.url}"

Generate a brief, value-first email that:
1. Mentions you found their helpful article
2. Points out the broken link (helpfully, not critically)
3. Suggests Mobula API as a relevant replacement
4. Provides genuine value without being pushy
5. Keeps it under 150 words

EMAIL:`;

    try {
      const response = await this.claudeService.generateContent({
        type: 'outreach_email',
        topic: 'broken link replacement',
        keywords: ['blockchain API', 'helpful'],
        targetAudience: 'content creators',
        additionalContext: prompt,
      });

      return response.content;
    } catch (error) {
      this.logger.error(`Failed to generate broken link pitch: ${error.message}`);
      return `Hi! I found your helpful article "${brokenLink.title}" and noticed a broken link to ${brokenLink.brokenUrl}. As a fellow developer, I thought you might find Mobula's blockchain API useful as a replacement - it offers comprehensive crypto data with excellent documentation. Hope this helps keep your great content up to date!`;
    }
  }

  private async generateGuestPostPitch(guestPost: any): Promise<string> {
    const prompt = `Generate a professional guest post pitch email:

TARGET PUBLICATION: "${guestPost.domain}"
SUBMISSION GUIDELINES: "${guestPost.guidelines}"

Generate a concise pitch that:
1. Shows you understand their content needs
2. Proposes 2-3 specific article ideas about blockchain APIs
3. Demonstrates technical expertise
4. Mentions Mobula naturally (not promotional)
5. Keeps it professional and under 200 words

PITCH:`;

    try {
      const response = await this.claudeService.generateContent({
        type: 'outreach_email', 
        topic: 'guest post pitch',
        keywords: ['blockchain API', 'technical content'],
        targetAudience: 'editors',
        additionalContext: prompt,
      });

      return response.content;
    } catch (error) {
      this.logger.error(`Failed to generate guest post pitch: ${error.message}`);
      return `Hi! I'm a blockchain developer with experience building on various APIs. I'd love to contribute technical content to ${guestPost.domain}. Proposed topics: 1) "Building Production DeFi Apps: API Architecture Patterns" 2) "Blockchain Data Integration: Real-World Challenges & Solutions" 3) "Comparing Web3 Data Providers: A Technical Deep-Dive". I can provide code examples and practical insights from working with platforms like Mobula. Would any of these topics interest your readers?`;
    }
  }

  private async generateResourcePagePitch(resourcePage: any): Promise<string> {
    const prompt = `Generate a brief, value-focused message for resource page inclusion:

RESOURCE PAGE: "${resourcePage.title}"
DESCRIPTION: "${resourcePage.description}"

Generate a short message that:
1. Appreciates the resource compilation
2. Suggests adding Mobula API to the list
3. Explains the unique value it provides
4. Keeps it helpful, not promotional
5. Under 100 words

MESSAGE:`;

    try {
      const response = await this.claudeService.generateContent({
        type: 'outreach_email',
        topic: 'resource page suggestion', 
        keywords: ['blockchain API', 'comprehensive'],
        targetAudience: 'maintainers',
        additionalContext: prompt,
      });

      return response.content;
    } catch (error) {
      this.logger.error(`Failed to generate resource page pitch: ${error.message}`);
      return `Great resource compilation! I'd like to suggest adding Mobula API to your blockchain tools section. It provides comprehensive real-time and historical data for 20M+ crypto assets across 300+ exchanges with a single API. The documentation is developer-friendly and it supports both REST and WebSocket connections. Might be valuable for your users building DeFi/web3 applications.`;
    }
  }

  async getHighValueOpportunities(): Promise<BlogOpportunity[]> {
    const opportunities = await this.discoverOpportunities();
    return opportunities.filter(opp => opp.opportunityScore >= 80);
  }

  async getOpportunitiesByType(type: BlogOpportunity['type']): Promise<BlogOpportunity[]> {
    const opportunities = await this.discoverOpportunities();
    return opportunities.filter(opp => opp.type === type);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}