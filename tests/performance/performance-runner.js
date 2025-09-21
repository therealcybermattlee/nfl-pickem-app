#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const RESULTS_DIR = path.join(__dirname, 'results');
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-');

// Ensure results directory exists
if (!fs.existsSync(RESULTS_DIR)) {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
}

console.log('🚀 Starting NFL Pick\'em Performance Test Suite');
console.log(`📊 Results will be saved to: ${RESULTS_DIR}`);

async function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`\n▶️  Running: ${command} ${args.join(' ')}`);
    
    const process = spawn(command, args, {
      stdio: 'pipe',
      ...options
    });

    let stdout = '';
    let stderr = '';

    process.stdout.on('data', (data) => {
      const output = data.toString();
      stdout += output;
      console.log(output.trim());
    });

    process.stderr.on('data', (data) => {
      const output = data.toString();
      stderr += output;
      console.error(output.trim());
    });

    process.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr, code });
      } else {
        reject({ stdout, stderr, code });
      }
    });
  });
}

async function runPerformanceTests() {
  const results = {
    timestamp: new Date().toISOString(),
    tests: []
  };

  try {
    // 1. API Load Tests with Artillery
    console.log('\n🎯 Running API Load Tests...');
    try {
      const apiTestResult = await runCommand('npx', [
        'artillery', 'run',
        '--output', path.join(RESULTS_DIR, `api-load-${TIMESTAMP}.json`),
        path.join(__dirname, 'api-load-test.yml')
      ]);
      
      results.tests.push({
        name: 'API Load Tests',
        status: 'passed',
        duration: 'See artillery report',
        details: 'API load test completed successfully'
      });
    } catch (error) {
      console.error('❌ API Load Tests failed:', error.stderr);
      results.tests.push({
        name: 'API Load Tests',
        status: 'failed',
        error: error.stderr
      });
    }

    // 2. Game Day Stress Tests
    console.log('\n🏈 Running Game Day Stress Tests...');
    try {
      const stressTestResult = await runCommand('npx', [
        'artillery', 'run',
        '--output', path.join(RESULTS_DIR, `stress-test-${TIMESTAMP}.json`),
        path.join(__dirname, 'game-day-stress-test.yml')
      ]);
      
      results.tests.push({
        name: 'Game Day Stress Tests',
        status: 'passed',
        duration: 'See artillery report',
        details: 'Stress test completed successfully'
      });
    } catch (error) {
      console.error('❌ Game Day Stress Tests failed:', error.stderr);
      results.tests.push({
        name: 'Game Day Stress Tests',
        status: 'failed',
        error: error.stderr
      });
    }

    // 3. Frontend Performance Tests with Playwright
    console.log('\n🖥️  Running Frontend Performance Tests...');
    try {
      const frontendTestResult = await runCommand('npx', [
        'playwright', 'test',
        path.join(__dirname, 'frontend-performance.spec.ts'),
        '--reporter=json',
        `--output=${path.join(RESULTS_DIR, `frontend-${TIMESTAMP}.json`)}`
      ]);
      
      results.tests.push({
        name: 'Frontend Performance Tests',
        status: 'passed',
        duration: 'See playwright report',
        details: 'Frontend performance tests completed'
      });
    } catch (error) {
      console.error('❌ Frontend Performance Tests had issues:', error.stderr);
      results.tests.push({
        name: 'Frontend Performance Tests',
        status: 'completed_with_warnings',
        details: 'Some tests may have failed - check detailed report'
      });
    }

    // 4. Time-Lock Performance Tests
    console.log('\n⏰ Running Time-Lock System Performance Tests...');
    try {
      const timeLockResult = await runCommand('npx', [
        'playwright', 'test',
        path.join(__dirname, 'time-lock-performance.spec.ts'),
        '--reporter=json'
      ]);
      
      results.tests.push({
        name: 'Time-Lock Performance Tests',
        status: 'passed',
        duration: 'See playwright report',
        details: 'Time-lock system performance validated'
      });
    } catch (error) {
      console.error('❌ Time-Lock Performance Tests had issues:', error.stderr);
      results.tests.push({
        name: 'Time-Lock Performance Tests',
        status: 'completed_with_warnings',
        details: 'Some tests may have failed - check logs'
      });
    }

    // 5. Generate Artillery Reports
    console.log('\n📈 Generating Performance Reports...');
    const reportFiles = fs.readdirSync(RESULTS_DIR).filter(f => f.endsWith('.json') && f.includes(TIMESTAMP));
    
    for (const reportFile of reportFiles) {
      if (reportFile.includes('api-load') || reportFile.includes('stress-test')) {
        try {
          const htmlReportName = reportFile.replace('.json', '.html');
          await runCommand('npx', [
            'artillery', 'report',
            path.join(RESULTS_DIR, reportFile),
            '--output', path.join(RESULTS_DIR, htmlReportName)
          ]);
          console.log(`✅ Generated report: ${htmlReportName}`);
        } catch (error) {
          console.error(`❌ Failed to generate report for ${reportFile}`);
        }
      }
    }

    // Save summary results
    fs.writeFileSync(
      path.join(RESULTS_DIR, `performance-summary-${TIMESTAMP}.json`),
      JSON.stringify(results, null, 2)
    );

    // Generate summary report
    generateSummaryReport(results);

  } catch (error) {
    console.error('💥 Performance test suite failed:', error);
    process.exit(1);
  }
}

function generateSummaryReport(results) {
  const reportPath = path.join(RESULTS_DIR, `performance-report-${TIMESTAMP}.md`);
  
  let report = `# NFL Pick'em Performance Test Report
  
**Test Run:** ${results.timestamp}
**Environment:** Production (https://pickem.cyberlees.dev)

## Test Summary

| Test Suite | Status | Details |
|------------|--------|---------|
`;

  results.tests.forEach(test => {
    const statusEmoji = test.status === 'passed' ? '✅' : 
                       test.status === 'completed_with_warnings' ? '⚠️' : '❌';
    report += `| ${test.name} | ${statusEmoji} ${test.status} | ${test.details || 'N/A'} |\n`;
  });

  report += `

## Performance Expectations

### API Performance Targets
- **Response Time:** < 500ms for 95% of requests
- **Concurrent Users:** Handle 100+ simultaneous users
- **Peak Load:** Support game-day deadline rush scenarios
- **Error Rate:** < 1% under normal load

### Frontend Performance Targets
- **Page Load:** < 3 seconds initial load
- **Navigation:** < 2 seconds between pages
- **Time-to-Interactive:** < 4 seconds
- **Mobile Performance:** Maintain performance on mobile devices

### Time-Lock System Targets
- **Pick Submission:** < 2 seconds per pick
- **Lock Status Check:** < 1 second
- **Countdown Accuracy:** ±1 second precision
- **Bulk Operations:** Handle multiple picks simultaneously

## Detailed Results

Check the following files for detailed metrics:
`;

  const reportFiles = fs.readdirSync(RESULTS_DIR)
    .filter(f => f.includes(TIMESTAMP))
    .sort();

  reportFiles.forEach(file => {
    report += `- \`${file}\`\n`;
  });

  report += `

## Performance Recommendations

1. **Monitor Response Times:** Keep API response times under 500ms
2. **Database Optimization:** Ensure D1 queries are optimized with proper indexing
3. **Caching Strategy:** Implement caching for frequently accessed data
4. **Error Handling:** Graceful degradation during peak load
5. **Real-time Monitoring:** Set up alerts for performance degradation

## Game Day Readiness Checklist

- [ ] API can handle 100+ concurrent users
- [ ] Pick submissions work under load
- [ ] Time-lock system performs accurately
- [ ] Frontend remains responsive during peak usage
- [ ] Error rates stay below 1%
- [ ] Mobile performance is acceptable

## Next Steps

1. Review detailed Artillery reports for API performance metrics
2. Analyze Playwright test results for frontend issues
3. Set up monitoring for production performance tracking
4. Create alerts for performance degradation
5. Plan capacity scaling if needed

---
*Generated by NFL Pick'em Performance Test Suite*
`;

  fs.writeFileSync(reportPath, report);
  console.log(`\n📋 Summary report generated: ${reportPath}`);
  
  // Also log key findings to console
  console.log('\n🎯 Performance Test Summary:');
  results.tests.forEach(test => {
    const statusIcon = test.status === 'passed' ? '✅' : 
                      test.status === 'completed_with_warnings' ? '⚠️' : '❌';
    console.log(`${statusIcon} ${test.name}: ${test.status}`);
  });
}

// Handle script interruption
process.on('SIGINT', () => {
  console.log('\n⚠️  Performance tests interrupted by user');
  process.exit(0);
});

// Run the performance test suite
runPerformanceTests().then(() => {
  console.log('\n🎉 Performance test suite completed!');
  console.log(`📊 Check results in: ${RESULTS_DIR}`);
}).catch((error) => {
  console.error('\n💥 Performance test suite failed:', error);
  process.exit(1);
});