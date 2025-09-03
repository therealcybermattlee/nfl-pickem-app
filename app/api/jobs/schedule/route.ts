import { NextRequest, NextResponse } from 'next/server'
import { JobQueue } from '@/lib/jobs/JobQueue'
import { OddsUpdateJob } from '@/lib/jobs/jobs/OddsUpdateJob'
import { JobPriority } from '@/lib/jobs/jobs/BaseJob'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      type, 
      priority = 'normal', 
      scheduledFor, 
      week, 
      season, 
      gameIds,
      forceUpdate = false 
    } = body
    
    const jobQueue = JobQueue.getInstance()
    
    let job
    const priorityEnum = priority === 'high' ? JobPriority.HIGH : 
                        priority === 'low' ? JobPriority.LOW :
                        priority === 'critical' ? JobPriority.CRITICAL :
                        JobPriority.NORMAL
    
    switch (type) {
      case 'odds-update':
        if (gameIds && Array.isArray(gameIds)) {
          // Game-specific update
          job = OddsUpdateJob.createGameSpecificJob(gameIds, priorityEnum)
        } else if (scheduledFor) {
          // Scheduled update
          job = OddsUpdateJob.createScheduledJob(
            new Date(scheduledFor),
            week,
            season,
            priorityEnum
          )
        } else {
          // Immediate weekly update
          job = OddsUpdateJob.createWeeklyUpdateJob(week, season, priorityEnum)
        }
        break
        
      default:
        return NextResponse.json({
          success: false,
          error: 'Unknown job type',
          supportedTypes: ['odds-update']
        }, { status: 400 })
    }
    
    const success = await jobQueue.addJob(job)
    
    if (!success) {
      return NextResponse.json({
        success: false,
        error: 'Failed to add job to queue (queue may be full or job already exists)'
      }, { status: 409 })
    }
    
    // Ensure processing is running
    jobQueue.startProcessing()
    
    return NextResponse.json({
      success: true,
      jobId: job.id,
      message: `Job ${job.id} scheduled successfully`,
      job: job.toJSON()
    })
    
  } catch (error) {
    console.error('Job schedule API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to schedule job',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    const jobQueue = JobQueue.getInstance()
    const jobs = jobQueue.getAllJobs()
    
    return NextResponse.json({
      success: true,
      jobs: jobs.map(job => job.toJSON()),
      count: jobs.length
    })
    
  } catch (error) {
    console.error('Job schedule GET API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to get scheduled jobs',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('jobId')
    
    if (!jobId) {
      return NextResponse.json({
        success: false,
        error: 'Job ID is required'
      }, { status: 400 })
    }
    
    const jobQueue = JobQueue.getInstance()
    const success = jobQueue.removeJob(jobId)
    
    if (!success) {
      return NextResponse.json({
        success: false,
        error: 'Job not found or cannot be removed (may be running)'
      }, { status: 404 })
    }
    
    return NextResponse.json({
      success: true,
      message: `Job ${jobId} removed successfully`
    })
    
  } catch (error) {
    console.error('Job schedule DELETE API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to remove job',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}