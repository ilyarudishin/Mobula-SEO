import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';

export interface ApiConfig {
  claude: {
    apiKey: string;
  };
  notion: {
    apiKey: string;
    databaseId: string;
  };
  slack: {
    webhookUrl: string;
  };
  dataForSeo: {
    login: string;
    password: string;
  };
  serpApi: {
    key: string;
  };
  google: {
    applicationCredentials: string;
  };
  reddit: {
    clientId: string;
    clientSecret: string;
    username: string;
    password: string;
  };
  database: {
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
  };
  redis: {
    host: string;
    port: number;
    password?: string;
  };
  app: {
    port: number;
    nodeEnv: string;
    targetDomain: string;
  };
}

@Injectable()
export class ConfigService {
  constructor(private nestConfigService: NestConfigService) {}

  get config(): ApiConfig {
    return {
      claude: {
        apiKey: this.nestConfigService.get<string>('CLAUDE_API_KEY', ''),
      },
      notion: {
        apiKey: this.nestConfigService.get<string>('NOTION_API_KEY', ''),
        databaseId: this.nestConfigService.get<string>('NOTION_DATABASE_ID', ''),
      },
      slack: {
        webhookUrl: this.nestConfigService.get<string>('SLACK_WEBHOOK_URL', ''),
      },
      dataForSeo: {
        login: this.nestConfigService.get<string>('DATAFORSEO_LOGIN', ''),
        password: this.nestConfigService.get<string>('DATAFORSEO_PASSWORD', ''),
      },
      serpApi: {
        key: this.nestConfigService.get<string>('SERPAPI_KEY', ''),
      },
      google: {
        applicationCredentials: this.nestConfigService.get<string>('GOOGLE_APPLICATION_CREDENTIALS', ''),
      },
      reddit: {
        clientId: this.nestConfigService.get<string>('REDDIT_CLIENT_ID', ''),
        clientSecret: this.nestConfigService.get<string>('REDDIT_CLIENT_SECRET', ''),
        username: this.nestConfigService.get<string>('REDDIT_USERNAME', ''),
        password: this.nestConfigService.get<string>('REDDIT_PASSWORD', ''),
      },
      database: {
        host: this.nestConfigService.get<string>('DATABASE_HOST', 'localhost'),
        port: this.nestConfigService.get<number>('DATABASE_PORT', 5432),
        username: this.nestConfigService.get<string>('DATABASE_USERNAME', 'postgres'),
        password: this.nestConfigService.get<string>('DATABASE_PASSWORD', 'postgres'),
        database: this.nestConfigService.get<string>('DATABASE_NAME', 'seo_agent'),
      },
      redis: {
        host: this.nestConfigService.get<string>('REDIS_HOST', 'localhost'),
        port: this.nestConfigService.get<number>('REDIS_PORT', 6379),
        password: this.nestConfigService.get<string>('REDIS_PASSWORD', ''),
      },
      app: {
        port: this.nestConfigService.get<number>('PORT', 8080),
        nodeEnv: this.nestConfigService.get<string>('NODE_ENV', 'development'),
        targetDomain: this.nestConfigService.get<string>('TARGET_DOMAIN', 'mobula.io'),
      },
    };
  }

  get isProduction(): boolean {
    return this.config.app.nodeEnv === 'production';
  }

  get isDevelopment(): boolean {
    return this.config.app.nodeEnv === 'development';
  }
}