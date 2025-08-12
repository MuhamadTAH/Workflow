/*
=================================================================
BACKEND FILE: backend/nodes/actions/googleDocsNode.js
=================================================================
Google Docs node placeholder.
Simplified version copied from WorkflowNode.
*/

const googleDocsNode = {
    description: {
        displayName: 'Google Docs',
        name: 'googleDocs',
        icon: 'fa:file-text',
        group: 'actions',
        version: 1,
        description: 'Interacts with Google Docs.',
        defaults: {
            name: 'Google Docs',
        },
        properties: [
            {
                displayName: 'Action',
                name: 'action',
                type: 'options',
                options: [
                    { name: 'Create Document', value: 'create' },
                    { name: 'Read Document', value: 'read' },
                ],
                default: 'create',
                required: true,
                description: 'Action to perform.',
            }
        ],
    },

    async execute(nodeData, inputData) {
        console.log('📄 Google Docs Node Execution');
        
        // Placeholder implementation
        return {
            action: nodeData.action,
            timestamp: new Date().toISOString(),
            result: 'Google Docs action completed (placeholder)',
            inputData: inputData
        };
    }
};

module.exports = googleDocsNode;