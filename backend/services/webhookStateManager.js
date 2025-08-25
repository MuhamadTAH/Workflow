/*
=================================================================
FILE: backend/services/webhookStateManager.js
=================================================================
Webhook State Manager - Manages webhook waiting states for real-time message capture
*/

class WebhookStateManager {
    constructor() {
        this.waitingExecutions = new Map(); // executionId -> { resolve, reject, timeout, timestamp }
        this.cleanupInterval = setInterval(() => this.cleanup(), 5000); // Cleanup every 5 seconds
    }

    /**
     * Start waiting for webhook data for a specific execution
     */
    startWaiting(executionId, timeoutMs = 30000) {
        return new Promise((resolve, reject) => {
            // Clear any existing waiting state for this execution
            this.stopWaiting(executionId);

            // Set up timeout
            const timeout = setTimeout(() => {
                this.stopWaiting(executionId);
                resolve({
                    success: false,
                    error: 'Webhook timeout - no WhatsApp message received within 30 seconds',
                    nodeType: 'whatsappTrigger',
                    timestamp: new Date().toISOString(),
                    isTimeout: true
                });
            }, timeoutMs);

            // Store waiting state
            this.waitingExecutions.set(executionId, {
                resolve,
                reject,
                timeout,
                timestamp: Date.now(),
                timeoutMs
            });

            console.log(`📱 Started webhook waiting for execution: ${executionId} (timeout: ${timeoutMs}ms)`);
        });
    }

    /**
     * Stop waiting for a specific execution
     */
    stopWaiting(executionId) {
        const waitingState = this.waitingExecutions.get(executionId);
        if (waitingState) {
            clearTimeout(waitingState.timeout);
            this.waitingExecutions.delete(executionId);
            console.log(`🛑 Stopped webhook waiting for execution: ${executionId}`);
        }
    }

    /**
     * Check if an execution is currently waiting
     */
    isWaiting(executionId) {
        return this.waitingExecutions.has(executionId);
    }

    /**
     * Get all waiting executions
     */
    getWaitingExecutions() {
        return Array.from(this.waitingExecutions.keys());
    }

    /**
     * Resolve waiting execution with webhook data
     */
    resolveWaiting(executionId, webhookData) {
        const waitingState = this.waitingExecutions.get(executionId);
        if (waitingState) {
            clearTimeout(waitingState.timeout);
            this.waitingExecutions.delete(executionId);
            
            console.log(`✅ Resolved webhook waiting for execution: ${executionId}`);
            waitingState.resolve(webhookData);
            return true;
        }
        return false;
    }

    /**
     * Try to match incoming webhook to any waiting execution
     * Returns the executionId that was resolved, or null if no match
     */
    matchAndResolve(webhookData) {
        // For WhatsApp, we'll resolve the first waiting execution
        // In more complex scenarios, you could match based on phone number, message content, etc.
        const waitingExecutions = Array.from(this.waitingExecutions.keys());
        
        if (waitingExecutions.length > 0) {
            const executionId = waitingExecutions[0]; // Get the first waiting execution
            
            console.log(`🎯 Matching webhook data to waiting execution: ${executionId}`);
            this.resolveWaiting(executionId, webhookData);
            return executionId;
        }
        
        return null;
    }

    /**
     * Clean up expired waiting states
     */
    cleanup() {
        const now = Date.now();
        for (const [executionId, waitingState] of this.waitingExecutions.entries()) {
            const elapsed = now - waitingState.timestamp;
            if (elapsed > waitingState.timeoutMs + 5000) { // 5 seconds grace period
                console.log(`🧹 Cleaning up expired waiting state: ${executionId}`);
                this.stopWaiting(executionId);
            }
        }
    }

    /**
     * Get status of all waiting executions
     */
    getStatus() {
        const status = {
            totalWaiting: this.waitingExecutions.size,
            executions: []
        };

        for (const [executionId, waitingState] of this.waitingExecutions.entries()) {
            const elapsed = Date.now() - waitingState.timestamp;
            const remaining = Math.max(0, waitingState.timeoutMs - elapsed);
            
            status.executions.push({
                executionId,
                elapsedMs: elapsed,
                remainingMs: remaining,
                startTime: new Date(waitingState.timestamp).toISOString()
            });
        }

        return status;
    }

    /**
     * Shutdown the webhook state manager
     */
    shutdown() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        
        // Reject all pending promises
        for (const [executionId, waitingState] of this.waitingExecutions.entries()) {
            waitingState.reject(new Error('Webhook state manager shutdown'));
        }
        
        this.waitingExecutions.clear();
        console.log('🔌 Webhook state manager shutdown complete');
    }
}

// Create singleton instance
const webhookStateManager = new WebhookStateManager();

// Graceful shutdown handling
process.on('SIGTERM', () => webhookStateManager.shutdown());
process.on('SIGINT', () => webhookStateManager.shutdown());

module.exports = webhookStateManager;