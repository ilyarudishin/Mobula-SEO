// Nuclear filtering function - only captures legitimate API requests
function isLegitimateApiRequest(postTitle, postContent) {
  const text = `${postTitle} ${postContent}`.toLowerCase();
  
  // MUST contain explicit API request phrases
  const apiRequestPhrases = [
    'best api for',
    'good api for', 
    'api recommendations',
    'which api',
    'what api',
    'recommend api',
    'suggest api',
    'need api for',
    'looking for api',
    'api to get',
    'free api for',
    'cheap api for'
  ];
  
  const hasApiRequest = apiRequestPhrases.some(phrase => text.includes(phrase));
  if (!hasApiRequest) return false;
  
  // MUST be asking a question
  const isQuestion = text.includes('?') || 
                    text.startsWith('what ') ||
                    text.startsWith('which ') ||
                    text.startsWith('how ') ||
                    text.includes('recommend') ||
                    text.includes('suggest');
  if (!isQuestion) return false;
  
  // MUST match Mobula's services exactly
  const mobulaServices = [
    'crypto price',
    'token price', 
    'market data',
    'price data',
    'wallet data',
    'portfolio data',
    'transaction history',
    'token metadata',
    'multi-chain',
    'cross-chain'
  ];
  
  const matchesMobula = mobulaServices.some(service => text.includes(service));
  if (!matchesMobula) return false;
  
  // REJECT anything that's not a genuine API request
  const rejectTerms = [
    'bot', 'trading bot', 'defi bot',
    'payments', 'payment system',
    'feedback requested', 'novel token',
    'open-source tools', 'market analysis',
    'guide', 'tutorial', 'explained',
    'announcement', 'launched', 'dropped'
  ];
  
  const shouldReject = rejectTerms.some(term => text.includes(term));
  if (shouldReject) return false;
  
  return true;
}

// Test examples
const testPosts = [
  { title: "Best API for crypto price data?", content: "Looking for reliable crypto price API", expected: true },
  { title: "Which API for wallet data?", content: "Need portfolio tracking API recommendations", expected: true },
  { title: "Crypto payments should be bigger", content: "Discussion about adoption", expected: false },
  { title: "DeFi Bot on Various AMMs", content: "Built a trading bot", expected: false }
];

console.log("Testing nuclear filter:");
testPosts.forEach(post => {
  const result = isLegitimateApiRequest(post.title, post.content);
  const status = result === post.expected ? "✅ PASS" : "❌ FAIL";
  console.log(`${status} "${post.title}" -> ${result}`);
});

module.exports = { isLegitimateApiRequest };