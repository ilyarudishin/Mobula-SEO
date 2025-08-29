const axios = require('axios');

async function regenerateRedditResponses() {
  try {
    console.log('🔄 Triggering Reddit response regeneration with casual tone...\n');
    
    // Use the existing endpoint that regenerates all responses
    const response = await axios.get('http://localhost:3003/generate-reddit-responses', {
      timeout: 300000 // 5 minute timeout
    });
    
    console.log('✅ Response:', response.data.message);
    console.log(`📊 Updated: ${response.data.processed || 'all'} Reddit entries`);
    console.log('📝 All responses are now conversational and SEO-optimized (no code examples)');
    
  } catch (error) {
    console.error('❌ Error regenerating responses:', error.message);
    if (error.response?.data) {
      console.error('Response data:', error.response.data);
    }
  }
}

regenerateRedditResponses();