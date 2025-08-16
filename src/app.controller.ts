import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { DataForSeoService } from './services/dataforseo.service';
import { ClaudeService } from './services/claude.service';
import { NotionService } from './services/notion.service';
import { SerpService } from './services/serp.service';
import { SlackService } from './services/slack.service';
import { GoogleSearchConsoleService } from './services/google-search-console.service';
import { RedditDiscoveryService } from './services/reddit-discovery.service';
import { BlogDiscoveryService } from './services/blog-discovery.service';
import { SocialListeningService } from './services/social-listening.service';
import { RedditResponseGeneratorService } from './services/reddit-response-generator.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly dataForSeoService: DataForSeoService,
    private readonly claudeService: ClaudeService,
    private readonly notionService: NotionService,
    private readonly serpService: SerpService,
    private readonly slackService: SlackService,
    private readonly gscService: GoogleSearchConsoleService,
    private readonly redditService: RedditDiscoveryService,
    private readonly blogService: BlogDiscoveryService,
    private readonly socialService: SocialListeningService,
    private readonly redditResponseGenerator: RedditResponseGeneratorService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'mobula-seo-agent',
      version: '1.0.0'
    };
  }

  @Get('test-dataforseo')
  async testDataForSeo() {
    try {
      const isConnected = await this.dataForSeoService.testConnection();
      if (isConnected) {
        // Test getting keyword data for Mobula keywords
        const testKeywords = ['blockchain API', 'crypto data API'];
        const keywordData = await this.dataForSeoService.getKeywordData(testKeywords);
        
        return {
          status: 'success',
          connection: true,
          testKeywords: keywordData
        };
      }
      return {
        status: 'failed',
        connection: false,
        error: 'Connection test failed'
      };
    } catch (error) {
      return {
        status: 'error',
        connection: false,
        error: error.message
      };
    }
  }

  @Get('test-claude-notion')
  async testClaudeNotion() {
    try {
      // Test Claude content generation
      const content = await this.claudeService.generateContent({
        type: 'blog_article',
        topic: 'blockchain API testing',
        keywords: ['blockchain API', 'test'],
        targetAudience: 'developers',
        additionalContext: 'This is a test of the content generation system'
      });

      // Test Notion integration by saving the content
      const pageId = await this.notionService.saveGeneratedContent(
        content,
        'blog_article',
        85, // priority score
        { test: true, timestamp: new Date().toISOString() }
      );

      return {
        status: 'success',
        claudeConnected: true,
        notionConnected: true,
        generatedContent: {
          title: content.title,
          wordCount: content.wordCount,
          qualityScore: content.qualityScore
        },
        notionPageId: pageId
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message
      };
    }
  }

  @Get('test-notion-simple')
  async testNotionSimple() {
    try {
      // First, let's check the database schema to understand the exact property configuration
      const databaseSchema = await this.notionService.getDatabaseSchema();
      
      return {
        status: 'success',
        databaseSchema: databaseSchema,
        message: 'Database schema retrieved successfully'
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message
      };
    }
  }

  @Get('test-serpapi')
  async testSerpApi() {
    try {
      const keyword = 'blockchain API';
      const serpAnalysis = await this.serpService.analyzeSerpForKeyword(keyword);
      
      return {
        status: 'success',
        keyword: keyword,
        totalResults: serpAnalysis.totalResults,
        topResults: serpAnalysis.topResults.slice(0, 5),
        peopleAlsoAsk: serpAnalysis.peopleAlsoAsk,
        competitorPresence: serpAnalysis.competitorPresence,
        message: 'SerpAPI connected and working'
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message
      };
    }
  }

  @Get('test-slack')
  async testSlack() {
    try {
      await this.slackService.sendContentGeneratedAlert({
        title: 'Test Content Generation',
        type: 'blog_article',
        qualityScore: 85,
        wordCount: 1200,
        notionPageId: '24d2083f-da3e-8198-862b-test123456789',
      });
      
      return {
        status: 'success',
        message: 'Slack notification sent successfully'
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message
      };
    }
  }

  @Get('test-gsc')
  async testGSC() {
    try {
      const connectionTest = await this.gscService.testConnection();
      
      if (connectionTest) {
        // Get recent performance data
        const topQueries = await this.gscService.getTopQueries(7, 10);
        
        return {
          status: 'success',
          connection: true,
          topQueries: topQueries,
          message: 'Google Search Console connected successfully'
        };
      } else {
        return {
          status: 'warning',
          connection: false,
          message: 'GSC connection successful but target domain not found or no permissions'
        };
      }
    } catch (error) {
      return {
        status: 'error',
        connection: false,
        error: error.message
      };
    }
  }

  @Get('debug-gsc')
  async debugGSC() {
    try {
      // Check if credentials are loaded
      const hasCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64 || 
                           process.env.GOOGLE_APPLICATION_CREDENTIALS;
      
      return {
        credentialsConfigured: !!hasCredentials,
        credentialType: process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64 ? 'base64' : 
                       process.env.GOOGLE_APPLICATION_CREDENTIALS ? 'json' : 'none',
        targetDomain: 'mobula.io',
        expectedServiceAccount: 'mobula-seo@seo-agent-467515.iam.gserviceaccount.com',
        message: 'Check these details match your Search Console setup'
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message
      };
    }
  }

  @Get('test-reddit')
  async testReddit() {
    try {
      const newOpportunities = await this.redditService.getNewOpportunities();
      const deduplicationStatus = this.redditService.getDeduplicationStatus();
      
      return {
        status: 'success',
        newOpportunitiesFound: newOpportunities.length,
        deduplicationStatus,
        topNewOpportunities: newOpportunities.slice(0, 5).map(opp => ({
          title: opp.postTitle,
          postUrl: opp.postUrl,
          subreddit: opp.subreddit,
          score: opp.opportunityScore,
          keywords: opp.keywords,
          postScore: opp.score,
          comments: opp.commentCount,
        })),
        message: newOpportunities.length > 0 
          ? `Found ${newOpportunities.length} new opportunities` 
          : 'No new opportunities found (all previously seen)'
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message
      };
    }
  }

  @Get('test-blog-discovery')
  async testBlogDiscovery() {
    try {
      const opportunities = await this.blogService.discoverOpportunities();
      
      return {
        status: 'success',
        opportunitiesFound: opportunities.length,
        opportunitiesByType: {
          broken_link: opportunities.filter(o => o.type === 'broken_link').length,
          guest_post: opportunities.filter(o => o.type === 'guest_post').length,
          resource_page: opportunities.filter(o => o.type === 'resource_page').length,
        },
        topOpportunities: opportunities.slice(0, 3).map(opp => ({
          type: opp.type,
          domain: opp.domain,
          title: opp.title,
          score: opp.opportunityScore,
          description: opp.description,
          keywords: opp.relevanceKeywords,
        })),
        message: 'Blog discovery working - found outreach opportunities'
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message
      };
    }
  }

  @Get('test-social-listening')
  async testSocialListening() {
    try {
      const mentions = await this.socialService.listenForMentions();
      
      return {
        status: 'success',
        mentionsFound: mentions.length,
        mentionsByPlatform: {
          twitter: mentions.filter(m => m.platform === 'twitter').length,
          hackernews: mentions.filter(m => m.platform === 'hackernews').length,
          github: mentions.filter(m => m.platform === 'github').length,
          linkedin: mentions.filter(m => m.platform === 'linkedin').length,
        },
        mentionsByType: {
          question: mentions.filter(m => m.opportunityType === 'question').length,
          complaint: mentions.filter(m => m.opportunityType === 'complaint').length,
          mention: mentions.filter(m => m.opportunityType === 'mention').length,
          tutorial_request: mentions.filter(m => m.opportunityType === 'tutorial_request').length,
        },
        topMentions: mentions.slice(0, 3).map(mention => ({
          platform: mention.platform,
          opportunityType: mention.opportunityType,
          relevanceScore: mention.relevanceScore,
          author: mention.author.username,
          engagement: mention.engagement,
          content: mention.content.substring(0, 100) + '...',
          keywords: mention.targetKeywords,
        })),
        message: 'Social listening working - found mentions across platforms'
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message
      };
    }
  }

  @Get('clear-reddit-cache')
  async clearRedditCache() {
    try {
      this.redditService.clearSeenPostsCache();
      return {
        status: 'success',
        message: 'Reddit cache cleared - next scan will find fresh opportunities'
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message
      };
    }
  }

  @Get('test-content-generation')
  async testContentGeneration() {
    try {
      // Test the main content generation pipeline
      const testKeyword = 'blockchain API comparison';
      
      // Test SERP analysis
      const serpAnalysis = await this.serpService.analyzeSerpForKeyword(testKeyword);
      
      // Test content generation with Claude
      const content = await this.claudeService.generateContent({
        type: 'blog_article',
        topic: testKeyword,
        keywords: ['blockchain API', 'crypto data API', 'web3 infrastructure'],
        targetAudience: 'blockchain developers',
        competitorAnalysis: `Top competitors: ${serpAnalysis.topResults.slice(0, 3).map(r => r.domain).join(', ')}`,
        additionalContext: 'Focus on technical comparison of features, performance, and pricing for developers choosing blockchain data providers.'
      });

      return {
        status: 'success',
        testKeyword,
        serpData: {
          totalResults: serpAnalysis.totalResults,
          topCompetitors: serpAnalysis.topResults.slice(0, 5).map(r => ({
            domain: r.domain,
            title: r.title,
            position: r.position
          })),
          peopleAlsoAsk: serpAnalysis.peopleAlsoAsk.slice(0, 3)
        },
        generatedContent: {
          title: content.title,
          wordCount: content.wordCount,
          qualityScore: content.qualityScore,
          contentPreview: content.content.substring(0, 300) + '...',
          tags: content.tags
        },
        message: 'Content generation pipeline working correctly'
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        message: 'Content generation pipeline failed'
      };
    }
  }

  @Get('generate-save-article')
  async generateAndSaveArticle() {
    try {
      // Test full pipeline: SERP research + content generation + Notion save
      const testKeyword = 'best crypto API for developers 2025';
      
      // Step 1: SERP analysis for keyword research
      const serpAnalysis = await this.serpService.analyzeSerpForKeyword(testKeyword);
      
      // Step 2: Generate high-quality article content 
      const content = await this.claudeService.generateContent({
        type: 'blog_article',
        topic: testKeyword,
        keywords: ['crypto API', 'blockchain API', 'web3 API', 'developer tools'],
        targetAudience: 'blockchain developers and technical decision makers',
        competitorAnalysis: `Main competitors: ${serpAnalysis.topResults.slice(0, 5).map(r => `${r.domain} (#${r.position})`).join(', ')}. Must differentiate from existing content.`,
        additionalContext: 'Create comprehensive guide covering features, pricing, rate limits, and real developer use cases. Include code examples and technical comparisons. Position Mobula as a competitive option.'
      });

      // Step 3: Save to Notion with full metadata
      const notionPageId = await this.notionService.saveGeneratedContent(
        content,
        'blog_article',
        85, // high priority score
        {
          testGeneration: true,
          keyword: testKeyword,
          serpData: serpAnalysis.topResults.slice(0, 3),
          generatedAt: new Date().toISOString(),
          contentType: 'technical_comparison'
        }
      );

      return {
        status: 'success',
        pipeline: 'SERP Research → Content Generation → Notion Save',
        testKeyword,
        serpInsights: {
          totalResults: serpAnalysis.totalResults,
          competitorDomains: serpAnalysis.topResults.slice(0, 5).map(r => r.domain),
          peopleAlsoAsk: serpAnalysis.peopleAlsoAsk.slice(0, 3)
        },
        generatedContent: {
          title: content.title,
          wordCount: content.wordCount,
          qualityScore: content.qualityScore,
          metaDescription: content.metaDescription,
          tags: content.tags,
          contentPreview: content.content.substring(0, 400) + '...'
        },
        notionPageId,
        notionUrl: `https://notion.so/${notionPageId.replace(/-/g, '')}`,
        message: 'Full content generation pipeline executed successfully - check Notion for the complete article!'
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        pipeline: 'Failed during content generation pipeline'
      };
    }
  }

  @Get('scan-reddit-save-to-notion')
  async scanRedditAndSaveToNotion() {
    try {
      // Clear cache and get ALL fresh Reddit opportunities with SEO optimization
      this.redditService.clearSeenPostsCache();
      const allOpportunities = await this.redditService.discoverOpportunities();
      
      let savedCount = 0;
      const savedOpportunities: any[] = [];
      
      // Generate SEO-optimized responses for top opportunities
      for (const opp of allOpportunities.slice(0, 10)) {
        try {
          // Get SERP data for SEO optimization
          let seoOptimizedResponse = opp.suggestedResponse;
          let serpInsights = '';
          
          try {
            const serpData = await this.serpService.analyzeSerpForKeyword(`${opp.keywords[0]} API`);
            
            // Generate SEO-optimized response with SERP data for Mobula positioning
            const redditResponse = await this.redditResponseGenerator.generateResponse({
              postTitle: opp.postTitle,
              postContent: opp.content,
              subreddit: opp.subreddit,
              author: opp.author,
              url: opp.postUrl,
              keywords: opp.keywords,
              serpData: {
                topCompetitors: serpData.topResults.slice(0, 3).map(r => r.domain),
                peopleAlsoAsk: serpData.peopleAlsoAsk.slice(0, 3),
                totalResults: serpData.totalResults
              }
            });
            seoOptimizedResponse = redditResponse.response;
            
            serpInsights = `
**🔍 SEO INSIGHTS:**
- Search volume: ${serpData.totalResults.toLocaleString()} results for "${opp.keywords[0]} API"
- Top competitors: ${serpData.topResults.slice(0, 3).map(r => r.domain).join(', ')}
- Related questions: ${serpData.peopleAlsoAsk.slice(0, 2).join(' | ')}`;
            
          } catch (serpError) {
            console.log('SERP analysis failed, using basic response');
          }

          const pageId = await this.notionService.createOpportunity({
            type: 'reddit_response',
            title: `🔥 Reddit: ${opp.postTitle}`,
            content: `**REDDIT ENGAGEMENT OPPORTUNITY**

**Post:** ${opp.postTitle}
**Subreddit:** r/${opp.subreddit}  
**URL:** ${opp.postUrl}
**Author:** ${opp.author}
**Reddit Score:** ${opp.score} upvotes
**Comments:** ${opp.commentCount}
**Keywords Matched:** ${opp.keywords.join(', ')}
**Opportunity Score:** ${opp.opportunityScore}/100
${serpInsights}

---

**🤖 SEO-OPTIMIZED RESPONSE DRAFT:**

${seoOptimizedResponse}

---

**📝 ACTION:** Review the SEO-optimized response above, customize if needed, and post as a helpful comment on Reddit. This response is optimized for search visibility and competitor positioning.`,
            priorityScore: opp.opportunityScore,
            status: 'identified',
            targetKeywords: opp.keywords,
            competitionDifficulty: 30,
            trafficPotential: opp.score * 10,
            generatedAt: new Date(),
          });
          
          savedCount++;
          savedOpportunities.push({
            title: opp.postTitle,
            subreddit: opp.subreddit,
            score: opp.opportunityScore,
            url: opp.postUrl,
            notionPageId: pageId,
          });
          
        } catch (error) {
          console.error(`Failed to save opportunity: ${opp.postTitle}`, error.message);
        }
      }
      
      return {
        status: 'success',
        totalOpportunitiesFound: allOpportunities.length,
        savedToNotion: savedCount,
        opportunities: savedOpportunities,
        message: `Successfully saved ${savedCount} Reddit opportunities to Notion`
      };
      
    } catch (error) {
      return {
        status: 'error',
        error: error.message
      };
    }
  }

  @Get('scan-reddit-6months')
  async scanReddit6Months() {
    try {
      // Clear cache and get fresh Reddit opportunities from last 6 months
      this.redditService.clearSeenPostsCache();
      
      // Temporarily modify the Reddit service to scan 6 months
      const allOpportunities = await this.redditService.discoverOpportunitiesHistorical(6); // 6 months
      
      let savedCount = 0;
      const savedOpportunities: any[] = [];
      
      // Generate SEO-optimized responses for top opportunities
      for (const opp of allOpportunities.slice(0, 25)) { // Save more for historical scan
        try {
          // Get SERP data for SEO optimization
          let seoOptimizedResponse = opp.suggestedResponse;
          let serpInsights = '';
          
          try {
            const serpData = await this.serpService.analyzeSerpForKeyword(`${opp.keywords[0]} API`);
            
            // Generate SEO-optimized response with SERP data for Mobula positioning
            const redditResponse = await this.redditResponseGenerator.generateResponse({
              postTitle: opp.postTitle,
              postContent: opp.content,
              subreddit: opp.subreddit,
              author: opp.author,
              url: opp.postUrl,
              keywords: opp.keywords,
              serpData: {
                topCompetitors: serpData.topResults.slice(0, 3).map(r => r.domain),
                peopleAlsoAsk: serpData.peopleAlsoAsk.slice(0, 3),
                totalResults: serpData.totalResults
              }
            });
            seoOptimizedResponse = redditResponse.response;
            
            serpInsights = `
**🔍 SEO INSIGHTS:**
- Search volume: ${serpData.totalResults.toLocaleString()} results for "${opp.keywords[0]} API"
- Top competitors: ${serpData.topResults.slice(0, 3).map(r => r.domain).join(', ')}
- Related questions: ${serpData.peopleAlsoAsk.slice(0, 2).join(' | ')}`;
            
          } catch (serpError) {
            console.log('SERP analysis failed, using basic response');
          }

          const pageId = await this.notionService.createOpportunity({
            type: 'reddit_response',
            title: `📅 Historical Reddit: ${opp.postTitle}`,
            content: `**REDDIT ENGAGEMENT OPPORTUNITY (6-MONTH HISTORICAL SCAN)**

**Post:** ${opp.postTitle}
**Subreddit:** r/${opp.subreddit}  
**URL:** ${opp.postUrl}
**Author:** ${opp.author}
**Reddit Score:** ${opp.score} upvotes
**Comments:** ${opp.commentCount}
**Posted:** ${new Date(opp.timestamp).toLocaleDateString()}
**Keywords Matched:** ${opp.keywords.join(', ')}
**Opportunity Score:** ${opp.opportunityScore}/100
${serpInsights}

---

**🤖 SEO-OPTIMIZED RESPONSE DRAFT:**

${seoOptimizedResponse}

---

**📝 ACTION:** Historical opportunity from 6-month scan. Review the SEO-optimized response above, customize if needed. This post may be older but represents a pattern of API requests to monitor.`,
            priorityScore: Math.max(opp.opportunityScore - 10, 1), // Slightly lower priority for historical
            status: 'identified',
            targetKeywords: opp.keywords,
            competitionDifficulty: 30,
            trafficPotential: opp.score * 5, // Lower traffic potential for older posts
            generatedAt: new Date(),
          });
          
          savedCount++;
          savedOpportunities.push({
            title: opp.postTitle,
            subreddit: opp.subreddit,
            score: opp.opportunityScore,
            url: opp.postUrl,
            notionPageId: pageId,
            posted: new Date(opp.timestamp).toLocaleDateString(),
          });
          
        } catch (error) {
          console.error(`Failed to save opportunity: ${opp.postTitle}`, error.message);
        }
      }
      
      return {
        status: 'success',
        scanPeriod: '6 months',
        totalOpportunitiesFound: allOpportunities.length,
        savedToNotion: savedCount,
        opportunities: savedOpportunities,
        message: `Successfully saved ${savedCount} historical Reddit opportunities to Notion (6-month scan)`
      };
      
    } catch (error) {
      return {
        status: 'error',
        error: error.message
      };
    }
  }

  @Get('generate-reddit-responses')
  async generateRedditResponses() {
    try {
      // Sample Reddit opportunities (would normally come from Notion)
      const sampleOpportunities = [
        {
          postTitle: "Best API for getting Solana token data?",
          postContent: "I'm building a portfolio tracker and need to get token metadata, prices, and balances for SPL tokens. What APIs do you recommend? Currently using Alchemy but their Solana support is limited.",
          subreddit: "solana",
          author: "crypto_dev_2024",
          url: "https://reddit.com/r/solana/comments/example1",
          keywords: ["solana api", "token data", "portfolio", "spl tokens", "metadata"]
        },
        {
          postTitle: "How to get historical price data for DeFi tokens?",
          postContent: "Working on analytics dashboard and need OHLC data for various DeFi tokens across different chains. CoinGecko API is rate limiting me. Any alternatives?",
          subreddit: "defi",
          author: "defi_builder",
          url: "https://reddit.com/r/defi/comments/example2",
          keywords: ["historical price", "ohlc", "defi tokens", "multi-chain", "rate limits"]
        },
        {
          postTitle: "Need wallet tracking API for multiple chains",
          postContent: "Building a tool to track wallet performance across Ethereum, Polygon, BSC. Need transaction history, P&L calculations, current balances. What do you use?",
          subreddit: "ethdev",
          author: "web3_developer",
          url: "https://reddit.com/r/ethdev/comments/example3",
          keywords: ["wallet tracking", "multi-chain", "transaction history", "pnl", "portfolio analytics"]
        }
      ];

      const responses: any[] = [];

      for (const opportunity of sampleOpportunities) {
        try {
          const response = await this.redditResponseGenerator.generateResponse({
            postTitle: opportunity.postTitle,
            postContent: opportunity.postContent,
            subreddit: opportunity.subreddit,
            author: opportunity.author,
            url: opportunity.url,
            keywords: opportunity.keywords,
          });

          responses.push({
            originalPost: {
              title: opportunity.postTitle,
              subreddit: opportunity.subreddit,
              url: opportunity.url,
            },
            generatedResponse: response,
            status: 'ready_for_review'
          });

        } catch (error) {
          responses.push({
            originalPost: {
              title: opportunity.postTitle,
              subreddit: opportunity.subreddit,
            },
            error: error.message,
            status: 'failed'
          });
        }
      }

      return {
        status: 'success',
        responsesGenerated: responses.length,
        responses,
        message: `Generated ${responses.length} Reddit responses following your guidelines`
      };

    } catch (error) {
      return {
        status: 'error',
        error: error.message
      };
    }
  }
}
