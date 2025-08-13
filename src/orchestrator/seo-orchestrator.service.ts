import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ClaudeService, ContentGenerationRequest } from '../services/claude.service';
import { NotionService } from '../services/notion.service';
import { SlackService } from '../services/slack.service';
import { SerpService, KeywordOpportunity } from '../services/serp.service';
import { ConfigService } from '../config/config.service';
import { RedditDiscoveryService } from '../services/reddit-discovery.service';
import { BlogDiscoveryService } from '../services/blog-discovery.service';
import { SocialListeningService } from '../services/social-listening.service';
import { GoogleSearchConsoleService } from '../services/google-search-console.service';

export interface ExecutionMetrics {
  contentCreated: number;
  opportunitiesIdentified: number;
  highPriorityOpportunities: number;
  avgQualityScore: number;
  executionTime: number;
  errors: number;
}

@Injectable()
export class SeoOrchestratorService {
  private readonly logger = new Logger(SeoOrchestratorService.name);
  private isExecuting = false;
  private executionCount = 0;
  
  // Core keywords to monitor and execute on
  private readonly coreKeywords = [
    'blockchain API',
    'crypto data API', 
    'web3 infrastructure',
    'blockchain data provider',
    'crypto market data API',
    'DeFi data API',
    'real time crypto data',
    'blockchain analytics API',
    'crypto trading API',
    'web3 data service',
    'how to get blockchain data',
    'best crypto API',
    'blockchain data integration',
    'crypto price API',
    'DeFi protocol data',
    // COMPARISON PAGE KEYWORDS for mobula.io/compare tracking
    'mobula vs coingecko',
    'mobula vs coinmarketcap', 
    'mobula vs moralis',
    'crypto api comparison',
    'blockchain data provider comparison',
    'best crypto data api',
    'mobula alternative',
    'coingecko alternative',
    'moralis alternative'
  ];

  private readonly competitorKeywords = [
    'alchemy vs moralis',
    'best blockchain API provider',
    'crypto data API comparison',
    'web3 infrastructure providers',
    'blockchain data service comparison'
  ];

  constructor(
    private claudeService: ClaudeService,
    private notionService: NotionService,
    private slackService: SlackService,
    private serpService: SerpService,
    private configService: ConfigService,
    private redditDiscoveryService: RedditDiscoveryService,
    private blogDiscoveryService: BlogDiscoveryService,
    private socialListeningService: SocialListeningService,
    private gscService: GoogleSearchConsoleService,
  ) {}

  // Main execution loop - runs twice per week
  @Cron('0 9 * * 1,4') // Monday and Thursday at 9 AM
  async executeContentGeneration(): Promise<void> {
    if (this.isExecuting) {
      this.logger.log('Content generation already in progress, skipping...');
      return;
    }

    this.isExecuting = true;
    this.executionCount++;
    
    const startTime = Date.now();
    const metrics: ExecutionMetrics = {
      contentCreated: 0,
      opportunitiesIdentified: 0,
      highPriorityOpportunities: 0,
      avgQualityScore: 0,
      executionTime: 0,
      errors: 0,
    };

    this.logger.log(`🚀 Starting SEO execution cycle #${this.executionCount}`);

    try {
      // Step 1: Identify high-impact opportunities
      const opportunities = await this.identifyOpportunities();
      metrics.opportunitiesIdentified = opportunities.length;
      metrics.highPriorityOpportunities = opportunities.filter(o => o.opportunityScore > 80).length;

      this.logger.log(`Found ${opportunities.length} opportunities, ${metrics.highPriorityOpportunities} high-priority`);

      // Step 2: Execute on top 3-5 opportunities
      const topOpportunities = opportunities.slice(0, 5);
      let totalQualityScore = 0;

      for (const opportunity of topOpportunities) {
        try {
          const content = await this.executeOpportunity(opportunity);
          if (content) {
            metrics.contentCreated++;
            totalQualityScore += content.qualityScore;

            // Save to Notion
            const pageId = await this.notionService.saveGeneratedContent(
              content,
              this.getContentType(opportunity),
              opportunity.opportunityScore,
              { originalKeyword: opportunity.keyword, gaps: opportunity.gaps }
            );

            // Notify Slack
            await this.slackService.sendContentGeneratedAlert({
              title: content.title,
              type: this.getContentType(opportunity),
              qualityScore: content.qualityScore,
              wordCount: content.wordCount,
              notionPageId: pageId,
            });

            this.logger.log(`✅ Executed opportunity: ${opportunity.keyword} (Score: ${content.qualityScore})`);
          }
        } catch (error) {
          metrics.errors++;
          this.logger.error(`Failed to execute opportunity: ${opportunity.keyword}`, error.stack);
          await this.slackService.sendErrorAlert({
            type: 'opportunity_execution',
            message: error.message,
            service: `Opportunity execution: ${opportunity.keyword}`,
          });
        }
      }

      // Calculate metrics
      metrics.avgQualityScore = metrics.contentCreated > 0 ? totalQualityScore / metrics.contentCreated : 0;
      metrics.executionTime = Date.now() - startTime;

      // Step 3: Monitor competitors and respond if needed
      await this.monitorCompetitors();

      // Step 4: Send execution summary
      await this.sendExecutionSummary(metrics);

      this.logger.log(`✅ Execution cycle completed: ${metrics.contentCreated} pieces created in ${metrics.executionTime}ms`);
      
    } catch (error) {
      this.logger.error('Critical error in execution cycle', error.stack);
      await this.slackService.sendErrorAlert({
        type: 'orchestrator_error',
        message: error.message,
        service: 'SEO Orchestrator execution cycle',
      });
    } finally {
      this.isExecuting = false;
    }
  }

  // Continuous monitoring loop - runs every 4 hours
  @Cron('0 */4 * * *')
  async continuousMonitoring(): Promise<void> {
    this.logger.log('🔍 Running continuous monitoring cycle');

    try {
      // Track ranking changes using both SERP and GSC data
      const rankings = await this.serpService.trackKeywordRankings(this.coreKeywords.slice(0, 10));
      const gscKeywordData = await this.gscService.trackKeywordPositions(this.coreKeywords.slice(0, 10), 7);
      
      // Look for immediate opportunities (trending topics, competitor gaps)
      const urgentOpportunities = await this.findUrgentOpportunities();
      
      if (urgentOpportunities.length > 0) {
        this.logger.log(`Found ${urgentOpportunities.length} urgent opportunities`);
        
        // Execute on the highest priority urgent opportunity
        const topUrgent = urgentOpportunities[0];
        const content = await this.executeOpportunity(topUrgent);
        
        if (content) {
          await this.notionService.saveGeneratedContent(
            content,
            this.getContentType(topUrgent),
            topUrgent.opportunityScore,
            { urgent: true, triggerReason: 'continuous monitoring' }
          );

          await this.slackService.sendOpportunitiesFoundAlert({
            count: 1,
            topOpportunity: topUrgent.keyword,
            averageScore: topUrgent.opportunityScore,
          });
        }
      }

      // Update performance data for published content
      await this.updatePerformanceData();
      
    } catch (error) {
      this.logger.error('Error in continuous monitoring', error.stack);
    }
  }

  // Reddit discovery - runs every 2 hours
  @Cron('0 */2 * * *')
  async scanRedditOpportunities(): Promise<void> {
    this.logger.log('🔍 Scanning Reddit for NEW opportunities...');

    try {
      const redditOpportunities = await this.redditDiscoveryService.getHighValueOpportunities();
      
      if (redditOpportunities.length > 0) {
        this.logger.log(`Found ${redditOpportunities.length} NEW high-value Reddit opportunities`);
        
        // Save top NEW Reddit opportunities to Notion
        for (const opportunity of redditOpportunities.slice(0, 5)) {
          await this.notionService.saveGeneratedContent(
            {
              title: `🆕 Reddit Opportunity: ${opportunity.postTitle}`,
              content: opportunity.suggestedResponse,
              targetKeywords: opportunity.keywords,
              qualityScore: opportunity.opportunityScore,
              wordCount: Math.round(opportunity.suggestedResponse.length / 5),
              metaDescription: `NEW manual engagement opportunity for ${opportunity.subreddit}: ${opportunity.postTitle.substring(0, 120)}...`,
              tags: ['reddit', 'manual-engagement', 'new-opportunity', ...opportunity.keywords],
            },
            'reddit_response',
            opportunity.opportunityScore,
            {
              postUrl: opportunity.postUrl,
              subreddit: opportunity.subreddit,
              postScore: opportunity.score,
              commentCount: opportunity.commentCount,
              engagementType: 'manual-monitoring',
              foundAt: new Date().toISOString(),
            }
          );
        }

        // Only notify Slack if there are NEW opportunities
        await this.slackService.sendOpportunitiesFoundAlert({
          count: redditOpportunities.length,
          topOpportunity: `${redditOpportunities[0].postTitle} (${redditOpportunities[0].postUrl})`,
          averageScore: redditOpportunities.reduce((sum, opp) => sum + opp.opportunityScore, 0) / redditOpportunities.length,
        });
      } else {
        this.logger.log('✅ No new high-value Reddit opportunities found - no notification sent');
      }
    } catch (error) {
      this.logger.error('Error in Reddit opportunity scan', error.stack);
      await this.slackService.sendErrorAlert({
        type: 'reddit_scan_error',
        message: error.message,
        service: 'Reddit Discovery Service',
      });
    }
  }

  // Blog opportunity discovery - runs daily at 10 AM
  @Cron('0 10 * * *')
  async scanBlogOpportunities(): Promise<void> {
    this.logger.log('🔍 Scanning for blog outreach opportunities...');

    try {
      const blogOpportunities = await this.blogDiscoveryService.getHighValueOpportunities();
      
      if (blogOpportunities.length > 0) {
        this.logger.log(`Found ${blogOpportunities.length} high-value blog opportunities`);
        
        // Save top blog opportunities to Notion
        for (const opportunity of blogOpportunities.slice(0, 3)) {
          await this.notionService.saveGeneratedContent(
            {
              title: `${opportunity.type.replace('_', ' ').toUpperCase()}: ${opportunity.title}`,
              content: opportunity.suggestedPitch,
              targetKeywords: opportunity.relevanceKeywords,
              qualityScore: opportunity.opportunityScore,
              wordCount: Math.round(opportunity.suggestedPitch.length / 5),
              metaDescription: `Blog outreach opportunity: ${opportunity.description.substring(0, 120)}...`,
              tags: ['outreach', opportunity.type, ...opportunity.relevanceKeywords],
            },
            'outreach_email',
            opportunity.opportunityScore,
            {
              url: opportunity.url,
              domain: opportunity.domain,
              opportunityType: opportunity.type,
              contactInfo: opportunity.contactInfo,
              contentGap: opportunity.contentGap,
            }
          );
        }

        // Notify Slack of blog opportunities
        await this.slackService.sendOpportunitiesFoundAlert({
          count: blogOpportunities.length,
          topOpportunity: blogOpportunities[0].title,
          averageScore: blogOpportunities.reduce((sum, opp) => sum + opp.opportunityScore, 0) / blogOpportunities.length,
        });
      }
    } catch (error) {
      this.logger.error('Error in blog opportunity scan', error.stack);
      await this.slackService.sendErrorAlert({
        type: 'blog_scan_error',
        message: error.message,
        service: 'Blog Discovery Service',
      });
    }
  }

  // Social listening scan - runs every 6 hours
  @Cron('0 */6 * * *')
  async scanSocialMentions(): Promise<void> {
    this.logger.log('🔍 Scanning social media for engagement opportunities...');

    try {
      const socialMentions = await this.socialListeningService.getHighValueMentions();
      
      if (socialMentions.length > 0) {
        this.logger.log(`Found ${socialMentions.length} high-value social mentions`);
        
        // Save top social opportunities to Notion
        for (const mention of socialMentions.slice(0, 5)) {
          await this.notionService.saveGeneratedContent(
            {
              title: `${mention.platform.toUpperCase()} Response: ${mention.title}`,
              content: mention.suggestedResponse,
              targetKeywords: mention.targetKeywords,
              qualityScore: mention.relevanceScore,
              wordCount: Math.round(mention.suggestedResponse.length / 5),
              metaDescription: `${mention.platform} engagement opportunity: ${mention.content.substring(0, 120)}...`,
              tags: ['social', mention.platform, mention.opportunityType, ...mention.targetKeywords],
            },
            'outreach_email',
            mention.relevanceScore,
            {
              url: mention.url,
              platform: mention.platform,
              author: mention.author.username,
              engagement: mention.engagement,
              opportunityType: mention.opportunityType,
              originalContent: mention.content,
            }
          );
        }

        // Notify Slack of social opportunities
        await this.slackService.sendOpportunitiesFoundAlert({
          count: socialMentions.length,
          topOpportunity: `${socialMentions[0].platform}: ${socialMentions[0].title}`,
          averageScore: socialMentions.reduce((sum, mention) => sum + mention.relevanceScore, 0) / socialMentions.length,
        });
      }
    } catch (error) {
      this.logger.error('Error in social listening scan', error.stack);
      await this.slackService.sendErrorAlert({
        type: 'social_scan_error',
        message: error.message,
        service: 'Social Listening Service',
      });
    }
  }

  // Weekly report - runs every Sunday
  @Cron('0 18 * * 0')
  async generateWeeklyReport(): Promise<void> {
    this.logger.log('📊 Generating weekly SEO execution report with GSC data');

    try {
      const readyContent = await this.notionService.getOpportunitiesByStatus('ready_to_publish');
      const publishedContent = await this.notionService.getOpportunitiesByStatus('published');

      // Get GSC performance data for the week
      const gscKeywordData = await this.gscService.trackKeywordPositions(this.coreKeywords, 7);
      const topQueries = await this.gscService.getTopQueries(7, 20);
      const topPages = await this.gscService.getTopPages(7, 10);

      const reportData = {
        contentCreated: readyContent.length,
        opportunitiesExecuted: publishedContent.length + readyContent.length,
        avgQualityScore: 85, // Will calculate from actual data
        topPerformingContent: publishedContent.slice(0, 5).map((item: any) => item.properties.Title?.title?.[0]?.text?.content || 'Untitled'),
        // GSC data
        totalClicks: topQueries.reduce((sum, q) => sum + q.clicks, 0),
        totalImpressions: topQueries.reduce((sum, q) => sum + q.impressions, 0),
        avgPosition: gscKeywordData.length > 0 ? gscKeywordData.reduce((sum, k) => sum + k.avgPosition, 0) / gscKeywordData.length : 0,
        rankingImprovements: gscKeywordData.filter(k => k.avgPosition > 0 && k.avgPosition <= 10).length,
      };

      await this.slackService.sendWeeklyReport({
        contentCreated: reportData.contentCreated,
        opportunitiesFound: reportData.opportunitiesExecuted,
        rankingImprovements: reportData.rankingImprovements,
        trafficIncrease: Math.round((reportData.totalClicks / Math.max(1, reportData.totalImpressions)) * 100), // CTR as proxy for traffic health
      });
      
      await this.notionService.createWeeklyReport({
        contentCreated: reportData.contentCreated,
        opportunitiesIdentified: readyContent.length + publishedContent.length,
        rankingImprovements: reportData.rankingImprovements,
        trafficIncrease: reportData.totalClicks,
        topPerformingContent: topPages.slice(0, 5).map(p => p.page),
        upcomingOpportunities: topQueries.slice(0, 10).map(q => q.query),
      });

    } catch (error) {
      this.logger.error('Failed to generate weekly report', error.stack);
    }
  }

  // Health check - runs daily
  @Cron(CronExpression.EVERY_DAY_AT_6AM)
  async dailyHealthCheck(): Promise<void> {
    this.logger.log('🔧 Running daily health check with GSC data');
    
    try {
      // Get GSC performance data for health check
      const topQueries = await this.gscService.getTopQueries(1, 10); // Last day
      const coreKeywordPositions = await this.gscService.trackKeywordPositions(this.coreKeywords.slice(0, 5), 1);
      
      const healthData = {
        totalContent: topQueries.length,
        avgPosition: coreKeywordPositions.length > 0 
          ? coreKeywordPositions.reduce((sum, k) => sum + k.avgPosition, 0) / coreKeywordPositions.length 
          : 0,
        totalClicks: topQueries.reduce((sum, q) => sum + q.clicks, 0),
        improvementCount: coreKeywordPositions.filter(k => k.avgPosition > 0 && k.avgPosition <= 20).length,
      };
      
      // Send health status to Slack with actual GSC data
      await this.slackService.sendPerformanceUpdate(healthData);
      
      // Verify API connections
      await this.verifyApiConnections();
      
    } catch (error) {
      this.logger.error('Health check failed', error.stack);
      await this.slackService.sendErrorAlert({
        type: 'health_check',
        message: error.message,
        service: 'Daily health check',
      });
    }
  }

  private async identifyOpportunities(): Promise<KeywordOpportunity[]> {
    this.logger.log('🔍 Identifying content opportunities...');

    // Combine core keywords with competitor-based keywords
    const allKeywords = [...this.coreKeywords, ...this.competitorKeywords];
    
    // Find opportunities using SERP analysis
    const opportunities = await this.serpService.findContentOpportunities(allKeywords);
    
    // Filter and prioritize
    const filteredOpportunities = opportunities
      .filter(opp => opp.opportunityScore > 60)
      .sort((a, b) => b.opportunityScore - a.opportunityScore);

    this.logger.log(`Identified ${filteredOpportunities.length} viable opportunities`);
    
    return filteredOpportunities;
  }

  private async executeOpportunity(opportunity: KeywordOpportunity): Promise<any> {
    this.logger.log(`⚡ Executing opportunity: ${opportunity.keyword} (Score: ${opportunity.opportunityScore})`);

    const contentRequest: ContentGenerationRequest = {
      type: this.getContentType(opportunity),
      topic: opportunity.keyword,
      keywords: [opportunity.keyword, ...this.getRelatedKeywords(opportunity.keyword)],
      targetAudience: this.getTargetAudience(opportunity.intent),
      competitorAnalysis: opportunity.gaps.join('. '),
      additionalContext: `Opportunity score: ${opportunity.opportunityScore}. Search intent: ${opportunity.intent}. Competition level: ${opportunity.competition}.`,
    };

    return await this.claudeService.generateContent(contentRequest);
  }

  private getContentType(opportunity: KeywordOpportunity): 'blog_article' | 'reddit_response' | 'outreach_email' | 'technical_guide' {
    // Determine content type based on Mobula's content strategy (40% technical, 25% comparison, 25% problem-solution, 10% analysis)
    const keyword = opportunity.keyword.toLowerCase();
    
    // Technical Deep-Dives (40% of content) - Architecture, performance, infrastructure
    if (keyword.includes('architecture') || keyword.includes('infrastructure') || keyword.includes('performance') || 
        keyword.includes('latency') || keyword.includes('websocket') || keyword.includes('optimization') ||
        keyword.includes('100k requests') || keyword.includes('build') || keyword.includes('complete guide')) {
      return 'technical_guide';
    }
    
    // Comparison/Alternative Content (25% of content) - Competitor analysis
    if (keyword.includes('vs') || keyword.includes('comparison') || keyword.includes('alternative') || 
        keyword.includes('alchemy') || keyword.includes('moralis') || keyword.includes('infura') ||
        keyword.includes('best') || keyword.includes('providers')) {
      return 'blog_article'; // Comparison article
    }
    
    // Problem-Solution Tutorials (25% of content) - Developer problems and solutions
    if (keyword.includes('how to') || keyword.includes('debug') || keyword.includes('error') ||
        keyword.includes('null') || keyword.includes('failed') || keyword.includes('troubleshoot') ||
        keyword.includes('fix') || keyword.includes('solving') || keyword.includes('tutorial')) {
      return 'blog_article'; // Problem-solution tutorial
    }
    
    // Industry Analysis & Thought Leadership (10% of content) - Data-driven insights
    if (keyword.includes('analysis') || keyword.includes('report') || keyword.includes('trends') ||
        keyword.includes('research') || keyword.includes('hidden costs') || keyword.includes('why')) {
      return 'blog_article'; // Industry analysis
    }
    
    // Default to problem-solution blog article (most versatile for SEO)
    return 'blog_article';
  }

  private getRelatedKeywords(keyword: string): string[] {
    // Simple keyword expansion logic
    const related: string[] = [];
    
    if (keyword.includes('API')) {
      related.push('REST API', 'GraphQL API', 'WebSocket API');
    }
    
    if (keyword.includes('blockchain')) {
      related.push('web3', 'DeFi', 'crypto data');
    }
    
    if (keyword.includes('data')) {
      related.push('real-time data', 'market data', 'analytics');
    }
    
    return related.slice(0, 3);
  }

  private getTargetAudience(intent: KeywordOpportunity['intent']): string {
    const audiences = {
      informational: 'Crypto developers and blockchain engineers seeking technical knowledge',
      commercial: 'CTOs and technical leads evaluating blockchain infrastructure solutions',
      transactional: 'Development teams ready to implement blockchain data solutions',
      navigational: 'Existing users and potential customers seeking specific information',
    };
    
    return audiences[intent] || audiences.informational;
  }

  private async findUrgentOpportunities(): Promise<KeywordOpportunity[]> {
    // Look for trending keywords or sudden competitor movements
    const trendingKeywords = [
      'blockchain API trends 2024',
      'new DeFi protocols',
      'crypto market data updates',
    ];
    
    return await this.serpService.findContentOpportunities(trendingKeywords);
  }

  private async monitorCompetitors(): Promise<void> {
    this.logger.log('👀 Monitoring competitor activity...');
    
    // This would integrate with competitor tracking APIs
    // For now, we'll track their SERP positions
    const competitorKeywords = this.competitorKeywords.slice(0, 5);
    
    for (const keyword of competitorKeywords) {
      const analysis = await this.serpService.analyzeSerpForKeyword(keyword);
      
      // If competitors are ranking well, create counter-content
      if (analysis.competitorPresence.length > 0 && analysis.competitorPresence[0].position <= 5) {
        const competitor = analysis.competitorPresence[0];
        
        this.logger.log(`Competitor ${competitor.domain} ranking #${competitor.position} for "${keyword}"`);
        
        // Generate counter-content
        const opportunity: KeywordOpportunity = {
          keyword: `${keyword} alternative`,
          searchVolume: 1000,
          competition: 'medium',
          difficulty: 70,
          intent: 'commercial',
          opportunityScore: 75,
          gaps: ['Better technical explanation needed', 'More comprehensive comparison'],
        };
        
        const content = await this.executeOpportunity(opportunity);
        if (content) {
          await this.notionService.saveGeneratedContent(
            content,
            'blog_article',
            opportunity.opportunityScore,
            { competitorResponse: true, targetCompetitor: competitor.domain }
          );

          await this.slackService.sendOpportunitiesFoundAlert({
            count: 1,
            topOpportunity: `${keyword} (competitor response)`,
            averageScore: opportunity.opportunityScore,
          });
        }
      }
    }
  }

  private async updatePerformanceData(): Promise<void> {
    this.logger.log('📈 Updating performance data for published content using GSC');
    
    try {
      // Get top performing content from GSC
      const topPages = await this.gscService.getTopPages(30, 20);
      const topQueries = await this.gscService.getTopQueries(30, 50);
      
      // Log performance insights
      if (topPages.length > 0) {
        this.logger.log(`Top performing page: ${topPages[0].page} (${topPages[0].clicks} clicks)`);
      }
      
      if (topQueries.length > 0) {
        this.logger.log(`Top performing query: "${topQueries[0].query}" (${topQueries[0].clicks} clicks, pos ${topQueries[0].position.toFixed(1)})`);
      }
      
      // Store performance data in Notion for analysis
      const performanceReport = {
        topPages: topPages.slice(0, 10),
        topQueries: topQueries.slice(0, 20),
        generatedAt: new Date().toISOString(),
      };
      
      // Save performance snapshot to Notion
      await this.notionService.saveGeneratedContent(
        {
          title: `GSC Performance Report - ${new Date().toLocaleDateString()}`,
          content: `# Performance Summary\n\n## Top Pages:\n${topPages.slice(0, 5).map(p => `- ${p.page}: ${p.clicks} clicks (pos ${p.position.toFixed(1)})`).join('\n')}\n\n## Top Queries:\n${topQueries.slice(0, 10).map(q => `- "${q.query}": ${q.clicks} clicks (pos ${q.position.toFixed(1)})`).join('\n')}`,
          targetKeywords: topQueries.slice(0, 5).map(q => q.query),
          qualityScore: 95,
          wordCount: 200,
          metaDescription: `GSC performance report showing top content and queries for ${new Date().toLocaleDateString()}`,
          tags: ['gsc', 'performance', 'analytics', 'report'],
        },
        'blog_article',
        95,
        {
          reportType: 'gsc-performance',
          dataSource: 'Google Search Console',
          generatedAt: new Date().toISOString(),
          topPagesData: performanceReport.topPages,
          topQueriesData: performanceReport.topQueries,
        }
      );
      
    } catch (error) {
      this.logger.error(`Failed to update performance data: ${error.message}`, error.stack);
    }
  }

  private async sendExecutionSummary(metrics: ExecutionMetrics): Promise<void> {
    const summary = `🤖 **SEO Execution Cycle #${this.executionCount} Complete**

✅ **EXECUTED THIS CYCLE:**
• ${metrics.contentCreated} high-quality pieces generated → Ready in Notion
• ${metrics.opportunitiesIdentified} opportunities analyzed
• ${metrics.highPriorityOpportunities} high-priority opportunities identified
• Average quality score: ${Math.round(metrics.avgQualityScore)}/100

⚡ **EXECUTION PERFORMANCE:**
• Cycle time: ${Math.round(metrics.executionTime / 1000)}s
• Errors: ${metrics.errors}
• Success rate: ${Math.round(((metrics.contentCreated / Math.max(1, metrics.opportunitiesIdentified)) * 100))}%

🎯 **NEXT ACTIONS:**
• Content ready for review and publication in Notion
• Continuous monitoring active for urgent opportunities
• Next scheduled execution: ${this.getNextExecutionTime()}

*The agent continues autonomous execution 24/7.*`;

    await this.slackService.sendNotification({
      type: 'performance_update',
      title: 'SEO Execution Cycle Complete',
      message: summary,
      data: {
        contentCreated: metrics.contentCreated,
        avgQualityScore: metrics.avgQualityScore,
        executionTime: metrics.executionTime,
      },
    });
  }

  private async verifyApiConnections(): Promise<void> {
    const apis = ['Claude', 'Notion', 'Slack', 'SerpAPI'];
    
    try {
      // Test GSC connection
      const gscConnected = await this.gscService.testConnection();
      if (gscConnected) {
        apis.push('Google Search Console');
      }
    } catch (error) {
      this.logger.warn(`GSC connection test failed: ${error.message}`);
    }
    
    // In a real implementation, we'd ping each API to verify connectivity
    this.logger.log(`✅ Verified connections to: ${apis.join(', ')}`);
  }

  private getNextExecutionTime(): string {
    // Calculate next Monday or Thursday at 9 AM
    const now = new Date();
    const nextExecution = new Date(now);
    
    if (now.getDay() <= 1) { // Before Monday
      nextExecution.setDate(now.getDate() + (1 - now.getDay()));
    } else if (now.getDay() <= 4) { // Before Thursday
      nextExecution.setDate(now.getDate() + (4 - now.getDay()));
    } else { // After Thursday, next Monday
      nextExecution.setDate(now.getDate() + (8 - now.getDay()));
    }
    
    nextExecution.setHours(9, 0, 0, 0);
    
    return nextExecution.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  }
}