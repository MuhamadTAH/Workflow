const { createBackendExecutionContext } = require('../../utils/executionContext');

class InstagramReplyCommentNode {
    constructor() {
        this.name = 'Instagram Reply Comment';
        this.type = 'instagramReplyComment';
        this.icon = 'fab fa-instagram';
        this.description = 'Reply to Instagram post comments';
    }

    getParameters() {
        return {
            accountId: {
                displayName: 'Account ID',
                name: 'accountId',
                type: 'string',
                default: '',
                required: true,
                description: 'Instagram Business Account ID'
            },
            commentId: {
                displayName: 'Comment ID',
                name: 'commentId',
                type: 'string',
                default: '',
                required: true,
                description: 'ID of the comment to reply to'
            },
            replyText: {
                displayName: 'Reply Text',
                name: 'replyText',
                type: 'string',
                typeOptions: {
                    rows: 3
                },
                default: 'Thanks for your comment!',
                required: true,
                description: 'Reply text (supports expressions)'
            },
            includeUsername: {
                displayName: 'Include @username',
                name: 'includeUsername',
                type: 'boolean',
                default: true,
                description: 'Include @username in the reply'
            },
            accessToken: {
                displayName: 'Access Token',
                name: 'accessToken',
                type: 'string',
                default: '',
                required: true,
                description: 'Instagram API Access Token'
            }
        };
    }

    async execute(config, inputData, connectedNodes = [], executionContext = null) {
        console.log('Executing Instagram Reply Comment Node');
        
        try {
            if (!executionContext) {
                const workflowData = { id: 'instagram_workflow', name: 'Instagram Reply', active: true };
                const allNodes = this.buildNodesMap(connectedNodes);
                executionContext = createBackendExecutionContext(
                    { id: 'instagram_reply', type: 'instagramReplyComment' },
                    allNodes,
                    workflowData
                );
            }

            const processedConfig = this.processConfigTemplates(config, inputData, executionContext);
            
            const validation = this.validateParameters(processedConfig);
            if (!validation.valid) {
                throw new Error(`Parameter validation failed: ${validation.errors.join(', ')}`);
            }

            const result = await this.replyToComment(processedConfig);
            
            return {
                success: true,
                data: result,
                nodeType: this.type,
                message: 'Comment reply sent successfully'
            };

        } catch (error) {
            console.error('Instagram Reply Comment Error:', error);
            return {
                success: false,
                error: error.message,
                nodeType: this.type,
                timestamp: new Date().toISOString()
            };
        }
    }

    processConfigTemplates(config, inputData, executionContext) {
        const processed = { ...config };
        const templateFields = ['accountId', 'commentId', 'replyText', 'accessToken'];
        
        templateFields.forEach(field => {
            if (processed[field] && typeof processed[field] === 'string') {
                const originalValue = processed[field];
                const actualNodeId = executionContext.currentNode?.id || 'instagram_reply_fallback';
                
                const resolvedValue = executionContext.evaluateExpression(
                    originalValue, 
                    actualNodeId, 
                    inputData, 
                    0
                );
                
                processed[field] = resolvedValue;
            }
        });

        return processed;
    }

    validateParameters(config) {
        const errors = [];
        
        if (!config.accountId || config.accountId.trim() === '') {
            errors.push('Account ID is required');
        }
        
        if (!config.commentId || config.commentId.trim() === '') {
            errors.push('Comment ID is required');
        }
        
        if (!config.replyText || config.replyText.trim() === '') {
            errors.push('Reply text is required');
        }
        
        if (!config.accessToken || config.accessToken.trim() === '') {
            errors.push('Access Token is required');
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }

    async replyToComment(config) {
        const url = `https://graph.facebook.com/v18.0/${config.commentId}/replies`;
        
        const body = {
            message: config.replyText
        };

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${config.accessToken}`
                },
                body: JSON.stringify(body)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(`Instagram API Error: ${data.error?.message || response.statusText}`);
            }

            return data;

        } catch (error) {
            throw error;
        }
    }

    buildNodesMap(connectedNodes) {
        const nodesMap = {};
        
        if (Array.isArray(connectedNodes)) {
            connectedNodes.forEach(nodeData => {
                if (nodeData && nodeData.nodeId) {
                    nodesMap[nodeData.nodeId] = {
                        type: nodeData.nodeType,
                        data: { label: nodeData.nodeLabel },
                        outputData: nodeData.data,
                        config: nodeData.config || {}
                    };
                }
            });
        }

        return nodesMap;
    }

    getSampleConfig() {
        return {
            accountId: 'your_instagram_business_account_id',
            commentId: 'instagram_comment_id',
            replyText: 'Thanks for your comment!',
            includeUsername: true,
            accessToken: 'your_instagram_access_token'
        };
    }
}

module.exports = new InstagramReplyCommentNode();