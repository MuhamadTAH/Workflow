/*
=================================================================
FILE: backend/routes/jobs.js
=================================================================
Job queue management and monitoring API endpoints
*/

const express = require('express');
const router = express.Router();
const jobQueue = require('../services/jobQueue');
const { asyncHandler } = require('../middleware/errorHandler');

// Get queue status and statistics
router.get('/status', asyncHandler(async (req, res) => {
    const status = jobQueue.getQueueStatus();
    
    res.json({
        success: true,
        queue: status,
        timestamp: new Date().toISOString(),
        server: {
            uptime: process.uptime(),
            memory: process.memoryUsage()
        }
    });
}));

// Get specific job details
router.get('/:jobId', asyncHandler(async (req, res) => {
    const { jobId } = req.params;
    const jobStatus = jobQueue.getJobStatus(jobId);
    
    if (!jobStatus) {
        return res.status(404).json({
            success: false,
            message: 'Job not found',
            jobId
        });
    }
    
    res.json({
        success: true,
        job: jobStatus
    });
}));

// Get job execution logs (if available)
router.get('/:jobId/logs', asyncHandler(async (req, res) => {
    const { jobId } = req.params;
    const job = jobQueue.getJob(jobId);
    
    if (!job) {
        return res.status(404).json({
            success: false,
            message: 'Job not found',
            jobId
        });
    }
    
    // Return basic job log information
    res.json({
        success: true,
        jobId,
        logs: {
            created: job.createdAt,
            started: job.startedAt,
            completed: job.completedAt,
            failed: job.failedAt,
            status: job.status,
            retryCount: job.retryCount,
            lastError: job.lastError,
            executionTime: job.executionTime
        }
    });
}));

// Manually queue a workflow execution
router.post('/queue', asyncHandler(async (req, res) => {
    const { workflowId, triggerData, priority = 'normal', triggerType = 'manual' } = req.body;
    
    if (!workflowId) {
        return res.status(400).json({
            success: false,
            message: 'workflowId is required'
        });
    }
    
    const jobResult = await jobQueue.addJob({
        workflowId,
        triggerData: triggerData || {
            type: 'manual_queue',
            message: 'Manually queued job',
            timestamp: new Date().toISOString()
        },
        triggerType,
        priority,
        metadata: {
            source: 'api_endpoint',
            queuedBy: 'user',
            ip: req.ip
        }
    });
    
    res.status(201).json({
        success: true,
        message: 'Job queued successfully',
        job: jobResult
    });
}));

// Get queue statistics
router.get('/stats/overview', asyncHandler(async (req, res) => {
    const status = jobQueue.getQueueStatus();
    
    // Calculate additional statistics
    const totalJobs = status.total;
    const successRate = totalJobs > 0 ? (status.completed / totalJobs * 100).toFixed(2) : 0;
    const failureRate = totalJobs > 0 ? (status.failed / totalJobs * 100).toFixed(2) : 0;
    
    res.json({
        success: true,
        stats: {
            queue: status,
            performance: {
                totalJobs,
                successRate: `${successRate}%`,
                failureRate: `${failureRate}%`,
                averageWaitTime: '~30s', // Could be calculated from historical data
                throughput: `${status.completed} jobs completed`
            },
            system: {
                maxConcurrentJobs: status.maxConcurrent,
                currentLoad: `${status.executing}/${status.maxConcurrent}`,
                queueUtilization: totalJobs > 0 ? `${((status.executing + status.queued) / totalJobs * 100).toFixed(1)}%` : '0%'
            }
        }
    });
}));

// Pause queue processing
router.post('/control/pause', asyncHandler(async (req, res) => {
    jobQueue.pause();
    
    res.json({
        success: true,
        message: 'Job queue processing paused',
        status: 'paused'
    });
}));

// Resume queue processing
router.post('/control/resume', asyncHandler(async (req, res) => {
    jobQueue.resume();
    
    res.json({
        success: true,
        message: 'Job queue processing resumed',
        status: 'active'
    });
}));

// Get recent completed jobs
router.get('/history/completed', asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit) || 10;
    const completedJobs = [];
    
    // Get last N completed jobs (this is a simple implementation)
    for (const [jobId, result] of jobQueue.completed.entries()) {
        if (completedJobs.length >= limit) break;
        
        completedJobs.push({
            jobId,
            workflowId: result.workflowId,
            completedAt: result.completedAt,
            executionTime: result.executionTime,
            retryCount: result.retryCount,
            status: 'completed'
        });
    }
    
    res.json({
        success: true,
        jobs: completedJobs.slice(0, limit),
        count: completedJobs.length
    });
}));

// Get recent failed jobs
router.get('/history/failed', asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit) || 10;
    const failedJobs = [];
    
    // Get last N failed jobs
    for (const [jobId, failure] of jobQueue.failed.entries()) {
        if (failedJobs.length >= limit) break;
        
        failedJobs.push({
            jobId,
            workflowId: failure.workflowId,
            failedAt: failure.failedAt,
            error: failure.error,
            retryCount: failure.retryCount,
            status: 'failed'
        });
    }
    
    res.json({
        success: true,
        jobs: failedJobs.slice(0, limit),
        count: failedJobs.length
    });
}));

// Health check endpoint
router.get('/health', asyncHandler(async (req, res) => {
    const status = jobQueue.getQueueStatus();
    const isHealthy = status.executing < status.maxConcurrent && status.queued < 100; // Arbitrary health thresholds
    
    res.status(isHealthy ? 200 : 503).json({
        success: isHealthy,
        health: isHealthy ? 'healthy' : 'degraded',
        queue: status,
        timestamp: new Date().toISOString()
    });
}));

module.exports = router;