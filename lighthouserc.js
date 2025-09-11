// Lighthouse CI Configuration for NFL Pick'em PWA
module.exports = {
  ci: {
    collect: {
      // URLs to audit
      url: [
        'https://pickem.leefamilysso.com/',
        'https://pickem.leefamilysso.com/games',
        'https://pickem.leefamilysso.com/leaderboard'
      ],
      // Lighthouse settings
      settings: {
        // Emulate mobile device for mobile-first PWA
        emulatedFormFactor: 'mobile',
        // Throttling to simulate 3G connection (game day scenarios)
        throttling: {
          rttMs: 150,
          throughputKbps: 1600,
          cpuSlowdownMultiplier: 4
        }
      },
      // Number of runs to average
      numberOfRuns: 3
    },
    
    // Performance budgets and assertions
    assert: {
      // PWA requirements (must pass)
      assertions: {
        'categories:pwa': ['error', { minScore: 0.95 }],
        'categories:performance': ['warn', { minScore: 0.90 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['warn', { minScore: 0.90 }],
        'categories:seo': ['warn', { minScore: 0.90 }]
      }
    },
    
    // Upload results (can be configured for CI/CD)
    upload: {
      target: 'temporary-public-storage'
    }
  }
};