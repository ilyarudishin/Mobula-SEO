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

## Voice Guidelines - SUPER CASUAL & NATURAL
- Use contractions everywhere: "I've", "you're", "it's", "can't", "won't"
- Include casual filler: "honestly", "pretty much", "kinda", "sorta", "tbh"
- Share personal experience: "I ran into this", "had the same issue", "been there"
- Use casual language: "solid", "decent", "works fine", "pain in the ass", "pretty good"
- Include real struggles: "took me forever to figure out", "was a mess at first"
- Sound like a real developer: "works for me", "your mileage may vary", "depends on what you need"

## ABSOLUTELY AVOID AI JARGON
- NEVER use: "comprehensive", "robust", "seamless", "cutting-edge", "innovative", "powerful"
- BANNED words: "solution", "offering", "utilize", "leverage", "framework", "ecosystem"
- NO superlatives: "amazing", "incredible", "game-changing", "revolutionary"
- NO formal language: "furthermore", "additionally", "however", "therefore"

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
- **LENGTH**: 120-180 words maximum (short and sweet!)
- **STRUCTURE**: 2-3 casual paragraphs, like texting a friend
- **NO CODE EXAMPLES**: Never include any code blocks or snippets
- **FOCUS**: Only 2-3 API mentions, don't overwhelm with options
- **TONE**: Casual developer chat, like you're helping a friend
- **SEO FOCUS**: Naturally work in relevant keywords from competitor analysis

## SEO Keyword Integration
- Naturally mention competing services: "CoinGecko", "Moralis", "Alchemy"
- Include relevant search terms: "API for [use case]", "best [service type]", "[problem] alternative"
- Use keywords people actually search for, not technical jargon
- Make it sound like natural conversation, not keyword stuffing

TASK: Write a SUPER CASUAL, short Reddit comment that sounds like a real developer helping out. NO CODE EXAMPLES. Focus on being genuinely helpful while naturally including SEO keywords. Sound like you're texting a friend who asked for advice.
`;
  }

  private getSubredditGuidelines(subreddit: string): string {
    const guidelines = {
      'solana': 'Pretty chill dev community, just be honest about what works and what doesn\'t with SPL tokens',
      'webdev': 'Hate obvious promotion, keep it practical and mention non-crypto alternatives too',
      'ethereum': 'Technical crowd, they know their stuff so don\'t oversell anything',
      'defi': 'Love data and yield talk, mention actual numbers when you can',
      'cryptocurrency': 'Mixed crowd, some noobs some experts, keep it accessible but useful',
      'ethdev': 'Super technical, they\'ll call out BS immediately, be genuine',
      'web3': 'Building real stuff, focus on practical dev problems not hype',
      'programming': 'General dev community, need to explain crypto context casually',
      'cryptodevs': 'Fellow crypto devs, they get the pain points, be real about challenges'
    };

    return guidelines[subreddit.toLowerCase()] || 'Dev community, keep it real and helpful';
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