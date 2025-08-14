import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '../config/config.service';
import OpenAI from 'openai';

export interface OpenAIGenerationRequest {
  type: 'reddit_response' | 'blog_article' | 'outreach_email' | 'technical_guide';
  topic: string;
  keywords: string[];
  targetAudience: string;
  additionalContext?: string;
  competitorAnalysis?: string;
}

export interface OpenAIGeneratedContent {
  title: string;
  content: string;
  targetKeywords: string[];
  qualityScore: number;
  wordCount: number;
  metaDescription: string;
  tags: string[];
}

@Injectable()
export class OpenAIService {
  private readonly logger = new Logger(OpenAIService.name);
  private readonly openai: OpenAI;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.config.openai?.apiKey;
    if (!apiKey) {
      this.logger.warn('OpenAI API key not configured - GPT features will be disabled');
      return;
    }

    this.openai = new OpenAI({
      apiKey: apiKey,
    });

    this.logger.log('OpenAI service initialized');
  }

  async generateContent(request: OpenAIGenerationRequest): Promise<OpenAIGeneratedContent> {
    if (!this.openai) {
      throw new Error('OpenAI service not properly initialized - API key missing');
    }

    this.logger.log(`Generating ${request.type} content for: ${request.topic}`);

    try {
      const prompt = this.buildPrompt(request);
      
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful AI assistant that creates high-quality content for blockchain developers. Always provide actionable, technical content that genuinely helps developers.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.7,
      });

      const generatedText = completion.choices[0]?.message?.content || '';
      
      if (!generatedText) {
        throw new Error('OpenAI returned empty content');
      }

      return this.parseGeneratedContent(generatedText, request);

    } catch (error: any) {
      this.logger.error(`OpenAI content generation failed: ${error.message}`);
      
      // Check for specific error types
      if (error.message?.includes('insufficient_quota') || error.message?.includes('rate_limit')) {
        throw new Error('OpenAI API quota exceeded or rate limited');
      }
      
      throw new Error(`OpenAI generation failed: ${error.message}`);
    }
  }

  private buildPrompt(request: OpenAIGenerationRequest): string {
    const baseContext = `
Target Audience: ${request.targetAudience}
Keywords to include: ${request.keywords.join(', ')}
Topic: ${request.topic}
${request.additionalContext ? `Additional Context: ${request.additionalContext}` : ''}
${request.competitorAnalysis ? `Competitor Analysis: ${request.competitorAnalysis}` : ''}
`;

    switch (request.type) {
      case 'reddit_response':
        return `${baseContext}

Create a helpful Reddit response that:
1. Directly answers the technical question
2. Provides practical code examples or step-by-step guidance  
3. Mentions relevant blockchain APIs naturally (only if truly helpful)
4. Is genuinely helpful, not promotional
5. Uses a friendly, developer-to-developer tone

Format: Just return the Reddit response content, no extra formatting.`;

      case 'blog_article':
        return `${baseContext}

Create a comprehensive blog article that:
1. Provides deep technical insights for blockchain developers
2. Includes working code examples
3. Covers real-world implementation challenges
4. Mentions Mobula's APIs naturally where relevant
5. Is 1500+ words with clear sections

Format: Return title, content, meta description, and relevant tags.`;

      case 'technical_guide':
        return `${baseContext}

Create a detailed technical guide that:
1. Provides step-by-step implementation instructions
2. Includes complete code examples
3. Covers error handling and best practices
4. Addresses common developer pain points
5. Mentions relevant APIs and tools

Format: Return comprehensive guide with title and structured content.`;

      default:
        return `${baseContext}

Create helpful content about this topic for blockchain developers.`;
    }
  }

  private parseGeneratedContent(content: string, request: OpenAIGenerationRequest): OpenAIGeneratedContent {
    // For Reddit responses, return simple format
    if (request.type === 'reddit_response') {
      return {
        title: `Reddit Response: ${request.topic}`,
        content: content.trim(),
        targetKeywords: request.keywords,
        qualityScore: 85, // GPT-4 generally produces good quality
        wordCount: content.split(' ').length,
        metaDescription: content.substring(0, 150) + '...',
        tags: ['reddit', 'gpt', ...request.keywords],
      };
    }

    // For articles, try to parse structure or use as-is
    const lines = content.split('\n').filter(line => line.trim());
    let title = `${request.topic} - Technical Guide`;
    let articleContent = content;

    // Try to extract title if it looks like one
    if (lines[0] && (lines[0].includes('#') || lines[0].length < 100)) {
      title = lines[0].replace(/^#+\s*/, '').trim();
      articleContent = lines.slice(1).join('\n');
    }

    return {
      title,
      content: articleContent,
      targetKeywords: request.keywords,
      qualityScore: 85,
      wordCount: articleContent.split(' ').length,
      metaDescription: articleContent.substring(0, 150) + '...',
      tags: ['technical', 'gpt', ...request.keywords],
    };
  }

  async testConnection(): Promise<boolean> {
    if (!this.openai) {
      return false;
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Test' }],
        max_tokens: 5,
      });

      return !!response.choices[0]?.message?.content;
    } catch (error) {
      this.logger.error(`OpenAI connection test failed: ${error}`);
      return false;
    }
  }
}