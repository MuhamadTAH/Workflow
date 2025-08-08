/*
=================================================================
BACKEND FILE: backend/controllers/nodeController.js
=================================================================
This controller contains the logic to execute a specific node.
Copied from WorkflowNode and adapted for main backend.
*/

const aiAgentNode = require('../nodes/actions/aiAgentNode');
const modelNode = require('../nodes/actions/modelNode');
const googleDocsNode = require('../nodes/actions/googleDocsNode');
const DataStorageNode = require('../nodes/actions/dataStorageNode');
const telegramSendMessageNode = require('../nodes/actions/telegramSendMessageNode');

const runNode = async (req, res) => {
    try {
        const { node, inputData, connectedNodes } = req.body;

        if (!node || !node.type) {
            return res.status(400).json({ message: 'A valid node object is required.' });
        }

        let result;

        console.log('=== Node Execution ===');
        console.log('Node type:', node.type);
        console.log('Connected nodes:', connectedNodes ? connectedNodes.length : 0);
        console.log('Input data preview:', JSON.stringify(inputData, null, 2).substring(0, 200) + '...');

        // Execute different node types
        switch (node.type) {
            case 'aiAgent':
                result = await aiAgentNode.execute(node.config, inputData, connectedNodes);
                break;
            
            case 'modelNode':
                result = await modelNode.execute(node.config, inputData);
                break;
            
            case 'googleDocs':
                result = await googleDocsNode.execute(node.config, inputData);
                break;
            
            case 'dataStorage':
                const dataStorageInstance = new DataStorageNode(node.config);
                result = await dataStorageInstance.process(inputData);
                break;
            
            case 'telegramSendMessage':
                result = await telegramSendMessageNode.execute(node.config, inputData, connectedNodes);
                break;
            
            case 'telegramTrigger':
                // Trigger nodes don't execute - they start workflows
                // Return any sample/test data that was generated
                result = {
                    success: true,
                    message: 'Telegram trigger node activated',
                    data: inputData || node.config.outputData || null,
                    timestamp: new Date().toISOString()
                };
                break;
            
            default:
                return res.status(400).json({ message: `Unsupported node type: ${node.type}` });
        }

        console.log('✅ Node execution completed successfully');
        console.log('Result preview:', JSON.stringify(result, null, 2).substring(0, 200) + '...');

        res.json({
            success: true,
            result: result,
            nodeType: node.type,
            executedAt: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Node execution failed:', error.message);
        console.error('Error stack:', error.stack);
        
        res.status(500).json({
            success: false,
            message: `Node execution failed: ${error.message}`,
            nodeType: req.body.node?.type,
            error: error.message
        });
    }
};

module.exports = {
    runNode
};