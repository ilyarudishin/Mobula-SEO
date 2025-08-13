const axios = require('axios');
const { ConfigService } = require('./dist/config/config.service');

async function analyzeDexScreenerSERP() {
  console.log('🔍 Analyzing SERP for "5 dexscreener alternatives"...');
  
  // You'll need to replace with actual API key from your config
  const SERP_API_KEY = process.env.SERPAPI_KEY; // Make sure this is set in your env
  
  if (!SERP_API_KEY) {
    console.error('❌ SERPAPI_KEY not found in environment variables');
    return;
  }
  
  const keyword = "5 dexscreener alternatives";
  
  try {
    const response = await axios.get('https://serpapi.com/search.json', {
      params: {
        engine: 'google',
        q: keyword,
        api_key: SERP_API_KEY,
        num: 20,
        location: 'United States'
      },
      timeout: 10000,
    });

    const data = response.data;
    
    console.log('\n📊 SERP ANALYSIS RESULTS:');
    console.log(`🎯 Keyword: "${keyword}"`);
    console.log(`📈 Total Results: ${data.search_information?.total_results?.toLocaleString() || 'N/A'}`);
    
    // Check for featured snippet
    if (data.answer_box) {
      console.log('\n🎯 FEATURED SNIPPET:');
      console.log(`Title: ${data.answer_box.title}`);
      console.log(`Domain: ${data.answer_box.displayed_link}`);
      console.log(`Content: ${data.answer_box.snippet?.substring(0, 200)}...`);
    }
    
    // Analyze top 20 results
    console.log('\n🏆 TOP RANKING PAGES:');
    const organicResults = data.organic_results || [];
    
    let mobulaFound = false;
    
    organicResults.forEach((result, index) => {
      const domain = result.displayed_link || result.link || '';
      const isMobula = domain.includes('mobula.io');
      
      if (isMobula) mobulaFound = true;
      
      console.log(`${index + 1}. ${isMobula ? '🎯 MOBULA:' : ''} ${result.title}`);
      console.log(`   Domain: ${domain}`);
      console.log(`   URL: ${result.link}`);
      console.log(`   Snippet: ${result.snippet?.substring(0, 150)}...`);
      console.log('');
    });
    
    if (!mobulaFound) {
      console.log('❌ MOBULA NOT FOUND in top 20 results');
    }
    
    // Analyze what content types are ranking
    console.log('\n📝 CONTENT TYPE ANALYSIS:');
    const contentTypes = {
      blogPosts: 0,
      directories: 0,
      comparisons: 0,
      lists: 0,
      reviews: 0
    };
    
    organicResults.forEach(result => {
      const title = result.title?.toLowerCase() || '';
      const snippet = result.snippet?.toLowerCase() || '';
      
      if (title.includes('alternatives') || title.includes('vs') || snippet.includes('comparison')) {
        contentTypes.comparisons++;
      }
      if (title.includes('best') || title.includes('top') || title.includes('list')) {
        contentTypes.lists++;
      }
      if (title.includes('review') || snippet.includes('review')) {
        contentTypes.reviews++;
      }
    });
    
    console.log(`Comparison articles: ${contentTypes.comparisons}`);
    console.log(`List articles: ${contentTypes.lists}`);
    console.log(`Review content: ${contentTypes.reviews}`);
    
    // Check related searches
    if (data.related_searches && data.related_searches.length > 0) {
      console.log('\n🔗 RELATED SEARCHES:');
      data.related_searches.forEach((search, index) => {
        console.log(`${index + 1}. ${search.query}`);
      });
    }
    
    // People Also Ask
    if (data.people_also_ask && data.people_also_ask.length > 0) {
      console.log('\n❓ PEOPLE ALSO ASK:');
      data.people_also_ask.forEach((paa, index) => {
        console.log(`${index + 1}. ${paa.question}`);
      });
    }
    
    // SEO Gap Analysis
    console.log('\n🎯 SEO GAP ANALYSIS FOR MOBULA:');
    console.log('WHY MOBULA IS NOT RANKING:');
    
    // Check if Mobula has content about DexScreener
    console.log('\n1. CONTENT GAP ANALYSIS:');
    console.log('   - Need dedicated "DexScreener alternatives" content');
    console.log('   - Missing comparison content targeting this specific term');
    console.log('   - No content optimized for "5 dexscreener alternatives" keyword');
    
    console.log('\n2. COMPETITION ANALYSIS:');
    const competitors = ['coingecko', 'coinmarketcap', 'moralis', 'dextools', 'defined.fi', 'birdeye'];
    const competitorResults = organicResults.filter(result => 
      competitors.some(comp => result.link?.includes(comp))
    );
    
    if (competitorResults.length > 0) {
      console.log('   COMPETITORS RANKING:');
      competitorResults.forEach((result, index) => {
        console.log(`   ${index + 1}. ${result.displayed_link} - Position ${organicResults.indexOf(result) + 1}`);
      });
    }
    
    console.log('\n3. RECOMMENDED ACTIONS:');
    console.log('   ✅ Create dedicated "5 DexScreener Alternatives" article');
    console.log('   ✅ Include Mobula as #1 alternative with detailed comparison');
    console.log('   ✅ Target related keywords: "dexscreener alternative", "best dexscreener alternatives"');
    console.log('   ✅ Include comparison table with features, pricing, API capabilities');
    console.log('   ✅ Add schema markup for comparison content');
    console.log('   ✅ Build backlinks to the new comparison content');
    
  } catch (error) {
    console.error(`❌ Failed to analyze SERP: ${error.message}`);
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Data: ${JSON.stringify(error.response.data, null, 2)}`);
    }
  }
}

// Run the analysis
analyzeDexScreenerSERP().then(() => {
  console.log('\n✅ SERP analysis complete');
}).catch(console.error);