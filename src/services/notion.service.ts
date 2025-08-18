import { Injectable, Logger } from '@nestjs/common';
import { Client } from '@notionhq/client';
import { ConfigService } from '../config/config.service';
import { GeneratedContent } from './claude.service';

export interface OpportunityRecord {
  type: 'blog_article' | 'reddit_response' | 'outreach_email' | 'technical_guide' | 'backlink_opportunity';
  title: string;
  content: string;
  priorityScore: number;
  status: 'identified' | 'generated' | 'ready_to_publish' | 'published';
  targetKeywords: string[];
  competitionDifficulty: number;
  trafficPotential: number;
  generatedAt: Date;
  publishedAt?: Date;
  performanceData?: {
    impressions?: number;
    clicks?: number;
    avgPosition?: number;
    backlinks?: number;
  };
  additionalData?: Record<string, any>;
}

@Injectable()
export class NotionService {
  private readonly logger = new Logger(NotionService.name);
  private readonly notion: Client;
  private readonly databaseId: string;

  constructor(private configService: ConfigService) {
    const config = this.configService.config;
    this.notion = new Client({
      auth: config.notion.apiKey,
      timeoutMs: 30000, // 30 second timeout
    });
    this.databaseId = config.notion.databaseId;
  }

  async getDatabaseSchema(): Promise<any> {
    this.logger.log(`Getting database schema for: ${this.databaseId}`);

    try {
      const response = await this.notion.databases.retrieve({
        database_id: this.databaseId,
      });

      this.logger.log('Database schema retrieved successfully');
      return {
        properties: response.properties,
        response: response,  // Return full response for debugging
      };
    } catch (error) {
      this.logger.error(`Failed to retrieve database schema: ${error.message}`, error.stack);
      throw new Error(`Failed to retrieve database schema: ${error.message}`);
    }
  }

  async createOpportunity(opportunity: OpportunityRecord): Promise<string> {
    return await this.retryNotionRequest(
      () => this.createOpportunityInternal(opportunity),
      `createOpportunity: ${opportunity.title}`
    );
  }

  private async createOpportunityInternal(opportunity: OpportunityRecord): Promise<string> {
    this.logger.log(`Creating opportunity: ${opportunity.title}`);

    try {
      const response = await this.notion.pages.create({
        parent: {
          database_id: this.databaseId,
        },
        properties: {
          'Title': {
            title: [
              {
                text: {
                  content: opportunity.title,
                },
              },
            ],
          },
          'Type': {
            select: {
              name: opportunity.type,
            },
          },
          'Priority Score': {
            number: opportunity.priorityScore,
          },
          'Status': {
            status: {
              name: opportunity.status,
            },
          },
          'Target Keywords': {
            multi_select: opportunity.targetKeywords.map(keyword => ({ name: keyword })),
          },
          'Competition Difficulty': {
            number: opportunity.competitionDifficulty,
          },
          'Traffic Potential': {
            number: opportunity.trafficPotential,
          },
          'Generated At': {
            date: {
              start: opportunity.generatedAt.toISOString(),
            },
          },
        },
        children: [
          {
            object: 'block',
            type: 'heading_2',
            heading_2: {
              rich_text: [
                {
                  type: 'text',
                  text: {
                    content: 'Generated Content',
                  },
                },
              ],
            },
          },
          ...this.createContentBlocks(opportunity.content),
        ],
      });

      this.logger.log(`Successfully created opportunity with ID: ${response.id}`);
      return response.id;
    } catch (error) {
      this.logger.error(`Failed to create opportunity: ${error.message}`, error.stack);
      throw new Error(`Failed to create opportunity in Notion: ${error.message}`);
    }
  }

  async saveGeneratedContent(
    content: GeneratedContent,
    type: OpportunityRecord['type'],
    priorityScore: number,
    additionalData?: Record<string, any>
  ): Promise<string> {
    const opportunity: OpportunityRecord = {
      type,
      title: content.title,
      content: content.content,
      priorityScore,
      status: 'ready_to_publish',
      targetKeywords: content.targetKeywords,
      competitionDifficulty: 100 - content.qualityScore, // Inverse relationship
      trafficPotential: Math.floor(content.qualityScore * 1.2), // Estimate based on quality
      generatedAt: new Date(),
      additionalData,
    };

    return this.createOpportunity(opportunity);
  }

  async updateOpportunityStatus(pageId: string, status: OpportunityRecord['status']): Promise<void> {
    try {
      await this.notion.pages.update({
        page_id: pageId,
        properties: {
          'Status': {
            status: {
              name: status,
            },
          },
          ...(status === 'published' && {
            'Published At': {
              date: {
                start: new Date().toISOString(),
              },
            },
          }),
        },
      });

      this.logger.log(`Updated opportunity ${pageId} status to: ${status}`);
    } catch (error) {
      this.logger.error(`Failed to update opportunity status: ${error.message}`, error.stack);
      throw new Error(`Failed to update opportunity status: ${error.message}`);
    }
  }

  async getOpportunitiesByStatus(status: OpportunityRecord['status']): Promise<any[]> {
    try {
      const response = await this.notion.databases.query({
        database_id: this.databaseId,
        filter: {
          property: 'Status',
          select: {
            equals: status,
          },
        },
        sorts: [
          {
            property: 'Priority Score',
            direction: 'descending',
          },
        ],
      });

      return response.results;
    } catch (error) {
      this.logger.error(`Failed to query opportunities: ${error.message}`, error.stack);
      return [];
    }
  }

  async updatePerformanceData(
    pageId: string,
    performanceData: OpportunityRecord['performanceData']
  ): Promise<void> {
    try {
      const properties: any = {};

      if (performanceData?.impressions) {
        properties['Impressions'] = {
          number: performanceData.impressions,
        };
      }

      if (performanceData?.clicks) {
        properties['Clicks'] = {
          number: performanceData.clicks,
        };
      }

      if (performanceData?.avgPosition) {
        properties['Avg Position'] = {
          number: performanceData.avgPosition,
        };
      }

      if (performanceData?.backlinks) {
        properties['Backlinks'] = {
          number: performanceData.backlinks,
        };
      }

      await this.notion.pages.update({
        page_id: pageId,
        properties,
      });

      this.logger.log(`Updated performance data for opportunity: ${pageId}`);
    } catch (error) {
      this.logger.error(`Failed to update performance data: ${error.message}`, error.stack);
    }
  }

  async createWeeklyReport(reportData: {
    contentCreated: number;
    opportunitiesIdentified: number;
    rankingImprovements: number;
    trafficIncrease: number;
    topPerformingContent: string[];
    upcomingOpportunities: string[];
  }): Promise<string> {
    try {
      const response = await this.notion.pages.create({
        parent: {
          database_id: this.databaseId,
        },
        properties: {
          'Title': {
            title: [
              {
                text: {
                  content: `Weekly SEO Report - ${new Date().toISOString().split('T')[0]}`,
                },
              },
            ],
          },
          'Type': {
            select: {
              name: 'weekly_report',
            },
          },
          'Generated At': {
            date: {
              start: new Date().toISOString(),
            },
          },
        },
        children: [
          {
            object: 'block',
            type: 'heading_1',
            heading_1: {
              rich_text: [
                {
                  type: 'text',
                  text: {
                    content: '📊 Weekly SEO Execution Report',
                  },
                },
              ],
            },
          },
          {
            object: 'block',
            type: 'heading_2',
            heading_2: {
              rich_text: [
                {
                  type: 'text',
                  text: {
                    content: '✅ Content Execution Summary',
                  },
                },
              ],
            },
          },
          {
            object: 'block',
            type: 'bulleted_list_item',
            bulleted_list_item: {
              rich_text: [
                {
                  type: 'text',
                  text: {
                    content: `Generated ${reportData.contentCreated} high-quality pieces ready for publication`,
                  },
                },
              ],
            },
          },
          {
            object: 'block',
            type: 'bulleted_list_item',
            bulleted_list_item: {
              rich_text: [
                {
                  type: 'text',
                  text: {
                    content: `Identified ${reportData.opportunitiesIdentified} new opportunities`,
                  },
                },
              ],
            },
          },
          {
            object: 'block',
            type: 'bulleted_list_item',
            bulleted_list_item: {
              rich_text: [
                {
                  type: 'text',
                  text: {
                    content: `Tracked ${reportData.rankingImprovements} ranking improvements`,
                  },
                },
              ],
            },
          },
        ],
      });

      return response.id;
    } catch (error) {
      this.logger.error(`Failed to create weekly report: ${error.message}`, error.stack);
      throw new Error(`Failed to create weekly report: ${error.message}`);
    }
  }

  private async retryNotionRequest<T>(
    operation: () => Promise<T>,
    operationName: string,
    maxRetries: number = 3
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        this.logger.log(`${operationName} - Attempt ${attempt}/${maxRetries}`);
        return await operation();
      } catch (error) {
        lastError = error;
        this.logger.warn(`${operationName} - Attempt ${attempt} failed: ${error.message}`);

        if (attempt === maxRetries) {
          this.logger.error(`${operationName} - All ${maxRetries} attempts failed. Last error: ${error.message}`);
          break;
        }

        // Exponential backoff: 2s, 4s, 8s
        const delay = Math.pow(2, attempt) * 1000;
        this.logger.log(`${operationName} - Retrying in ${delay}ms...`);
        await this.sleep(delay);
      }
    }

    throw new Error(`${operationName} failed after ${maxRetries} attempts: ${lastError!.message}`);
  }

  async getExistingRedditOpportunities(): Promise<{ postId: string; title: string }[]> {
    try {
      const response = await this.notion.databases.query({
        database_id: this.databaseId,
        filter: {
          or: [
            {
              property: 'Title',
              title: {
                contains: '📅 Historical Reddit:'
              }
            },
            {
              property: 'Title',
              title: {
                contains: '🔥 Reddit:'
              }
            }
          ]
        }
      });

      return response.results.map((page: any) => {
        const title = page.properties.Title?.title?.[0]?.text?.content || '';
        // Extract Reddit post ID from URL if available in content
        const postId = this.extractPostIdFromTitle(title);
        return { postId, title };
      });
    } catch (error) {
      this.logger.error(`Failed to get existing Reddit opportunities: ${error.message}`);
      return [];
    }
  }

  private extractPostIdFromTitle(title: string): string {
    // Extract post ID from Reddit URLs in titles or return the title as fallback
    const match = title.match(/comments\/([a-zA-Z0-9]+)/);
    return match ? match[1] : title;
  }

  private createContentBlocks(content: string): any[] {
    const blocks: any[] = [];
    const maxCharsPerBlock = 1900; // Notion's limit per text block
    
    if (content.length <= maxCharsPerBlock) {
      // Content fits in one block
      blocks.push({
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [
            {
              type: 'text',
              text: {
                content: content,
              },
            },
          ],
        },
      });
    } else {
      // Split content into multiple blocks
      let remainingContent = content;
      let blockNumber = 1;
      
      while (remainingContent.length > 0) {
        let chunkEnd = Math.min(maxCharsPerBlock, remainingContent.length);
        
        // Try to break at a natural point (paragraph, sentence, or word boundary)
        if (chunkEnd < remainingContent.length) {
          const lastNewline = remainingContent.lastIndexOf('\n', chunkEnd);
          const lastPeriod = remainingContent.lastIndexOf('. ', chunkEnd);
          const lastSpace = remainingContent.lastIndexOf(' ', chunkEnd);
          
          if (lastNewline > chunkEnd - 200) {
            chunkEnd = lastNewline + 1;
          } else if (lastPeriod > chunkEnd - 200) {
            chunkEnd = lastPeriod + 2;
          } else if (lastSpace > chunkEnd - 100) {
            chunkEnd = lastSpace + 1;
          }
        }
        
        const chunk = remainingContent.substring(0, chunkEnd).trim();
        
        blocks.push({
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [
              {
                type: 'text',
                text: {
                  content: chunk,
                },
              },
            ],
          },
        });
        
        remainingContent = remainingContent.substring(chunkEnd).trim();
        blockNumber++;
      }
    }
    
    return blocks;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}