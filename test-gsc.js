const { google } = require('googleapis');

async function testGSC() {
  try {
    console.log('Testing Google Search Console connection...');
    
    const auth = new google.auth.GoogleAuth({
      keyFile: './gsc-credentials.json',
      scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
    });

    const searchconsole = google.searchconsole({ version: 'v1', auth });
    const siteUrl = 'sc-domain:mobula.io';

    // Test connection by listing sites
    const sites = await searchconsole.sites.list();
    
    console.log('✅ Google Search Console connection successful');
    console.log('Available sites:', sites.data.siteEntry?.map(site => site.siteUrl));
    
    // Check if our target site is available
    const targetSite = sites.data.siteEntry?.find(site => site.siteUrl === siteUrl);
    if (targetSite) {
      console.log(`✅ Target site ${siteUrl} found with permission level: ${targetSite.permissionLevel}`);
      
      // Try to get some recent data
      console.log('\nTesting performance data retrieval...');
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const request = {
        siteUrl: siteUrl,
        requestBody: {
          startDate,
          endDate,
          dimensions: ['query'],
          rowLimit: 10,
          startRow: 0,
        },
      };

      const response = await searchconsole.searchanalytics.query(request);
      const rows = response.data.rows || [];
      
      console.log(`✅ Retrieved ${rows.length} performance records from ${startDate} to ${endDate}`);
      
      if (rows.length > 0) {
        console.log('\nTop queries:');
        rows.slice(0, 5).forEach((row, i) => {
          console.log(`${i + 1}. "${row.keys[0]}" - ${row.clicks} clicks, ${row.impressions} impressions`);
        });
      } else {
        console.log('⚠️  No performance data found for the date range');
      }
      
    } else {
      console.log(`⚠️  Target site ${siteUrl} not found. Available sites:`, 
        sites.data.siteEntry?.map(site => site.siteUrl));
    }

  } catch (error) {
    console.error('❌ Google Search Console test failed:', error.message);
    
    if (error.code === 'ENOENT' && error.path?.includes('gsc-credentials.json')) {
      console.error('💡 Make sure gsc-credentials.json exists in the current directory');
    } else if (error.code === 403) {
      console.error('💡 Check that the service account has access to the Search Console property');
    }
  }
}

testGSC();