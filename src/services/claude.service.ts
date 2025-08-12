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

Mobula Context:
- Low-latency blockchain APIs (REST, GraphQL, WebSocket)
- Covers 300+ blockchains with real-time data
- Serves developers building trading terminals, DeFi protocols, analytics platforms
- Key competitors: Alchemy, Codex, Goldsky

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
    return `Create ${request.type} content following Mobula's SEO-first guidelines:

PRIMARY KEYWORD: ${request.keywords[0]}
SECONDARY KEYWORDS: ${request.keywords.slice(1).join(', ')}
TARGET AUDIENCE: ${request.targetAudience}
TOPIC FOCUS: ${request.topic}

${request.competitorAnalysis ? `CONTENT GAPS TO FILL: ${request.competitorAnalysis}` : ''}
${request.additionalContext ? `ADDITIONAL CONTEXT: ${request.additionalContext}` : ''}

CRITICAL SUCCESS CRITERIA:
✅ Would this rank without mentioning Mobula? (Must be YES)
✅ Is this 3x better than top 3 current results?
✅ Would a developer bookmark this for future reference?
✅ Does it solve a real problem comprehensively?
✅ Includes working code examples that actually work?
✅ Natural keyword integration (1-2% density)?
✅ Optimized for featured snippets?

MOBULA INTEGRATION REQUIREMENTS:
- Appear at 70-80% through content
- Introduced as "one solution" among alternatives
- Include specific technical implementation example
- NO promotional language ("best", "revolutionary", etc.)
- Provide alternative solutions alongside Mobula

Remember: Content quality and developer value first, SEO optimization second, Mobula mention last.`;
  }

  private parseGeneratedContent(text: string, request: ContentGenerationRequest): GeneratedContent {
    try {
      // Extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
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
}