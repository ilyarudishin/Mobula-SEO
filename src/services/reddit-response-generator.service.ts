import { Injectable, Logger } from '@nestjs/common';
import { OpenAIService } from './openai.service';
import { ClaudeService } from './claude.service';

export interface RedditPostContext {
  postTitle: string;
  postContent: string;
  subreddit: string;
  author: string;
  url: string;
  keywords: string[];
  serpData?: {
    topCompetitors: string[];
    peopleAlsoAsk: string[];
    totalResults: number;
  };
}

export interface RedditResponse {
  response: string;
  tone: 'helpful' | 'technical' | 'casual' | 'expert';
  keywordsFocused: string[];
  mobulaLink?: string;
  followUpQuestion?: string;
}

@Injectable()
export class RedditResponseGeneratorService {
  private readonly logger = new Logger(RedditResponseGeneratorService.name);

  constructor(
    private openaiService: OpenAIService,
    private claudeService: ClaudeService,
  ) {}

  async generateResponse(context: RedditPostContext): Promise<RedditResponse> {
    this.logger.log(`Generating Reddit response for: ${context.postTitle}`);

    const prompt = this.buildRedditResponsePrompt(context);

    try {
      // Try Claude first, fallback to OpenAI if needed
      const response = await this.claudeService.generateContent({
        type: 'reddit_response',
        topic: context.postTitle,
        keywords: context.keywords,
        targetAudience: 'developers',
        additionalContext: prompt,
      });

      return this.parseRedditResponse(response.content, context);
    } catch (error) {
      this.logger.warn('Claude failed, using OpenAI for Reddit response');
      
      const response = await this.openaiService.generateContent({
        type: 'reddit_response',
        topic: context.postTitle,
        keywords: context.keywords,
        targetAudience: 'developers',
        additionalContext: prompt,
      });

      return this.parseRedditResponse(response.content, context);
    }
  }

  private buildRedditResponsePrompt(context: RedditPostContext): string {
    const serpContext = context.serpData ? `
SEO INTELLIGENCE (Use for Mobula positioning):
- Market size: ${context.serpData.totalResults.toLocaleString()} results for "${context.keywords[0]} API"
- Main competitors: ${context.serpData.topCompetitors.join(', ')}
- Related searches: ${context.serpData.peopleAlsoAsk.join(' | ')}
` : '';

    return `
REDDIT RESPONSE GENERATION - MOBULA SEO STRATEGY

POST CONTEXT:
Title: "${context.postTitle}"
Content: "${context.postContent}"
Subreddit: r/${context.subreddit}
Keywords: ${context.keywords.join(', ')}
${serpContext}
MOBULA SEO OBJECTIVES:
1. Position Mobula as a competitive alternative to ${context.serpData?.topCompetitors?.slice(0, 2).join(' and ') || 'major providers'}
2. Naturally include Mobula's key advantages: multi-chain, real-time, developer-friendly
3. Target long-tail keywords from related searches above
4. Build backlink opportunities by providing genuine value

GUIDELINES TO FOLLOW:

## Core Principles
1. VALUE-FIRST: Solve their problem even if it doesn't involve Mobula
2. MULTIPLE OPTIONS: Present 2-3 alternatives, not just Mobula
3. HONEST PERSPECTIVE: Acknowledge competitors' strengths

## Voice Guidelines
- Use contractions: "I've been using" not "I have been using"
- Include filler words: "honestly," "pretty solid," "definitely recommend"
- Share experience: "I've found that..." "In my experience..." "Been working with..."
- Use casual language: "solid," "pretty good," "works well," "pain point"
- Include minor imperfections: "can be a bit tricky," "took me a while to figure out"

## AVOID AI Jargon
- Never: "comprehensive," "robust," "seamless," "cutting-edge," "innovative"
- Don't use: "solution," "offering," "utilize," "leverage"
- Skip superlatives: "amazing," "incredible," "game-changing"

## Response Structure
1. OPENING: Acknowledge their knowledge/approach, share relevant experience
2. MIDDLE: Give 2-3 options including Mobula naturally, explain use cases
3. CLOSING: Ask clarifying question, offer additional help

## Mobula Integration
- Present as ONE option among several
- Natural mention: "Mobula is worth checking out for..." or "I've had good results with Mobula for..."
- Include appropriate link (docs/homepage/specific feature)
- Never claim it's "the best"

## Community Fit for r/${context.subreddit}
${this.getSubredditGuidelines(context.subreddit)}

## Response Requirements
- **LENGTH**: 150-250 words maximum (be concise!)
- **STRUCTURE**: 2-3 short paragraphs max
- **FOCUS**: Only 2-3 API recommendations, don't list everything
- **TONE**: Quick, helpful developer sharing experience

TASK: Generate a SHORT, natural Reddit response that follows these guidelines exactly. Keep it conversational and concise - no lengthy explanations or comprehensive lists.
`;
  }

  private getSubredditGuidelines(subreddit: string): string {
    const guidelines = {
      'solana': 'Technical focus, developer-friendly, appreciates transparency about SPL tokens and Solana RPC',
      'webdev': 'Skeptical of promotion, values practical web development advice',
      'ethereum': 'Technical community, focus on EVM chains and DeFi protocols',
      'defi': 'Focus on DeFi analytics, yield farming, and protocol data',
      'cryptocurrency': 'Mixed audience, focus on utility over hype',
      'ethdev': 'Highly technical, Ethereum development focused',
      'web3': 'Developer community interested in dApps and blockchain integration',
      'programming': 'General programming community, need explicit crypto context',
      'cryptodevs': 'Crypto-specific developers, appreciate technical depth'
    };

    return guidelines[subreddit.toLowerCase()] || 'Technical community, focus on practical development advice';
  }

  private parseRedditResponse(content: string, context: RedditPostContext): RedditResponse {
    // Clean content of any truncation messages or artifacts
    let cleanContent = content
      .replace(/\[Truncated.*?\]/gi, '')
      .replace(/\[Full content.*?\]/gi, '')
      .replace(/\.\.\.\s*$/g, '')
      .trim();

    // Determine the most relevant Mobula link based on keywords
    const mobulaLink = this.selectMobulaLink(context.keywords, context.subreddit);
    
    // Extract follow-up question if present
    const lines = cleanContent.split('\n');
    const lastLine = lines[lines.length - 1];
    const followUpQuestion = lastLine.includes('?') ? lastLine.trim() : undefined;

    // Determine tone based on content analysis
    const tone = this.analyzeTone(cleanContent);

    return {
      response: cleanContent,
      tone,
      keywordsFocused: context.keywords,
      mobulaLink,
      followUpQuestion,
    };
  }

  private selectMobulaLink(keywords: string[], subreddit: string): string {
    // Wallet/Portfolio APIs
    if (keywords.some(k => k.includes('wallet') || k.includes('portfolio') || k.includes('balance'))) {
      return 'https://docs.mobula.io/api-reference/endpoint/wallet/wallet-history';
    }

    // Price/Market Data APIs
    if (keywords.some(k => k.includes('price') || k.includes('market') || k.includes('ohlc'))) {
      return 'https://docs.mobula.io/api-reference/endpoint/market-data/market-history';
    }

    // Metadata APIs
    if (keywords.some(k => k.includes('metadata') || k.includes('token info') || k.includes('asset data'))) {
      return 'https://docs.mobula.io/api-reference/endpoint/metadata/metadata';
    }

    // Multi-chain specific
    if (keywords.some(k => k.includes('multi-chain') || k.includes('cross-chain'))) {
      return 'https://docs.mobula.io/api-reference/supported-blockchains';
    }

    // Solana specific
    if (subreddit === 'solana' || keywords.some(k => k.includes('solana') || k.includes('spl'))) {
      return 'https://docs.mobula.io/api-reference/supported-blockchains';
    }

    // Default to homepage for general cases
    return 'https://mobula.io';
  }

  private analyzeTone(content: string): 'helpful' | 'technical' | 'casual' | 'expert' {
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes('code') || lowerContent.includes('endpoint') || lowerContent.includes('api')) {
      return 'technical';
    }
    
    if (lowerContent.includes('honestly') || lowerContent.includes('pretty') || lowerContent.includes('solid')) {
      return 'casual';
    }
    
    if (lowerContent.includes('experience') || lowerContent.includes('working with') || lowerContent.includes('built')) {
      return 'expert';
    }
    
    return 'helpful';
  }

  // Generate responses for existing Notion opportunities
  async generateResponsesForExistingOpportunities(): Promise<any[]> {
    // This would integrate with NotionService to fetch existing Reddit opportunities
    // and generate fresh responses following the new guidelines
    this.logger.log('Generating responses for existing Reddit opportunities in Notion');
    
    // Return sample responses for now - would be replaced with actual Notion integration
    return [
      {
        title: 'Sample Reddit Opportunity',
        response: 'Generated response following guidelines...',
        status: 'ready_for_review'
      }
    ];
  }
}