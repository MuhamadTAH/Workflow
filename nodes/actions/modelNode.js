/*
=================================================================
BACKEND FILE: backend/nodes/actions/modelNode.js
=================================================================
Model node for AI model configuration.
Simplified version copied from WorkflowNode.
*/

const modelNode = {
    description: {
        displayName: 'Model',
        name: 'modelNode',
        icon: 'fa:cog',
        group: 'actions',
        version: 1,
        description: 'Configures AI model settings.',
        defaults: {
            name: 'Model',
        },
        properties: [
            {
                displayName: 'Model Name',
                name: 'modelName',
                type: 'string',
                default: 'claude-3-5-sonnet-20241022',
                required: true,
                description: 'Name of the AI model to use.',
            }
        ],
    },

    async execute(nodeData, inputData) {
        console.log('🔧 Model Node Execution');
        
        return {
            model: nodeData.modelName,
            timestamp: new Date().toISOString(),
            inputData: inputData
        };
    }
};

module.exports = modelNode;