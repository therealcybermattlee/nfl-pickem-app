import { NextRequest, NextResponse } from 'next/server'
import { JobQueue } from '@/lib/jobs/JobQueue'
import { JobStatus } from '@/lib/jobs/jobs/BaseJob'


export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('jobId')
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    
    const jobQueue = JobQueue.getInstance()
    
    // Get specific job
    if (jobId) {
      const job = jobQueue.getJob(jobId)
      if (!job) {
        return NextResponse.json({
          success: false,
          error: 'Job not found'
        }, { status: 404 })
      }
      
      return NextResponse.json({
        success: true,
        job: job.toJSON()
      })
    }
    
    // Get jobs by status
    if (status) {
      const statusEnum = status.toUpperCase() as keyof typeof JobStatus
      if (!JobStatus[statusEnum]) {
        return NextResponse.json({
          success: false,
          error: 'Invalid status',
          validStatuses: Object.values(JobStatus)
        }, { status: 400 })
      }
      
      const jobs = jobQueue.getJobsByStatus(JobStatus[statusEnum])
      return NextResponse.json({
        success: true,
        jobs: jobs.map(job => job.toJSON()),
        count: jobs.length,
        filter: { status: JobStatus[statusEnum] }
      })
    }
    
    // Get jobs by type
    if (type) {
      const jobs = jobQueue.getJobsByType(type)
      return NextResponse.json({
        success: true,
        jobs: jobs.map(job => job.toJSON()),
        count: jobs.length,
        filter: { type }
      })
    }
    
    // Get all jobs and stats
    const stats = jobQueue.getStats()
    const healthCheck = jobQueue.getHealthCheck()
    const recentJobs = jobQueue.getAllJobs()
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 20) // Last 20 jobs
    
    return NextResponse.json({
      success: true,
      stats,
      health: healthCheck,
      recentJobs: recentJobs.map(job => job.toJSON())
    })
    
  } catch (error) {
    console.error('Job status API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to get job status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body
    
    const jobQueue = JobQueue.getInstance()
    
    switch (action) {
      case 'clear-completed':
        const cleared = jobQueue.clearCompleted()
        return NextResponse.json({
          success: true,
          message: `Cleared ${cleared} completed jobs`
        })
        
      case 'start-processing':
        jobQueue.startProcessing()
        return NextResponse.json({
          success: true,
          message: 'Job processing started'
        })
        
      case 'stop-processing':
        jobQueue.stopProcessing()
        return NextResponse.json({
          success: true,
          message: 'Job processing stopped'
        })
        
      default:
        return NextResponse.json({
          success: false,
          error: 'Unknown action',
          supportedActions: ['clear-completed', 'start-processing', 'stop-processing']
        }, { status: 400 })
    }
    
  } catch (error) {
    console.error('Job status POST API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to execute action',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}