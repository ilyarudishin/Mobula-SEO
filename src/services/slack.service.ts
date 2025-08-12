import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { ConfigService } from '../config/config.service';

export interface SlackNotification {
  type: 'content_generated' | 'opportunities_found' | 'performance_update' | 'weekly_report' | 'error';
  title: string;
  message: string;
  data?: Record<string, any>;
  urgent?: boolean;
}

@Injectable()
export class SlackService {
  private readonly logger = new Logger(SlackService.name);
  private readonly webhookUrl: string;

  constructor(private configService: ConfigService) {
    const config = this.configService.config;
    this.webhookUrl = config.slack.webhookUrl;
  }

  async sendNotification(notification: SlackNotification): Promise<void> {
    this.logger.log(`Sending Slack notification: ${notification.type}`);

    if (!this.webhookUrl || this.webhookUrl === 'test_webhook') {
      this.logger.warn('Slack webhook not configured, skipping notification');
      return;
    }

    try {
      const payload = this.formatNotification(notification);
      
      await axios.post(this.webhookUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });

      this.logger.log(`Successfully sent Slack notification: ${notification.type}`);
    } catch (error) {
      this.logger.error(`Failed to send Slack notification: ${error.message}`, error.stack);
      // Don't throw error - notifications should not break the main flow
    }
  }

  async sendContentGeneratedAlert(content: {
    title: string;
    type: string;
    qualityScore: number;
    wordCount: number;
    notionPageId: string;
  }): Promise<void> {
    await this.sendNotification({
      type: 'content_generated',
      title: '🚀 New Content Generated',
      message: `Generated ${content.type}: "${content.title}" (Quality: ${content.qualityScore}/100) → Ready in Notion`,
      // Only include Notion URL for easy access, no detailed data dump
      data: {
        notionUrl: `https://notion.so/${content.notionPageId.replace(/-/g, '')}`,
      },
    });
  }

  async sendOpportunitiesFoundAlert(opportunities: {
    count: number;
    topOpportunity: string;
    averageScore: number;
  }): Promise<void> {
    // Check if the opportunity contains a URL and format accordingly
    const isRedditPost = opportunities.topOpportunity.includes('reddit.com');
    const message = isRedditPost 
      ? `🔍 Found ${opportunities.count} new Reddit engagement opportunities. Top post: ${opportunities.topOpportunity} (Avg Score: ${Math.round(opportunities.averageScore)}/100) → Review manually in Notion`
      : `Found ${opportunities.count} new opportunities. Top: "${opportunities.topOpportunity}" (Avg Score: ${Math.round(opportunities.averageScore)}/100) → Details in Notion`;

    await this.sendNotification({
      type: 'opportunities_found',
      title: '🎯 New SEO Opportunities Identified',
      message: message,
      // No detailed data in Slack - just the summary message with link
    });
  }

  async sendPerformanceUpdate(performance: {
    totalContent: number;
    avgPosition: number;
    totalClicks: number;
    improvementCount: number;
  }): Promise<void> {
    await this.sendNotification({
      type: 'performance_update',
      title: '📊 Performance Update',
      message: `Tracking ${performance.totalContent} pieces of content. Avg position: ${performance.avgPosition}, ${performance.totalClicks} clicks, ${performance.improvementCount} improvements → Full metrics in Notion`,
      // No detailed metrics dump in Slack - just summary
    });
  }

  async sendWeeklyReport(report: {
    contentCreated: number;
    opportunitiesFound: number;
    rankingImprovements: number;
    trafficIncrease: number;
  }): Promise<void> {
    await this.sendNotification({
      type: 'weekly_report',
      title: '📈 Weekly SEO Execution Report',
      message: `Week Summary: ${report.contentCreated} content pieces created, ${report.opportunitiesFound} opportunities found, ${report.rankingImprovements} ranking improvements, ${report.trafficIncrease}% traffic increase → Full report in Notion`,
      // No data dump - all details are in Notion weekly report
    });
  }

  async sendErrorAlert(error: {
    type: string;
    message: string;
    service: string;
  }): Promise<void> {
    await this.sendNotification({
      type: 'error',
      title: '🚨 SEO Agent Error',
      message: `${error.service}: ${error.message}`,
      // Keep error alerts minimal - no extra data
      urgent: true,
    });
  }

  private formatNotification(notification: SlackNotification): any {
    const color = this.getNotificationColor(notification.type, notification.urgent);
    
    const attachment: any = {
      color: color,
      title: notification.title,
      text: notification.message,
      footer: 'Mobula SEO Agent',
      ts: Math.floor(Date.now() / 1000),
    };

    // Add fields for data if present
    if (notification.data) {
      attachment.fields = Object.entries(notification.data).map(([key, value]) => ({
        title: this.formatFieldTitle(key),
        value: this.formatFieldValue(value),
        short: true,
      }));
    }

    return {
      text: notification.urgent ? `<!channel> ${notification.title}` : notification.title,
      attachments: [attachment],
    };
  }

  private getNotificationColor(type: SlackNotification['type'], urgent?: boolean): string {
    if (urgent) return '#ff0000'; // Red for urgent

    switch (type) {
      case 'content_generated':
        return '#36a64f'; // Green
      case 'opportunities_found':
        return '#0099cc'; // Blue
      case 'performance_update':
        return '#ff9900'; // Orange
      case 'weekly_report':
        return '#9932cc'; // Purple
      case 'error':
        return '#ff0000'; // Red
      default:
        return '#cccccc'; // Gray
    }
  }

  private formatFieldTitle(key: string): string {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .replace(/_/g, ' ');
  }

  private formatFieldValue(value: any): string {
    if (typeof value === 'number') {
      return value.toLocaleString();
    }
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    return String(value);
  }
}