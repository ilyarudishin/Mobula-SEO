// Analyze why the 1inch post was incorrectly flagged as relevant

const postTitle = "1inch Launches Solana Cross-chain Swaps Between Solana & EVM Chains";
const postText = postTitle.toLowerCase();

console.log('🔍 Analyzing why this post passed filtering...\n');
console.log(`Post: "${postTitle}"`);
console.log(`Lowercase: "${postText}"\n`);

// Check each filtering step
console.log('1. API REQUEST PATTERNS:');
const apiRequestPatterns = [
  'best api', 'good api', 'api recommendation', 'which api', 'what api',
  'recommend api', 'suggest api', 'need api', 'looking for api',
  'api for', 'free api', 'cheap api', 'data api', 'pricing api', 'crypto api',
  'portfolio api', 'wallet api', 'blockchain api', 'web3 api', 'market data'
];

const hasApiRequest = apiRequestPatterns.some(pattern => postText.includes(pattern));
console.log(`   Has API request patterns: ${hasApiRequest}`);
if (hasApiRequest) {
  const matches = apiRequestPatterns.filter(pattern => postText.includes(pattern));
  console.log(`   Matched patterns: ${matches.join(', ')}`);
}

console.log('\n2. SERVICE DISCUSSION PATTERNS:');
const mobulaServiceDiscussion = [
  'price data', 'market data', 'crypto prices', 'token prices', 'portfolio tracking',
  'wallet tracking', 'multi-chain', 'cross-chain', 'real-time data', 'websocket',
  'coingecko alternative', 'moralis alternative', 'alchemy alternative'
];

const hasServiceDiscussion = mobulaServiceDiscussion.some(service => postText.includes(service));
console.log(`   Has service discussion: ${hasServiceDiscussion}`);
if (hasServiceDiscussion) {
  const matches = mobulaServiceDiscussion.filter(service => postText.includes(service));
  console.log(`   Matched services: ${matches.join(', ')}`);
}

// This is where it should STOP if neither API request nor service discussion
if (!hasApiRequest && !hasServiceDiscussion) {
  console.log('\n❌ SHOULD HAVE BEEN REJECTED: No API requests or service discussions');
  console.log('🐛 BUG: Post should not have proceeded past this point!');
  return;
}

console.log('\n3. QUESTION PATTERNS:');
const isQuestion = postText.includes('?') || 
  postText.includes('recommend') ||
  postText.includes('suggest') ||
  postText.includes('which ') ||
  postText.includes('what ') ||
  postText.includes('how ') ||
  postText.includes('need ') ||
  postText.includes('looking for') ||
  postText.includes('trying to') ||
  postText.includes('help') ||
  postText.includes('advice');

console.log(`   Is question: ${isQuestion}`);

console.log('\n4. COMPETITOR MENTIONS:');
const competitorMention = [
  'coingecko', 'coinmarketcap', 'moralis', 'alchemy', 'infura', 'quicknode'
].some(comp => postText.includes(comp));

console.log(`   Has competitor mention: ${competitorMention}`);

// This is where it should STOP if not a question and no competitor mention
if (!isQuestion && !competitorMention) {
  console.log('\n❌ SHOULD HAVE BEEN REJECTED: Not a question and no competitor mentions');
  console.log('🐛 BUG: Post should not have proceeded past this point!');
  return;
}

console.log('\n5. CRYPTO TERMS:');
const cryptoTerms = [
  'crypto', 'cryptocurrency', 'bitcoin', 'ethereum', 'solana', 'blockchain',
  'token', 'coin', 'defi', 'web3', 'nft', 'dapp', 'smart contract',
  'metamask', 'phantom', 'wallet connect', 'uniswap', 'pancakeswap',
  'binance', 'coinbase', 'kraken', 'polygon', 'arbitrum', 'avalanche',
  'bsc', 'bnb chain', 'base', 'optimism', 'fantom', 'matic'
];

const isCryptoRelated = cryptoTerms.some(term => postText.includes(term));
console.log(`   Is crypto related: ${isCryptoRelated}`);
if (isCryptoRelated) {
  const matches = cryptoTerms.filter(term => postText.includes(term));
  console.log(`   Matched crypto terms: ${matches.join(', ')}`);
}

console.log('\n🎯 ANALYSIS:');
console.log('This post is clearly just a NEWS ANNOUNCEMENT, not an API question.');
console.log('It should have been filtered out at step 1 or 3.');
console.log('The filtering logic has a bug that allows irrelevant posts through.');

console.log('\n💡 EXPECTED BEHAVIOR:');
console.log('✅ Should capture: "What\'s the best API for Solana token data?"');
console.log('✅ Should capture: "Looking for multi-chain wallet API recommendations"');
console.log('❌ Should reject: "1inch Launches Solana Cross-chain Swaps" (news)');
console.log('❌ Should reject: "New DeFi protocol launched" (announcement)');