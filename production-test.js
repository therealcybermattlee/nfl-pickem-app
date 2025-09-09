import { chromium } from 'playwright';

async function testProduction() {
  console.log('🚀 Testing production site...');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    // Test 1: Site loads
    console.log('📡 Loading https://pickem.leefamilysso.com...');
    await page.goto('https://pickem.leefamilysso.com', { timeout: 10000 });
    
    // Test 2: Title check
    const title = await page.title();
    console.log(`✅ Page title: "${title}"`);
    
    // Test 3: Main heading exists
    try {
      const heading = await page.waitForSelector('h1', { timeout: 5000 });
      const headingText = await heading.textContent();
      console.log(`✅ Main heading found: "${headingText}"`);
    } catch (e) {
      console.log('⚠️ No h1 found, checking for other content...');
      const body = await page.textContent('body');
      console.log(`Body content preview: ${body.substring(0, 100)}...`);
    }
    
    // Test 4: API connectivity
    console.log('📡 Testing API connectivity...');
    const response = await page.request.get('https://nfl-pickem-app-production.cybermattlee-llc.workers.dev/api/teams');
    
    if (response.ok()) {
      const data = await response.json();
      console.log(`✅ API working - ${data.length} teams loaded`);
    } else {
      console.log(`❌ API returned status: ${response.status()}`);
    }
    
    // Test 5: Games API
    const gamesResponse = await page.request.get('https://nfl-pickem-app-production.cybermattlee-llc.workers.dev/api/games?week=1&season=2025');
    if (gamesResponse.ok()) {
      const games = await gamesResponse.json();
      console.log(`✅ Games API working - ${games.length} games for Week 1`);
    } else {
      console.log(`❌ Games API returned status: ${gamesResponse.status()}`);
    }
    
    console.log('✅ Production validation complete!');
    
  } catch (error) {
    console.error('❌ Production test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testProduction();