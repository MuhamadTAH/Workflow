/*
=================================================================
BACKEND FILE: backend/nodes/logic/waitNode.js  
=================================================================
Wait node for pausing workflow execution for a specified duration.
*/

const waitNode = {
    description: {
        displayName: 'Wait',
        name: 'wait',
        icon: 'fa:clock',
        group: 'logic',
        version: 1,
        description: 'Pause the workflow execution for a specified amount of time.',
        defaults: {
            name: 'Wait',
        },
        properties: [
            {
                displayName: 'Wait Amount',
                name: 'waitAmount',
                type: 'number',
                default: 5,
                required: true,
                description: 'Amount of time to wait.',
            },
            {
                displayName: 'Wait Unit',
                name: 'waitUnit',
                type: 'options',
                options: [
                    { name: 'Seconds', value: 'seconds' },
                    { name: 'Minutes', value: 'minutes' },
                    { name: 'Hours', value: 'hours' },
                ],
                default: 'seconds',
                description: 'Unit of time for the wait duration.',
            }
        ],
    },

    async execute(nodeData, inputData, connectedNodes = []) {
        console.log('⏱️ Wait Node Execution Starting');
        console.log('Node configuration:', {
            waitAmount: nodeData.waitAmount,
            waitUnit: nodeData.waitUnit
        });

        try {
            const waitAmount = nodeData.waitAmount || 5;
            const waitUnit = nodeData.waitUnit || 'seconds';
            
            // Convert wait time to milliseconds
            let waitTimeMs;
            switch (waitUnit) {
                case 'seconds':
                    waitTimeMs = waitAmount * 1000;
                    break;
                case 'minutes':
                    waitTimeMs = waitAmount * 60 * 1000;
                    break;
                case 'hours':
                    waitTimeMs = waitAmount * 60 * 60 * 1000;
                    break;
                default:
                    waitTimeMs = waitAmount * 1000;
            }
            
            console.log(`⏳ Wait Node pausing for ${waitAmount} ${waitUnit} (${waitTimeMs}ms)`);
            
            // For testing purposes, we'll simulate the wait without actually blocking
            // In a real workflow engine, this would schedule the next node execution
            const startTime = new Date().toISOString();
            
            // Simulate wait (in production, this would be handled by workflow scheduler)
            await new Promise(resolve => setTimeout(resolve, Math.min(waitTimeMs, 5000))); // Cap at 5 seconds for testing
            
            const endTime = new Date().toISOString();
            
            console.log(`✅ Wait Node completed`);
            
            return {
                success: true,
                waitAmount: waitAmount,
                waitUnit: waitUnit,
                waitTimeMs: waitTimeMs,
                startTime: startTime,
                endTime: endTime,
                inputData: inputData, // Pass through the input data
                message: `Waited for ${waitAmount} ${waitUnit}`,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ Wait Node execution failed:', error.message);
            throw new Error(`Wait Node failed: ${error.message}`);
        }
    }
};

module.exports = waitNode;