import { NextRequest, NextResponse } from 'next/server'
import { CacheManager } from '@/lib/cache/CacheManager'

export async function GET(request: NextRequest) {
  try {
    const cache = CacheManager.getInstance()
    
    // Get comprehensive cache statistics
    const stats = cache.getStats()
    const healthCheck = await cache.getHealthCheck()
    
    return NextResponse.json({
      success: true,
      stats,
      health: healthCheck,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Cache stats API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to get cache stats',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const cache = CacheManager.getInstance()
    
    switch (action) {
      case 'clear-all':
        await cache.clearAll()
        return NextResponse.json({
          success: true,
          message: 'All cache data cleared'
        })
        
      case 'clear-expired':
        // This is handled automatically by the cleanup process
        return NextResponse.json({
          success: true,
          message: 'Expired cache entries will be cleaned up automatically'
        })
        
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action',
          supportedActions: ['clear-all', 'clear-expired']
        }, { status: 400 })
    }
    
  } catch (error) {
    console.error('Cache management API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to perform cache action',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}