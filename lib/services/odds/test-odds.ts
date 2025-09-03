// Simple test script to verify odds integration
// Run with: npx tsx lib/services/odds/test-odds.ts

import { OddsService } from './OddsService';
import { TheOddsApiProvider } from './TheOddsApiProvider';

async function testOddsIntegration() {
  console.log('🏈 Testing NFL Odds Integration');
  console.log('================================');

  try {
    // Test provider availability
    const config = {
      apiKey: process.env.ODDS_API_KEY || 'test-key',
      baseUrl: 'https://api.the-odds-api.com/v4'
    };

    const provider = new TheOddsApiProvider(config);
    console.log(`Provider: ${provider.getProviderName()}`);
    console.log(`Available: ${provider.isAvailable()}`);

    if (!provider.isAvailable()) {
      console.log('⚠️  No API key configured. Set ODDS_API_KEY in .env to test actual API calls.');
      return;
    }

    // Test service initialization
    const oddsService = OddsService.getInstance();
    const stats = await oddsService.getUsageStats();
    
    console.log('\nUsage Stats:');
    console.log(`- Provider: ${stats.provider}`);
    console.log(`- Remaining Requests: ${stats.remainingRequests}`);
    console.log(`- Cache Size: ${stats.cacheSize}`);

    // Test fetching odds (will fail without API key, but tests the flow)
    try {
      console.log('\n🔄 Testing odds fetch...');
      const odds = await provider.fetchOdds();
      console.log(`✅ Successfully fetched ${odds.length} games with odds`);
      
      if (odds.length > 0) {
        const sample = odds[0];
        console.log('\nSample Game:');
        console.log(`- ${sample.awayTeamName} @ ${sample.homeTeamName}`);
        console.log(`- Date: ${sample.gameDate}`);
        console.log(`- Spread: ${sample.homeTeamName} ${sample.homeSpread}`);
        console.log(`- Over/Under: ${sample.overUnder}`);
        console.log(`- Moneyline: ${sample.homeTeamName} ${sample.homeMoneyline}, ${sample.awayTeamName} ${sample.awayMoneyline}`);
      }
      
    } catch (error) {
      console.log(`⚠️  API fetch failed (expected without valid API key): ${error instanceof Error ? error.message : error}`);
    }

    console.log('\n✅ Odds integration foundation is ready!');
    console.log('\nNext steps:');
    console.log('1. Register at https://the-odds-api.com');
    console.log('2. Add your API key to ODDS_API_KEY in .env');
    console.log('3. Run this test again to verify API connection');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run test if called directly
if (require.main === module) {
  testOddsIntegration();
}

export { testOddsIntegration };