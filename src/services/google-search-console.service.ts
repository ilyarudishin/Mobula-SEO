import { Injectable, Logger } from '@nestjs/common';
import { google } from 'googleapis';
import { ConfigService } from '../config/config.service';

export interface SearchConsoleQuery {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface SearchConsolePage {
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface PerformanceData {
  queries: SearchConsoleQuery[];
  pages: SearchConsolePage[];
  totalClicks: number;
  totalImpressions: number;
  avgCTR: number;
  avgPosition: number;
}

@Injectable()
export class GoogleSearchConsoleService {
  private readonly logger = new Logger(GoogleSearchConsoleService.name);
  private readonly searchconsole: any;
  private readonly siteUrl: string;

  constructor(private configService: ConfigService) {
    const config = this.configService.config;
    
    // Initialize Google API client with flexible credential handling
    let authConfig: any = {
      scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
    };

    // Try environment variable first (for Railway deployment)
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64) {
      try {
        const credentialsJson = Buffer.from(process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64, 'base64').toString('utf8');
        const credentials = JSON.parse(credentialsJson);
        authConfig.credentials = credentials;
        this.logger.log('Using base64-encoded Google credentials from environment');
      } catch (error) {
        this.logger.error('Failed to parse base64 Google credentials', error.message);
      }
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS && process.env.GOOGLE_APPLICATION_CREDENTIALS.startsWith('{')) {
      try {
        authConfig.credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS);
        this.logger.log('Using JSON Google credentials from environment');
      } catch (error) {
        this.logger.error('Failed to parse JSON Google credentials', error.message);
      }
    } else if (config.google?.applicationCredentials) {
      authConfig.keyFile = config.google.applicationCredentials;
      this.logger.log('Using Google credentials from file path');
    } else {
      this.logger.warn('No Google Search Console credentials found. GSC features will be disabled.');
    }

    const auth = new google.auth.GoogleAuth(authConfig);
    this.searchconsole = google.searchconsole({ version: 'v1', auth });
    this.siteUrl = `sc-domain:${config.app.targetDomain}`;
  }

  async testConnection(): Promise<boolean> {
    try {
      const sites = await this.searchconsole.sites.list();
      
      this.logger.log('Google Search Console connection successful');
      this.logger.log(`Available sites: ${sites.data.siteEntry?.map((site: any) => site.siteUrl).join(', ')}`);
      
      // Check if our target site is available (try multiple formats)
      const targetDomain = this.configService.config.app.targetDomain;
      const possibleSiteUrls = [
        `sc-domain:${targetDomain}`,
        `https://${targetDomain}/`,
        `http://${targetDomain}/`,
        targetDomain
      ];

      const targetSite = sites.data.siteEntry?.find((site: any) => 
        possibleSiteUrls.includes(site.siteUrl) || 
        site.siteUrl.includes(targetDomain)
      );

      if (targetSite) {
        this.logger.log(`Target site found: ${targetSite.siteUrl} with permission level: ${targetSite.permissionLevel}`);
        // Update siteUrl to match what's actually in Search Console
        this.siteUrl = targetSite.siteUrl;
        return true;
      } else {
        this.logger.warn(`Target domain ${targetDomain} not found in Search Console.`);
        this.logger.warn(`Available sites: ${sites.data.siteEntry?.map((site: any) => site.siteUrl).join(', ') || 'None'}`);
        this.logger.warn('Make sure mobula.io is added to Search Console and service account has access.');
        return false;
      }
    } catch (error) {
      this.logger.error(`Google Search Console connection failed: ${error.message}`, error.stack);
      return false;
    }
  }

  async getPerformanceData(
    startDate: string, // Format: 'YYYY-MM-DD'
    endDate: string,
    dimensions: string[] = ['query'],
    rowLimit: number = 1000
  ): Promise<PerformanceData> {
    this.logger.log(`Getting GSC performance data from ${startDate} to ${endDate}`);

    try {
      const request = {
        siteUrl: this.siteUrl,
        requestBody: {
          startDate,
          endDate,
          dimensions,
          rowLimit,
          startRow: 0,
        },
      };

      const response = await this.searchconsole.searchanalytics.query(request);
      const rows = response.data.rows || [];

      // Process queries
      const queries: SearchConsoleQuery[] = [];
      const pages: SearchConsolePage[] = [];

      let totalClicks = 0;
      let totalImpressions = 0;
      let totalCTR = 0;
      let totalPosition = 0;

      rows.forEach((row: any) => {
        const clicks = row.clicks || 0;
        const impressions = row.impressions || 0;
        const ctr = row.ctr || 0;
        const position = row.position || 0;

        totalClicks += clicks;
        totalImpressions += impressions;
        totalCTR += ctr;
        totalPosition += position;

        if (dimensions.includes('query')) {
          queries.push({
            query: row.keys[0],
            clicks,
            impressions,
            ctr,
            position,
          });
        }

        if (dimensions.includes('page')) {
          const pageIndex = dimensions.indexOf('page');
          pages.push({
            page: row.keys[pageIndex],
            clicks,
            impressions,
            ctr,
            position,
          });
        }
      });

      const avgCTR = rows.length > 0 ? totalCTR / rows.length : 0;
      const avgPosition = rows.length > 0 ? totalPosition / rows.length : 0;

      this.logger.log(`Retrieved ${rows.length} performance records`);

      return {
        queries: queries.sort((a, b) => b.clicks - a.clicks),
        pages: pages.sort((a, b) => b.clicks - a.clicks),
        totalClicks,
        totalImpressions,
        avgCTR,
        avgPosition,
      };
    } catch (error) {
      this.logger.error(`Failed to get GSC performance data: ${error.message}`, error.stack);
      throw new Error(`Failed to get performance data: ${error.message}`);
    }
  }

  async getTopQueries(days: number = 30, limit: number = 50): Promise<SearchConsoleQuery[]> {
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const performanceData = await this.getPerformanceData(startDate, endDate, ['query'], limit);
    return performanceData.queries;
  }

  async getTopPages(days: number = 30, limit: number = 50): Promise<SearchConsolePage[]> {
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const performanceData = await this.getPerformanceData(startDate, endDate, ['page'], limit);
    return performanceData.pages;
  }

  async trackKeywordPositions(keywords: string[], days: number = 30): Promise<{
    keyword: string;
    avgPosition: number;
    clicks: number;
    impressions: number;
    ctr: number;
  }[]> {
    this.logger.log(`Tracking positions for ${keywords.length} keywords over ${days} days`);

    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    try {
      const performanceData = await this.getPerformanceData(startDate, endDate, ['query'], 1000);
      
      const keywordData = keywords.map(keyword => {
        const matchingQuery = performanceData.queries.find(q => 
          q.query.toLowerCase().includes(keyword.toLowerCase()) ||
          keyword.toLowerCase().includes(q.query.toLowerCase())
        );

        return {
          keyword,
          avgPosition: matchingQuery?.position || 0,
          clicks: matchingQuery?.clicks || 0,
          impressions: matchingQuery?.impressions || 0,
          ctr: matchingQuery?.ctr || 0,
        };
      });

      return keywordData.sort((a, b) => b.clicks - a.clicks);
    } catch (error) {
      this.logger.error(`Failed to track keyword positions: ${error.message}`, error.stack);
      return keywords.map(keyword => ({
        keyword,
        avgPosition: 0,
        clicks: 0,
        impressions: 0,
        ctr: 0,
      }));
    }
  }

  async getContentPerformance(urls: string[], days: number = 30): Promise<{
    url: string;
    clicks: number;
    impressions: number;
    ctr: number;
    avgPosition: number;
    topQueries: string[];
  }[]> {
    this.logger.log(`Getting performance data for ${urls.length} URLs`);

    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    try {
      const performanceData = await this.getPerformanceData(startDate, endDate, ['page', 'query'], 2000);
      
      const urlPerformance = urls.map(url => {
        const pageData = performanceData.pages.filter(p => p.page === url || p.page.includes(url));
        
        const totalClicks = pageData.reduce((sum, p) => sum + p.clicks, 0);
        const totalImpressions = pageData.reduce((sum, p) => sum + p.impressions, 0);
        const avgCTR = pageData.length > 0 ? pageData.reduce((sum, p) => sum + p.ctr, 0) / pageData.length : 0;
        const avgPosition = pageData.length > 0 ? pageData.reduce((sum, p) => sum + p.position, 0) / pageData.length : 0;

        // Get top queries for this URL (this would require a separate API call for full accuracy)
        const topQueries = performanceData.queries
          .slice(0, 5)
          .map(q => q.query);

        return {
          url,
          clicks: totalClicks,
          impressions: totalImpressions,
          ctr: avgCTR,
          avgPosition,
          topQueries,
        };
      });

      return urlPerformance.sort((a, b) => b.clicks - a.clicks);
    } catch (error) {
      this.logger.error(`Failed to get content performance: ${error.message}`, error.stack);
      return urls.map(url => ({
        url,
        clicks: 0,
        impressions: 0,
        ctr: 0,
        avgPosition: 0,
        topQueries: [],
      }));
    }
  }

  async getIndexingStatus(urls: string[]): Promise<{
    url: string;
    indexingState: string;
    lastCrawlTime?: string;
    pageFetchState?: string;
  }[]> {
    this.logger.log(`Checking indexing status for ${urls.length} URLs`);

    const results: {
      url: string;
      indexingState: string;
      lastCrawlTime?: string;
      pageFetchState?: string;
    }[] = [];

    for (const url of urls) {
      try {
        const response = await this.searchconsole.urlInspection.index.inspect({
          requestBody: {
            inspectionUrl: url,
            siteUrl: this.siteUrl,
          },
        });

        const result = response.data.inspectionResult;
        results.push({
          url,
          indexingState: result?.indexStatusResult?.indexingState || 'unknown',
          lastCrawlTime: result?.indexStatusResult?.lastCrawlTime,
          pageFetchState: result?.indexStatusResult?.pageFetchState,
        });

        // Rate limiting
        await this.sleep(1000);
      } catch (error) {
        this.logger.warn(`Failed to check indexing status for ${url}: ${error.message}`);
        results.push({
          url,
          indexingState: 'error',
          lastCrawlTime: undefined,
          pageFetchState: undefined,
        });
      }
    }

    return results;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}