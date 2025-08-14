import { Injectable, Logger } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { ConfigService } from '../config/config.service';

export interface ContentGenerationRequest {
  type: 'blog_article' | 'reddit_response' | 'outreach_email' | 'technical_guide';
  topic: string;
  keywords: string[];
  targetAudience: string;
  competitorAnalysis?: string;
  additionalContext?: string;
}

export interface GeneratedContent {
  title: string;
  content: string;
  metaDescription: string;
  tags: string[];
  qualityScore: number;
  wordCount: number;
  targetKeywords: string[];
}

@Injectable()
export class ClaudeService {
  private readonly logger = new Logger(ClaudeService.name);
  private readonly anthropic: Anthropic;

  constructor(private configService: ConfigService) {
    const config = this.configService.config;
    this.anthropic = new Anthropic({
      apiKey: config.claude.apiKey,
    });
  }

  async generateContent(request: ContentGenerationRequest): Promise<GeneratedContent> {
    this.logger.log(`Generating ${request.type} content for topic: ${request.topic}`);

    const systemPrompt = this.buildSystemPrompt(request.type);
    const userPrompt = this.buildUserPrompt(request);

    try {
      const message = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        temperature: 0.7,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      });

      const content = message.content[0];
      if (content.type === 'text') {
        return this.parseGeneratedContent(content.text, request);
      }

      throw new Error('Unexpected response format from Claude');
    } catch (error) {
      this.logger.error(`Failed to generate content: ${error.message}`, error.stack);
      throw new Error(`Content generation failed: ${error.message}`);
    }
  }

  private buildSystemPrompt(contentType: string): string {
    const basePrompt = `You are a Senior SEO Content Specialist creating high-quality, value-first content for Mobula.io, a blockchain data API platform.

MOBULA.IO CONTENT GUIDELINES - FOLLOW EXACTLY:

CORE PHILOSOPHY:
- Every piece must pass the "Would this rank without mentioning Mobula?" test
- Content stands on its own merit first
- Lead with genuine developer value, not promotion

CONTENT STRUCTURE REQUIREMENTS:
- Title: Include target keyword naturally, max 60 chars, add 2025 for freshness
- Introduction: Max 150 words, state problem immediately, include primary keyword in first 100 words
- Body: Minimum 1,500 words (2,500+ for pillar content), use H2/H3 structure
- Code examples in proper markdown blocks with language specification
- Include comparison tables for quick scanning
- Add bullet points for developer-friendly scanning

THE MOBULA INTEGRATION RULE:
- Mobula appears at 70-80% through the content
- Introduced as "one solution" not "the solution"
- Never use promotional language ("best", "revolutionary", "game-changing")
- Include specific use case or implementation example
- Always offer alternative solutions too

CONTENT TYPES & TARGETS:
- Technical Deep-Dives (40%): Architecture guides, performance analysis, infrastructure
- Comparison/Alternative Content (25%): Fair competitor analysis with pricing/features
- Problem-Solution Tutorials (25%): Start with developer problem, provide complete solution
- Industry Analysis (10%): Data-driven insights, original research

QUALITY REQUIREMENTS:
- Include working code examples that actually work
- Provide original insights/data when possible
- Natural keyword density (1-2%, not forced)
- Optimize for featured snippets with "Quick Answer" boxes
- Must be better than current top 3 results for target keyword

TECHNICAL ACCURACY:
- Use accurate blockchain/API terminology
- Include performance benchmarks when relevant
- Provide real-world implementation examples
- Address common edge cases and considerations

Mobula Context - CRYPTO/BLOCKCHAIN FOCUS ONLY:
- Blockchain & crypto data APIs (REST, GraphQL, WebSocket)
- Real-time crypto prices, token data, DeFi metrics across 300+ blockchains
- Serves crypto developers building: trading bots, DeFi protocols, crypto analytics, Web3 dApps
- Key crypto competitors: CoinGecko API, CoinMarketCap API, Moralis, Alchemy, The Graph
- NEVER mention generic data infrastructure - ALWAYS crypto/blockchain specific

Format your response as JSON with these fields:
{
  "title": "SEO-optimized title",
  "content": "Full content in markdown format",
  "metaDescription": "150-character meta description",
  "tags": ["tag1", "tag2", "tag3"],
  "qualityScore": 85,
  "targetKeywords": ["keyword1", "keyword2"]
}`;

    const typeSpecificPrompts = {
      blog_article: `\n\nContent Type: BLOG ARTICLE (Technical Deep-Dive or Problem-Solution Tutorial)
- Must be 1,500+ words (2,500+ for pillar content)
- Start with "Quick Answer" box for featured snippet targeting
- Structure: Problem → Solution → Implementation → Comparison → Conclusion
- Include working code examples in proper markdown blocks
- Add comparison tables with real data/benchmarks
- Mention Mobula at 70-80% through content as "one solution"
- Include original insights or data when possible
- End with "Next Steps" and relevant resources`,

      reddit_response: `\n\nContent Type: REDDIT ENGAGEMENT SUGGESTION
- Analyze the post and suggest manual engagement approach
- Identify specific problem/question being asked
- Recommend helpful technical response strategy
- Note how Mobula could help (if relevant)
- Suggest code examples or resources to share
- Keep suggestions authentic and community-focused
- Mark as "MANUAL ENGAGEMENT OPPORTUNITY"`,

      outreach_email: `\n\nContent Type: OUTREACH EMAIL
- Lead with specific value (not generic pitch)
- Reference their content/work specifically
- Offer genuine help or resource first
- Keep under 200 words total
- Professional but personal tone
- Clear, low-pressure call-to-action`,

      technical_guide: `\n\nContent Type: TECHNICAL GUIDE (Architecture/Infrastructure Focus)
- Minimum 2,000 words with deep technical detail
- Include architecture diagrams (describe in text)
- Performance benchmarks and real-world data
- Code examples for multiple languages/frameworks
- Cover edge cases and production considerations
- Compare different approaches objectively
- Mobula appears as technical implementation option`,
    };

    return basePrompt + (typeSpecificPrompts[contentType] || '');
  }

  private buildUserPrompt(request: ContentGenerationRequest): string {
    const contentInstructions = this.getContentTypeSpecificInstructions(request.type);
    
    return `Write complete, finished, ready-to-publish ${request.type} content about: "${request.topic}"

TARGET KEYWORDS: ${request.keywords.join(', ')}
AUDIENCE: ${request.targetAudience}
${request.competitorAnalysis ? `COMPETITOR GAPS: ${request.competitorAnalysis}` : ''}
${request.additionalContext ? `CONTEXT: ${request.additionalContext}` : ''}

${contentInstructions}

MOBULA INTEGRATION (CRYPTO CONTEXT REQUIRED):
- ONLY mention Mobula for crypto/blockchain API use cases
- Mention naturally at 70-80% through content as "one crypto data solution"
- Include specific crypto API code example (token prices, DeFi data, etc.)
- Always suggest crypto-specific alternatives (CoinGecko, Moralis, The Graph)
- NO generic data infrastructure mentions - CRYPTO ONLY

RESPONSE FORMAT - CRITICAL:
Return ONLY valid JSON. No markdown blocks, no explanations, no extra text.
IMPORTANT: Escape all newlines as \\n, tabs as \\t, quotes as \\" in string values.

{
  "title": "SEO-optimized title with primary keyword",
  "content": "Complete finished content ready to publish. Use \\n for line breaks.",
  "metaDescription": "150-character description", 
  "tags": ["keyword1", "keyword2", "keyword3"],
  "qualityScore": 85,
  "targetKeywords": ["primary", "secondary", "related"]
}

Your entire response must be parseable by JSON.parse() - test this mentally before responding.`;
  }

  private getContentTypeSpecificInstructions(type: string): string {
    switch (type) {
      case 'blog_article':
        return `Write a 2000+ word comprehensive blog article:
- Start with compelling hook and problem statement
- Use H2/H3 structure for easy scanning  
- Include 2-3 working code examples
- Add comparison table if relevant
- End with actionable next steps
- Write as if for publication on Mobula's blog`;

      case 'reddit_response':
        return `Write a helpful Reddit comment response (300-500 words):
- Address the specific question/problem directly
- Provide practical, actionable advice
- Include code examples or resources
- Be authentic and community-focused
- Suggest multiple solutions, not just Mobula
- Write as if you're genuinely helping another developer`;

      case 'outreach_email':
        return `Write a professional outreach email (150-200 words):
- Specific subject line
- Reference their work/content specifically  
- Lead with genuine value offer
- Clear but low-pressure call-to-action
- Professional but personal tone`;

      case 'technical_guide':
        return `Write an in-depth technical guide (2500+ words):
- Include architecture overview
- Step-by-step implementation
- Performance considerations
- Common pitfalls and solutions
- Real-world examples and benchmarks`;

      default:
        return 'Write comprehensive, helpful content that solves real problems.';
    }
  }

  private parseGeneratedContent(text: string, request: ContentGenerationRequest): GeneratedContent {
    try {
      // Extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      let parsed;
      try {
        // Clean up the JSON string to handle control characters
        let jsonText = jsonMatch[0];
        
        // Log the problematic JSON for debugging
        this.logger.debug(`Raw JSON from Claude: ${jsonText.substring(0, 200)}...`);
        
        // Only fix control characters that break JSON parsing
        jsonText = jsonText.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '');
          
        // Try a more robust approach - extract JSON properties manually
        if (jsonText.includes('Bad control character') || jsonText.includes('\\u')) {
          this.logger.warn('Complex JSON detected, using manual extraction');
          
          // Extract title
          const titleMatch = jsonText.match(/"title":\s*"([^"]*?)"/);
          const contentMatch = jsonText.match(/"content":\s*"([\s\S]*?)",\s*"metaDescription"/);
          const metaMatch = jsonText.match(/"metaDescription":\s*"([^"]*?)"/);
          const tagsMatch = jsonText.match(/"tags":\s*\[(.*?)\]/);
          const scoreMatch = jsonText.match(/"qualityScore":\s*(\d+)/);
          const keywordsMatch = jsonText.match(/"targetKeywords":\s*\[(.*?)\]/);
          
          if (titleMatch && contentMatch) {
            parsed = {
              title: titleMatch[1] || request.topic,
              content: contentMatch[1] || 'Content generated successfully',
              metaDescription: metaMatch?.[1] || `${request.topic} - comprehensive guide`,
              tags: tagsMatch?.[1]?.split(',').map(t => t.trim().replace(/"/g, '')) || request.keywords.slice(0, 5),
              qualityScore: parseInt(scoreMatch?.[1] || '75') || 75,
              targetKeywords: keywordsMatch?.[1]?.split(',').map(t => t.trim().replace(/"/g, '')) || request.keywords
            };
          } else {
            throw new Error('Could not extract content from malformed JSON');
          }
        } else {
          parsed = JSON.parse(jsonText);
        }
      } catch (jsonError) {
        this.logger.error(`Failed to parse generated content: ${jsonError.message}`);
        this.logger.error(`Problematic JSON: ${jsonMatch[0].substring(0, 500)}`);
        
        // Fallback: Create structured content from the raw text
        const title = this.extractTitleFromText(text, request.topic);
        const content = this.extractContentFromText(text);
        
        return {
          title,
          content,
          metaDescription: `${title.substring(0, 140)}...`,
          tags: request.keywords.slice(0, 5),
          qualityScore: 75, // Default quality score for fallback
          wordCount: content.split(/\s+/).length,
          targetKeywords: request.keywords,
        };
      }

      parsed = parsed;
      
      // Validate required fields
      if (!parsed.title || !parsed.content) {
        throw new Error('Missing required fields in generated content');
      }

      // Calculate word count
      const wordCount = parsed.content.split(/\s+/).length;

      // Ensure quality score is reasonable
      const qualityScore = Math.max(60, Math.min(100, parsed.qualityScore || 75));

      return {
        title: parsed.title,
        content: parsed.content,
        metaDescription: parsed.metaDescription || parsed.title.substring(0, 150),
        tags: parsed.tags || request.keywords.slice(0, 5),
        qualityScore,
        wordCount,
        targetKeywords: parsed.targetKeywords || request.keywords,
      };
    } catch (error) {
      this.logger.error(`Failed to parse generated content: ${error.message}`);
      
      // Fallback: treat entire response as content
      return {
        title: request.topic,
        content: text,
        metaDescription: `${request.topic} - comprehensive guide`,
        tags: request.keywords.slice(0, 5),
        qualityScore: 70,
        wordCount: text.split(/\s+/).length,
        targetKeywords: request.keywords,
      };
    }
  }

  private extractTitleFromText(text: string, topic: string): string {
    // Try to find a title in the text
    const titleMatch = text.match(/(?:title[:\s]*["']?([^"'\n]+)["']?|^#\s*(.+))/im);
    if (titleMatch) {
      return titleMatch[1] || titleMatch[2];
    }
    // Fallback to topic-based title
    return `${topic} - Comprehensive Guide 2025`;
  }

  private extractContentFromText(text: string): string {
    // Remove JSON artifacts and clean up the text
    const cleaned = text
      .replace(/\{[\s\S]*?\}/g, '') // Remove JSON blocks
      .replace(/```json[\s\S]*?```/g, '') // Remove JSON code blocks
      .replace(/^[#\s]*title[:\s]*.*$/gim, '') // Remove title lines
      .replace(/^\s*[\{\}]\s*$/gm, '') // Remove standalone braces
      .trim();
    
    return cleaned || 'Content generated successfully. Please review in Notion for full details.';
  }
}