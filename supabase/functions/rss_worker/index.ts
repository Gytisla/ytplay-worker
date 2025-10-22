import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { handleRSSPollChannel } from '../workers/handlers/rss-poll.ts'

/* eslint-disable @typescript-eslint/no-explicit-any */

// Define types locally for Edge Function

interface JobResult {
  success: boolean
  jobId: string
  jobType: string
  error?: string
  executionTimeMs: number
  itemsProcessed?: number
}

interface RequestBody {
  workerId?: string
  maxJobs?: number
  jobTypes?: string[]
}

interface ResponseBody {
  success: boolean
  jobsProcessed: number
  results: JobResult[]
  error?: string
  executionTimeMs: number
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Job type handlers - only RSS_POLL_CHANNEL for this specialized worker
declare const Deno: any

const jobHandlers: Record<string, (payload: any, supabase: any) => Promise<{ success: boolean; itemsProcessed?: number; error?: string }>> = {
  'RSS_POLL_CHANNEL': async (payload, supabase) => {
    try {
      const res = await handleRSSPollChannel(payload, supabase)
      return { success: res.success, ...(typeof res.itemsProcessed === 'number' ? { itemsProcessed: res.itemsProcessed } : {}), ...(res.error ? { error: res.error } : {}) }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  },
}

// Use the standard Request type for the handler parameter
Deno.serve(async (req: Request) => {
  const startTime = Date.now()
  const workerId = `rss-worker-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse request body
    const body: RequestBody = await req.json().catch(() => ({}))
    const maxJobs = Math.min(body.maxJobs ?? 1, 20) // Max 20 jobs per request for RSS worker
    const jobTypes = ['RSS_POLL_CHANNEL'] // Only process RSS_POLL_CHANNEL jobs

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Dequeue jobs for processing - only RSS_POLL_CHANNEL
    const { data: jobs, error: dequeueError } = await supabase
      .rpc('secure_dequeue_jobs', {
        worker_id_param: workerId,
        job_types_param: jobTypes,
        limit_param: maxJobs
      })

    if (dequeueError) {
      throw new Error(`Failed to dequeue jobs: ${dequeueError.message}`)
    }

    if (!jobs || jobs.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          jobsProcessed: 0,
          results: [],
          executionTimeMs: Date.now() - startTime,
        } as ResponseBody),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    console.log(`Processing ${jobs.length} RSS jobs with worker ${workerId}`)

    // Process each job
    const results: JobResult[] = []
    for (const job of jobs) {
      const jobStartTime = Date.now()

      try {
        // Get job handler - should always be RSS_POLL_CHANNEL
        const handler = jobHandlers[job.job_type]
        if (!handler) {
          throw new Error(`Unknown job type: ${job.job_type}`)
        }

        // Execute job handler
        const result = await handler(job.payload, supabase)

        // Mark job as completed or failed based on handler result
        if (result.success) {
          const { error: ackError } = await supabase
            .rpc('secure_complete_job', {
              job_id_param: job.job_id
            })

          if (ackError) {
            console.error(`Failed to acknowledge job ${job.job_id}:`, ackError)
          }
        } else {
          const { error: failError } = await supabase
            .rpc('secure_fail_job', {
              job_id_param: job.job_id,
              error_message_param: result.error || 'Job handler returned success: false'
            })

          if (failError) {
            console.error(`Failed to mark job ${job.job_id} as failed:`, failError)
          }
        }

        results.push({
          success: result.success,
          jobId: job.job_id,
          jobType: job.job_type,
          ...(result.error && { error: result.error }),
          executionTimeMs: Date.now() - jobStartTime,
          ...(result.itemsProcessed && { itemsProcessed: result.itemsProcessed })
        })

        console.log(`Job ${job.job_id} (${job.job_type}) ${result.success ? 'completed' : 'failed'} in ${Date.now() - jobStartTime}ms`)

      } catch (error) {
        console.error(`Job ${job.job_id} execution failed:`, error)

        // Mark job as failed
        const { error: failError } = await supabase
          .rpc('secure_fail_job', {
            job_id_param: job.job_id,
            error_message_param: error instanceof Error ? error.message : 'Unknown error'
          })

        if (failError) {
          console.error(`Failed to mark job ${job.job_id} as failed:`, failError)
        }

        results.push({
          success: false,
          jobId: job.job_id,
          jobType: job.job_type,
          error: error instanceof Error ? error.message : 'Unknown error',
          executionTimeMs: Date.now() - jobStartTime
        })
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        jobsProcessed: jobs.length,
        results,
        executionTimeMs: Date.now() - startTime,
      } as ResponseBody),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('RSS worker error:', error)

    const response: ResponseBody = {
      success: false,
      jobsProcessed: 0,
      results: [],
      error: error instanceof Error ? error.message : 'Unknown error',
      executionTimeMs: Date.now() - startTime,
    }

    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})