const axios = require('axios');

async function diagnoseComparePage() {
  console.log('🔍 Diagnosing why mobula.io/compare isn\'t ranking for "5 dexscreener alternatives"...\n');
  
  const SERP_API_KEY = "17c7f5808efa3237de191368e65820523d7d379e3754a42e14cfa6c97866d3f8";
  
  try {
    // First, check if the page exists in Google's index at all
    const indexResponse = await axios.get('https://serpapi.com/search.json', {
      params: {
        engine: 'google',
        q: 'site:mobula.io/compare',
        api_key: SERP_API_KEY,
      }
    });

    console.log('📊 GOOGLE INDEX CHECK:');
    console.log(`Results for site:mobula.io/compare: ${indexResponse.data.search_information?.total_results || 0} results`);
    
    if (indexResponse.data.organic_results && indexResponse.data.organic_results.length > 0) {
      console.log('✅ Page IS indexed by Google');
      const result = indexResponse.data.organic_results[0];
      console.log(`   Title: ${result.title}`);
      console.log(`   Snippet: ${result.snippet}`);
      console.log(`   URL: ${result.link}\n`);
    } else {
      console.log('❌ Page NOT properly indexed by Google\n');
    }

    // Check if it ranks for its exact title
    const titleResponse = await axios.get('https://serpapi.com/search.json', {
      params: {
        engine: 'google',
        q: '"5 DexScreener Alternatives: Real Performance Data Developer Experience"',
        api_key: SERP_API_KEY,
        num: 20
      }
    });

    console.log('📊 EXACT TITLE SEARCH:');
    console.log(`Results for exact title match: ${titleResponse.data.search_information?.total_results || 0} results`);
    
    let mobulaFoundInTitle = false;
    if (titleResponse.data.organic_results) {
      titleResponse.data.organic_results.forEach((result, index) => {
        if (result.link && result.link.includes('mobula.io')) {
          mobulaFoundInTitle = true;
          console.log(`✅ Found Mobula at position ${index + 1}`);
          console.log(`   Title: ${result.title}`);
          console.log(`   Snippet: ${result.snippet}`);
        }
      });
    }
    
    if (!mobulaFoundInTitle) {
      console.log('❌ Mobula.io does NOT rank for its own page title\n');
    }

    // Check technical SEO issues
    console.log('🔧 TECHNICAL SEO ANALYSIS:');
    
    try {
      const pageResponse = await axios.get('https://mobula.io/compare', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
        }
      });
      
      const html = pageResponse.data;
      
      // Check for meta description
      const metaDescMatch = html.match(/<meta name="description" content="([^"]*)">/i);
      if (metaDescMatch) {
        console.log(`✅ Meta Description: ${metaDescMatch[1]}`);
      } else {
        console.log('❌ Missing meta description tag');
      }

      // Check for title tag
      const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
      if (titleMatch) {
        console.log(`✅ Title Tag: ${titleMatch[1]}`);
      } else {
        console.log('❌ Missing title tag');
      }

      // Check for h1 tag
      if (html.includes('DexScreener Alternatives')) {
        console.log('✅ Content contains "DexScreener Alternatives"');
      } else {
        console.log('❌ Content missing "DexScreener Alternatives" text');
      }

      // Check if content is JavaScript-rendered
      if (html.includes('data-framer-') && html.includes('framer-')) {
        console.log('⚠️  Content is Framer/JavaScript-heavy (may impact crawling)');
      }

      // Check for schema markup
      if (html.includes('application/ld+json')) {
        console.log('✅ Has JSON-LD structured data');
      } else {
        console.log('❌ Missing structured data (schema.org)');
      }

      // Check canonical URL
      const canonicalMatch = html.match(/<link rel="canonical" href="([^"]*)">/i);
      if (canonicalMatch) {
        console.log(`✅ Canonical URL: ${canonicalMatch[1]}`);
      } else {
        console.log('❌ Missing canonical URL');
      }

    } catch (error) {
      console.log(`❌ Error analyzing page: ${error.message}`);
    }

    // Compare with competitors
    console.log('\n🏆 COMPETITOR COMPARISON:');
    const competitorResponse = await axios.get('https://serpapi.com/search.json', {
      params: {
        engine: 'google',
        q: '5 dexscreener alternatives',
        api_key: SERP_API_KEY,
        num: 10
      }
    });

    if (competitorResponse.data.organic_results) {
      console.log('Top 5 ranking pages:');
      competitorResponse.data.organic_results.slice(0, 5).forEach((result, index) => {
        console.log(`${index + 1}. ${result.title}`);
        console.log(`   Domain: ${result.displayed_link}`);
        console.log(`   Snippet: ${result.snippet?.substring(0, 100)}...`);
        console.log('');
      });
    }

    console.log('\n🎯 RECOMMENDATIONS:');
    console.log('1. ✅ Add proper HTML meta description targeting "5 dexscreener alternatives"');
    console.log('2. ✅ Ensure content is server-side rendered, not just client-side JavaScript');
    console.log('3. ✅ Add JSON-LD structured data for Article/Comparison schema');
    console.log('4. ✅ Build internal links to the /compare page from relevant blog posts');
    console.log('5. ✅ Create clean HTML version with proper heading structure (H1, H2, etc.)');
    console.log('6. ✅ Add "dexscreener alternatives" keyword naturally throughout the content');
    console.log('7. ✅ Build external backlinks mentioning "dexscreener alternatives" pointing to /compare');

  } catch (error) {
    console.error(`❌ Diagnosis failed: ${error.message}`);
  }
}

diagnoseComparePage();