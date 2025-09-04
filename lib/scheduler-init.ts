import { scheduleWeekChecks } from './week-scheduler'

// Initialize all background schedulers
export function initializeSchedulers() {
  if (typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
    // Only run schedulers in production server environment
    console.log('🏈 Initializing NFL Pick\'em schedulers...')
    
    try {
      // Start automatic week progression checks
      scheduleWeekChecks()
      console.log('✅ Week advancement scheduler started')
      
      // Schedule odds updates (if API key is configured)
      if (process.env.THE_ODDS_API_KEY) {
        scheduleOddsUpdates()
        console.log('✅ Odds update scheduler started')
      } else {
        console.log('⚠️ Odds API key not configured, skipping odds scheduler')
      }
      
    } catch (error) {
      console.error('❌ Error initializing schedulers:', error)
    }
  }
}

function scheduleOddsUpdates() {
  // Update odds twice daily: morning and evening
  const morningUpdate = setInterval(async () => {
    try {
      const response = await fetch('/api/odds/sync', { method: 'POST' })
      const result = await response.json()
      console.log('🎯 Morning odds update:', result.message)
    } catch (error) {
      console.error('Error in morning odds update:', error)
    }
  }, 12 * 60 * 60 * 1000) // Every 12 hours
  
  // Additional update 2 hours before first game on game days
  const gameTimeUpdate = setInterval(async () => {
    const now = new Date()
    const dayOfWeek = now.getDay()
    
    // Thursday (4), Sunday (0), Monday (1) - typical NFL game days
    if ([0, 1, 4].includes(dayOfWeek)) {
      try {
        const response = await fetch('/api/odds/sync', { method: 'POST' })
        const result = await response.json()
        console.log('🏈 Game day odds update:', result.message)
      } catch (error) {
        console.error('Error in game day odds update:', error)
      }
    }
  }, 2 * 60 * 60 * 1000) // Every 2 hours
}

// Cleanup function for graceful shutdown
export function stopSchedulers() {
  console.log('🛑 Stopping NFL Pick\'em schedulers...')
  // In a real implementation, you'd track interval IDs and clear them
}