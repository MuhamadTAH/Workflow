/*
=================================================================
FILE: backend/services/scheduler.js
=================================================================
Simple scheduler service for time-based workflow triggers
*/

const { logWorkflowTriggered } = require('../controllers/workflowController');

class WorkflowScheduler {
    constructor() {
        this.schedules = new Map(); // workflowId -> schedule config
        this.intervals = new Map(); // workflowId -> interval ID
        this.workflowExecutor = null;
    }

    // Set the workflow executor reference
    setWorkflowExecutor(executor) {
        this.workflowExecutor = executor;
        console.log('📅 Scheduler linked to WorkflowExecutor');
    }

    // Schedule a workflow to run at intervals
    scheduleWorkflow(workflowId, scheduleConfig) {
        try {
            console.log(`⏰ Scheduling workflow ${workflowId}:`, scheduleConfig);
            
            // Store schedule config
            this.schedules.set(workflowId, scheduleConfig);
            
            // Clear existing schedule if any
            this.unscheduleWorkflow(workflowId);
            
            const { intervalMinutes, enabled = true } = scheduleConfig;
            
            if (!enabled || !intervalMinutes || intervalMinutes <= 0) {
                console.log(`⏸️ Schedule disabled or invalid for workflow ${workflowId}`);
                return false;
            }
            
            const intervalMs = intervalMinutes * 60 * 1000;
            
            // Create interval
            const intervalId = setInterval(async () => {
                await this.executeScheduledWorkflow(workflowId, scheduleConfig);
            }, intervalMs);
            
            this.intervals.set(workflowId, intervalId);
            
            console.log(`✅ Workflow ${workflowId} scheduled to run every ${intervalMinutes} minutes`);
            return true;
            
        } catch (error) {
            console.error(`❌ Failed to schedule workflow ${workflowId}:`, error.message);
            return false;
        }
    }

    // Execute a scheduled workflow
    async executeScheduledWorkflow(workflowId, scheduleConfig) {
        try {
            if (!this.workflowExecutor) {
                console.error('❌ WorkflowExecutor not available for scheduled execution');
                return;
            }

            if (!this.workflowExecutor.activeWorkflows.has(workflowId)) {
                console.warn(`⚠️ Scheduled workflow ${workflowId} is no longer active, removing schedule`);
                this.unscheduleWorkflow(workflowId);
                return;
            }

            console.log(`⏰ Executing scheduled workflow: ${workflowId}`);

            // Prepare trigger data
            const triggerData = [{
                json: {
                    type: 'scheduled_trigger',
                    timestamp: new Date().toISOString(),
                    scheduleConfig: scheduleConfig,
                    executionNumber: this.getExecutionCount(workflowId),
                    nextExecution: new Date(Date.now() + (scheduleConfig.intervalMinutes * 60 * 1000)).toISOString()
                },
                nodeId: `schedule-trigger-${workflowId}`,
                nodeType: 'scheduleTrigger'
            }];

            // Log the workflow trigger event
            logWorkflowTriggered(workflowId, 'scheduleTrigger', triggerData[0].json);

            // Execute the workflow
            const executionResult = await this.workflowExecutor.executeWorkflow(workflowId, triggerData);
            console.log(`✅ Scheduled workflow ${workflowId} executed successfully:`, executionResult.status);

            // Increment execution count
            this.incrementExecutionCount(workflowId);

        } catch (error) {
            console.error(`❌ Scheduled workflow execution failed for ${workflowId}:`, error.message);
        }
    }

    // Remove schedule for a workflow
    unscheduleWorkflow(workflowId) {
        const intervalId = this.intervals.get(workflowId);
        if (intervalId) {
            clearInterval(intervalId);
            this.intervals.delete(workflowId);
            console.log(`🛑 Unscheduled workflow: ${workflowId}`);
        }
        
        this.schedules.delete(workflowId);
        this.resetExecutionCount(workflowId);
    }

    // Get schedule info for a workflow
    getScheduleInfo(workflowId) {
        const schedule = this.schedules.get(workflowId);
        const isActive = this.intervals.has(workflowId);
        
        return {
            workflowId,
            schedule,
            isActive,
            executionCount: this.getExecutionCount(workflowId),
            nextExecution: schedule && isActive ? 
                new Date(Date.now() + (schedule.intervalMinutes * 60 * 1000)).toISOString() : null
        };
    }

    // Get all active schedules
    getAllSchedules() {
        const schedules = [];
        for (const [workflowId, config] of this.schedules.entries()) {
            schedules.push(this.getScheduleInfo(workflowId));
        }
        return schedules;
    }

    // Execution count tracking
    getExecutionCount(workflowId) {
        return this._executionCounts?.get(workflowId) || 0;
    }

    incrementExecutionCount(workflowId) {
        if (!this._executionCounts) this._executionCounts = new Map();
        const current = this._executionCounts.get(workflowId) || 0;
        this._executionCounts.set(workflowId, current + 1);
    }

    resetExecutionCount(workflowId) {
        if (this._executionCounts) {
            this._executionCounts.delete(workflowId);
        }
    }

    // Cleanup all schedules
    cleanup() {
        console.log('🧹 Cleaning up all scheduled workflows');
        for (const workflowId of this.intervals.keys()) {
            this.unscheduleWorkflow(workflowId);
        }
    }
}

// Export singleton instance
const scheduler = new WorkflowScheduler();

module.exports = scheduler;