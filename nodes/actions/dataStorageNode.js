/*
=================================================================
BACKEND FILE: backend/nodes/actions/dataStorageNode.js
=================================================================
Data Storage node for storing and retrieving data.
Simplified version copied from WorkflowNode.
*/

class DataStorageNode {
    constructor(config) {
        this.config = config;
        this.storage = new Map(); // In-memory storage for now
    }

    async process(inputData) {
        console.log('💾 Data Storage Node Execution');
        
        const key = this.config.storageKey || 'default';
        
        if (this.config.operation === 'store') {
            this.storage.set(key, inputData);
            return {
                operation: 'store',
                key: key,
                stored: true,
                timestamp: new Date().toISOString()
            };
        } else {
            const storedData = this.storage.get(key);
            return {
                operation: 'retrieve',
                key: key,
                data: storedData,
                timestamp: new Date().toISOString()
            };
        }
    }
}

module.exports = DataStorageNode;