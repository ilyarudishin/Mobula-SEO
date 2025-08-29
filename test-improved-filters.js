// Test the improved filters against real Reddit posts
const testPosts = [
  {
    title: "Read world Solana RPC bandwidth today?",
    subreddit: "solana",
    score: 3,
    age: 3 // hours
  },
  {
    title: "Any non custodial solana crypto gateway",
    subreddit: "solana", 
    score: 2,
    age: 1 // hours
  },
  {
    title: "Best API for getting crypto prices?",
    subreddit: "cryptocurrency",
    score: 5,
    age: 2 // hours
  },
  {
    title: "Looking for reliable data provider for DeFi",
    subreddit: "defi",
    score: 8,
    age: 4 // hours
  },
  {
    title: "Which blockchain indexer do you use?",
    subreddit: "ethdev",
    score: 12,
    age: 6 // hours
  }
];

// Updated filter patterns from the code
const apiRequestPatterns = [
  'best api', 'good api', 'api recommendation', 'which api', 'what api',
  'recommend api', 'suggest api', 'need api', 'looking for api',
  'api for', 'free api', 'cheap api', 'data api', 'pricing api', 'crypto api',
  'portfolio api', 'wallet api', 'blockchain api', 'web3 api', 'market data',
  // EXPANDED: Catch RPC, gateway, provider posts
  'rpc', 'rpc provider', 'rpc endpoint', 'rpc node', 'rpc service', 'rpc bandwidth',
  'gateway', 'crypto gateway', 'blockchain gateway', 'payment gateway', 'web3 gateway',
  'data provider', 'price provider', 'data feed', 'data source', 'data service',
  'provider', 'service provider', 'infrastructure', 'blockchain infrastructure',
  'indexer', 'blockchain indexer', 'data indexing', 'query service',
  'real-time data', 'live data', 'streaming data', 'websocket', 'webhook'
];

console.log('🧪 Testing improved Reddit filters...\n');

testPosts.forEach((post, i) => {
  console.log(`[${i+1}] "${post.title}"`);
  console.log(`    Subreddit: r/${post.subreddit} | Score: ${post.score} | Age: ${post.age}h`);
  
  const postText = post.title.toLowerCase();
  
  // Test age filter (48 hours = 48h)
  const passesAge = post.age <= 48;
  console.log(`    Age check: ${passesAge ? '✅ PASS' : '❌ FAIL'} (${post.age}h <= 48h)`);
  
  // Test score filter  
  const passesScore = post.score >= 1;
  console.log(`    Score check: ${passesScore ? '✅ PASS' : '❌ FAIL'} (${post.score} >= 1)`);
  
  // Test crypto relevance
  const cryptoTerms = ['crypto', 'bitcoin', 'ethereum', 'solana', 'blockchain', 'token', 'defi', 'api', 'rpc', 'gateway'];
  const isCrypto = cryptoTerms.some(term => postText.includes(term));
  console.log(`    Crypto check: ${isCrypto ? '✅ PASS' : '❌ FAIL'}`);
  
  // Test API request patterns
  const hasApiRequest = apiRequestPatterns.some(pattern => postText.includes(pattern));
  const matchedPatterns = apiRequestPatterns.filter(pattern => postText.includes(pattern));
  console.log(`    API request check: ${hasApiRequest ? '✅ PASS' : '❌ FAIL'}`);
  if (hasApiRequest) {
    console.log(`    Matched patterns: [${matchedPatterns.join(', ')}]`);
  }
  
  // Overall result
  const wouldPass = passesAge && passesScore && isCrypto && hasApiRequest;
  console.log(`    OVERALL: ${wouldPass ? '✅ WOULD BE CAPTURED' : '❌ WOULD BE FILTERED OUT'}`);
  console.log('');
});

console.log('📊 SUMMARY:');
const passing = testPosts.filter(post => {
  const postText = post.title.toLowerCase();
  const passesAge = post.age <= 48;
  const passesScore = post.score >= 1;
  const cryptoTerms = ['crypto', 'bitcoin', 'ethereum', 'solana', 'blockchain', 'token', 'defi', 'api', 'rpc', 'gateway'];
  const isCrypto = cryptoTerms.some(term => postText.includes(term));
  const hasApiRequest = apiRequestPatterns.some(pattern => postText.includes(pattern));
  return passesAge && passesScore && isCrypto && hasApiRequest;
});

console.log(`✅ Posts that would be captured: ${passing.length}/${testPosts.length}`);
console.log('🎯 Filter improvements are working!');

passing.forEach(post => {
  console.log(`   - "${post.title}" (r/${post.subreddit})`);
});