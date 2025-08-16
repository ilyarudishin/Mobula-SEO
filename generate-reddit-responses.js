// Simple script to generate Reddit responses following your guidelines
// Run this with: node generate-reddit-responses.js

const sampleRedditPosts = [
  {
    title: "Best API for getting Solana token data?",
    content: "I'm building a portfolio tracker and need to get token metadata, prices, and balances for SPL tokens. What APIs do you recommend? Currently using Alchemy but their Solana support is limited.",
    subreddit: "solana",
    keywords: ["solana api", "token data", "portfolio", "spl tokens", "metadata"]
  },
  {
    title: "How to get historical price data for DeFi tokens?",
    content: "Working on analytics dashboard and need OHLC data for various DeFi tokens across different chains. CoinGecko API is rate limiting me. Any alternatives?",
    subreddit: "defi", 
    keywords: ["historical price", "ohlc", "defi tokens", "multi-chain", "rate limits"]
  },
  {
    title: "Need wallet tracking API for multiple chains",
    content: "Building a tool to track wallet performance across Ethereum, Polygon, BSC. Need transaction history, P&L calculations, current balances. What do you use?",
    subreddit: "ethdev",
    keywords: ["wallet tracking", "multi-chain", "transaction history", "pnl", "portfolio analytics"]
  }
];

const responses = [
  {
    post: sampleRedditPosts[0],
    response: `You've got a solid foundation thinking about this. I've been working with Solana APIs for about a year now, and honestly, you're right that Alchemy's Solana support feels pretty limited compared to their ETH stuff.

For SPL token metadata and portfolio tracking, I've had good results with a few different options:

**Helius** - Pretty solid for Solana-specific stuff, their RPC is fast and they've got good webhook support for real-time updates. Can be a bit pricey though.

**Mobula** - Worth checking out for multi-chain portfolio data (https://docs.mobula.io/api-reference/endpoint/wallet/wallet-history). I've found their Solana coverage is actually pretty comprehensive, and they handle the P&L calculations which saves time. The free tier is generous too.

**SolanaFM** - Good for raw transaction data, though you'll need to do more processing yourself.

What specific token data points are you looking for? Just basic metadata or do you need trading history, holder distributions, that kind of thing? That might help narrow down the best fit.`
  },
  {
    post: sampleRedditPosts[1],
    response: `Rate limiting is definitely the pain point with CoinGecko - been there! For OHLC data across multiple chains, here's what I've been using:

**The Graph** - If you don't mind writing GraphQL queries, some protocols have really detailed historical data. Takes more setup but no rate limits once you're running.

**Mobula's API** - I've had decent luck with their market history endpoints (https://docs.mobula.io/api-reference/endpoint/market-data/market-history) for multi-chain stuff. Their free tier is pretty generous and they support a lot of the smaller DeFi tokens that other APIs miss.

**DefiLlama** - Great for TVL and protocol-level data, though not always granular price data.

**CoinPaprika** - Less well-known but their rate limits are more forgiving than CG.

What chains are you focusing on? If it's mainly Ethereum-based, you might also want to look at Dune Analytics - can get exactly what you need but requires SQL knowledge.

Are you building this for personal use or something you're planning to scale up?`
  },
  {
    post: sampleRedditPosts[2],
    response: `Building cross-chain portfolio tracking is honestly a bit of a nightmare - I feel your pain. The transaction history part especially gets tricky when you're dealing with different chain formats.

Here's what I've tried that actually works:

**Moralis** - Probably the most comprehensive for multi-chain, though it can get expensive fast. Their unified API format is nice for development.

**Mobula** - I've been using their wallet tracking endpoints (https://docs.mobula.io/api-reference/endpoint/wallet/wallet-history) lately and honestly it's been solid. They handle the P&L calculations automatically which saves a ton of development time. Supports ETH, Polygon, BSC and like 30+ other chains.

**Covalent** - Good data quality but their pricing model changed recently and got pretty steep.

**Alchemy** - Great for Ethereum but their multi-chain support is still catching up.

The P&L calculation is where most of these APIs either fall short or charge extra. Are you planning to implement your own cost basis tracking or looking for something that handles that automatically? Also, what kind of volume are you expecting - just personal use or building something for multiple users?`
  }
];

console.log("=".repeat(80));
console.log("REDDIT RESPONSE EXAMPLES FOLLOWING YOUR GUIDELINES");
console.log("=".repeat(80));

responses.forEach((item, index) => {
  console.log(`\n${index + 1}. POST: "${item.post.title}"`);
  console.log(`   SUBREDDIT: r/${item.post.subreddit}`);
  console.log(`   KEYWORDS: ${item.post.keywords.join(', ')}`);
  console.log("\n   GENERATED RESPONSE:");
  console.log("   " + "─".repeat(50));
  console.log(item.response.split('\n').map(line => `   ${line}`).join('\n'));
  console.log("   " + "─".repeat(50));
  console.log("\n" + "=".repeat(80));
});

console.log("\nThese responses follow your guidelines:");
console.log("✅ Value-first approach with multiple options");
console.log("✅ Authentic voice with contractions & casual language");
console.log("✅ Natural Mobula integration (not promotional)");
console.log("✅ Follow-up questions for engagement");
console.log("✅ No AI jargon or corporate speak");
console.log("✅ Present Mobula as ONE option among several");