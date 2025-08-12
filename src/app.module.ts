import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './config/config.module';
import { SeoOrchestratorService } from './orchestrator/seo-orchestrator.service';
import { ClaudeService } from './services/claude.service';
import { NotionService } from './services/notion.service';
import { SlackService } from './services/slack.service';
import { SerpService } from './services/serp.service';
import { DataForSeoService } from './services/dataforseo.service';
import { GoogleSearchConsoleService } from './services/google-search-console.service';
import { RedditDiscoveryService } from './services/reddit-discovery.service';
import { BlogDiscoveryService } from './services/blog-discovery.service';
import { SocialListeningService } from './services/social-listening.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    SeoOrchestratorService,
    ClaudeService,
    NotionService,
    SlackService,
    SerpService,
    DataForSeoService,
    GoogleSearchConsoleService,
    RedditDiscoveryService,
    BlogDiscoveryService,
    SocialListeningService,
  ],
})
export class AppModule {}
