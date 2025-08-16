/*
=================================================================
FILE: backend/services/jobQueue.js
=================================================================
Asynchronous job queue system for workflow execution
Based on n8n-like queue management with retry logic and concurrency control
*/

const { logWorkflowEvent } = require('../controllers/workflowController');

class JobQueue {
    constructor() {
        this.jobs = new Map(); // jobId -> job data
        this.queue = []; // Array of job IDs waiting for execution
        this.executing = new Map(); // jobId -> execution promise
        this.completed = new Map(); // jobId -> completion result
        this.failed = new Map(); // jobId -> failure result
        
        this.config = {
            maxConcurrentJobs: 3, // Process 3 workflows simultaneously
            maxRetries: 3, // Retry failed jobs up to 3 times
            retryDelay: 2000, // Base delay between retries (2 seconds)
            jobTimeout: 300000, // 5 minutes timeout per job
            cleanupInterval: 600000, // Clean old jobs every 10 minutes
        };
        
        this.workflowExecutor = null;
        this.isProcessing = false;
        
        // Start the queue processor
        this.startProcessor();
        
        // Start cleanup routine
        this.startCleanup();
        
        console.log('🚀 Job Queue initialized with config:', this.config);
    }

    // Set workflow executor reference
    setWorkflowExecutor(executor) {
        this.workflowExecutor = executor;
        console.log('🔗 Job Queue linked to WorkflowExecutor');
    }

    // Add a job to the queue
    async addJob(jobData) {
        const jobId = this.generateJobId();
        const job = {
            id: jobId,
            workflowId: jobData.workflowId,
            triggerData: jobData.triggerData,
            triggerType: jobData.triggerType,
            priority: jobData.priority || 'normal', // high, normal, low
            retryCount: 0,
            maxRetries: jobData.maxRetries || this.config.maxRetries,
            createdAt: new Date().toISOString(),
            status: 'queued',
            metadata: jobData.metadata || {}
        };

        this.jobs.set(jobId, job);
        
        // Add to queue based on priority
        if (job.priority === 'high') {
            this.queue.unshift(jobId); // Add to front
        } else {
            this.queue.push(jobId); // Add to back
        }

        console.log(`📥 Job ${jobId} added to queue (Priority: ${job.priority}, Queue size: ${this.queue.length})`);
        
        logWorkflowEvent('JOB_QUEUED', `Job ${jobId} queued for workflow ${job.workflowId}`, {
            'Job ID': jobId,
            'Workflow': job.workflowId,
            'Priority': job.priority,
            'Queue Size': this.queue.length,
            'Trigger Type': job.triggerType
        });

        // Start processing if not already running
        this.processQueue();

        return {
            jobId,
            status: 'queued',
            position: this.queue.indexOf(jobId) + 1,
            estimatedWaitTime: this.estimateWaitTime(jobId)
        };
    }

    // Main queue processor
    async processQueue() {
        if (this.isProcessing) return;
        this.isProcessing = true;

        while (this.queue.length > 0 && this.executing.size < this.config.maxConcurrentJobs) {
            const jobId = this.queue.shift();
            const job = this.jobs.get(jobId);

            if (!job) continue;

            console.log(`🚀 Starting execution of job ${jobId} (${this.executing.size + 1}/${this.config.maxConcurrentJobs} slots)`);
            
            // Start job execution (don't await - run concurrently)
            const executionPromise = this.executeJob(job);
            this.executing.set(jobId, executionPromise);

            // Handle completion asynchronously
            executionPromise
                .then(result => this.handleJobCompletion(jobId, result))
                .catch(error => this.handleJobFailure(jobId, error))
                .finally(() => {
                    this.executing.delete(jobId);
                    // Continue processing queue
                    setTimeout(() => this.processQueue(), 100);
                });
        }

        this.isProcessing = false;
    }

    // Execute a single job
    async executeJob(job) {
        if (!this.workflowExecutor) {
            throw new Error('WorkflowExecutor not available');
        }

        // Check if workflow is still active
        if (!this.workflowExecutor.activeWorkflows.has(job.workflowId)) {
            throw new Error(`Workflow ${job.workflowId} is no longer active`);
        }

        // Update job status
        job.status = 'executing';
        job.startedAt = new Date().toISOString();

        console.log(`⚡ Executing job ${job.id} for workflow ${job.workflowId}`);
        
        logWorkflowEvent('JOB_STARTED', `Job ${job.id} execution started`, {
            'Job ID': job.id,
            'Workflow': job.workflowId,
            'Retry Count': job.retryCount,
            'Trigger Type': job.triggerType
        });

        // Set execution timeout
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Job execution timeout')), this.config.jobTimeout);
        });

        // Execute workflow with timeout
        const executionPromise = this.workflowExecutor.executeWorkflow(job.workflowId, job.triggerData);
        
        const result = await Promise.race([executionPromise, timeoutPromise]);
        
        job.completedAt = new Date().toISOString();
        job.executionTime = Date.parse(job.completedAt) - Date.parse(job.startedAt);

        return result;
    }

    // Handle successful job completion
    async handleJobCompletion(jobId, result) {
        const job = this.jobs.get(jobId);
        if (!job) return;

        job.status = 'completed';
        job.result = result;

        this.completed.set(jobId, {
            jobId,
            workflowId: job.workflowId,
            result,
            executionTime: job.executionTime,
            completedAt: job.completedAt,
            retryCount: job.retryCount
        });

        console.log(`✅ Job ${jobId} completed successfully in ${job.executionTime}ms`);
        
        logWorkflowEvent('JOB_COMPLETED', `Job ${jobId} completed successfully`, {
            'Job ID': jobId,
            'Workflow': job.workflowId,
            'Execution Time': `${job.executionTime}ms`,
            'Retry Count': job.retryCount,
            'Result Status': result.status
        });
    }

    // Handle job failure and retry logic
    async handleJobFailure(jobId, error) {
        const job = this.jobs.get(jobId);
        if (!job) return;

        job.retryCount++;
        job.lastError = error.message;

        console.log(`❌ Job ${jobId} failed: ${error.message} (Retry ${job.retryCount}/${job.maxRetries})`);

        if (job.retryCount < job.maxRetries) {
            // Calculate exponential backoff delay
            const delay = this.config.retryDelay * Math.pow(2, job.retryCount - 1);
            
            console.log(`🔄 Retrying job ${jobId} in ${delay}ms (Attempt ${job.retryCount + 1}/${job.maxRetries})`);
            
            job.status = 'retrying';
            
            logWorkflowEvent('JOB_RETRYING', `Job ${jobId} scheduled for retry`, {
                'Job ID': jobId,
                'Workflow': job.workflowId,
                'Retry Count': job.retryCount,
                'Max Retries': job.maxRetries,
                'Delay': `${delay}ms`,
                'Error': error.message
            });

            // Schedule retry
            setTimeout(() => {
                job.status = 'queued';
                this.queue.push(jobId); // Add back to queue
                this.processQueue();
            }, delay);
        } else {
            // Max retries exceeded
            job.status = 'failed';
            job.failedAt = new Date().toISOString();

            this.failed.set(jobId, {
                jobId,
                workflowId: job.workflowId,
                error: error.message,
                retryCount: job.retryCount,
                failedAt: job.failedAt
            });

            console.log(`💀 Job ${jobId} failed permanently after ${job.retryCount} retries`);
            
            logWorkflowEvent('JOB_FAILED', `Job ${jobId} failed permanently`, {
                'Job ID': jobId,
                'Workflow': job.workflowId,
                'Final Error': error.message,
                'Total Retries': job.retryCount,
                'Failed At': job.failedAt
            });
        }
    }

    // Get queue status
    getQueueStatus() {
        return {
            queued: this.queue.length,
            executing: this.executing.size,
            completed: this.completed.size,
            failed: this.failed.size,
            total: this.jobs.size,
            maxConcurrent: this.config.maxConcurrentJobs,
            nextJobs: this.queue.slice(0, 5).map(jobId => {
                const job = this.jobs.get(jobId);
                return {
                    jobId,
                    workflowId: job?.workflowId,
                    priority: job?.priority,
                    createdAt: job?.createdAt
                };
            })
        };
    }

    // Get job details
    getJob(jobId) {
        return this.jobs.get(jobId);
    }

    // Get job execution status
    getJobStatus(jobId) {
        const job = this.jobs.get(jobId);
        if (!job) return null;

        const baseStatus = {
            jobId,
            status: job.status,
            workflowId: job.workflowId,
            createdAt: job.createdAt,
            retryCount: job.retryCount
        };

        if (job.status === 'queued') {
            return {
                ...baseStatus,
                position: this.queue.indexOf(jobId) + 1,
                estimatedWaitTime: this.estimateWaitTime(jobId)
            };
        }

        if (job.status === 'executing') {
            return {
                ...baseStatus,
                startedAt: job.startedAt,
                runningTime: Date.now() - Date.parse(job.startedAt)
            };
        }

        if (job.status === 'completed') {
            return {
                ...baseStatus,
                completedAt: job.completedAt,
                executionTime: job.executionTime,
                result: job.result
            };
        }

        if (job.status === 'failed') {
            return {
                ...baseStatus,
                failedAt: job.failedAt,
                error: job.lastError
            };
        }

        return baseStatus;
    }

    // Estimate wait time for a job
    estimateWaitTime(jobId) {
        const position = this.queue.indexOf(jobId);
        if (position === -1) return 0;

        // Rough estimate: 30 seconds per job ahead + current executing jobs
        const averageJobTime = 30000; // 30 seconds
        const jobsAhead = position;
        const currentlyExecuting = this.executing.size;
        const availableSlots = Math.max(0, this.config.maxConcurrentJobs - currentlyExecuting);
        
        if (availableSlots > 0 && jobsAhead < availableSlots) {
            return 0; // Job will start immediately
        }

        return Math.ceil((jobsAhead - availableSlots) / this.config.maxConcurrentJobs) * averageJobTime;
    }

    // Generate unique job ID
    generateJobId() {
        return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Start the queue processor
    startProcessor() {
        // Process queue every 1 second
        setInterval(() => {
            if (this.queue.length > 0 && this.executing.size < this.config.maxConcurrentJobs) {
                this.processQueue();
            }
        }, 1000);
    }

    // Start cleanup routine
    startCleanup() {
        setInterval(() => {
            this.cleanupOldJobs();
        }, this.config.cleanupInterval);
    }

    // Clean up old completed/failed jobs
    cleanupOldJobs() {
        const now = Date.now();
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours

        let cleanedCount = 0;

        for (const [jobId, job] of this.jobs.entries()) {
            if (job.status === 'completed' || job.status === 'failed') {
                const jobAge = now - Date.parse(job.createdAt);
                if (jobAge > maxAge) {
                    this.jobs.delete(jobId);
                    this.completed.delete(jobId);
                    this.failed.delete(jobId);
                    cleanedCount++;
                }
            }
        }

        if (cleanedCount > 0) {
            console.log(`🧹 Cleaned up ${cleanedCount} old jobs`);
        }
    }

    // Pause queue processing
    pause() {
        this.isProcessing = false;
        console.log('⏸️ Job queue processing paused');
    }

    // Resume queue processing
    resume() {
        console.log('▶️ Job queue processing resumed');
        this.processQueue();
    }

    // Clear all jobs (for testing/emergency)
    clear() {
        this.queue.length = 0;
        this.jobs.clear();
        this.executing.clear();
        this.completed.clear();
        this.failed.clear();
        console.log('🗑️ Job queue cleared');
    }
}

// Export singleton instance
const jobQueue = new JobQueue();

module.exports = jobQueue;