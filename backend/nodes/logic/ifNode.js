/*
=================================================================
BACKEND FILE: backend/nodes/logic/ifNode.js
=================================================================
IF node for conditional logic with true/false outputs.
Processes conditions and evaluates them to route data appropriately.
*/

const ifNode = {
    description: {
        displayName: 'IF',
        name: 'if',
        icon: 'fa:sitemap',
        group: 'logic',
        version: 1,
        description: 'Route items true/false based on conditions.',
        defaults: {
            name: 'IF',
        },
        properties: [
            {
                displayName: 'Conditions',
                name: 'conditions',
                type: 'collection',
                default: [{ value1: '', operator: 'is_equal_to', value2: '' }],
                required: true,
                description: 'Conditions to evaluate for the IF statement.',
            },
            {
                displayName: 'Combinator',
                name: 'combinator',
                type: 'options',
                options: [
                    { name: 'AND', value: 'AND' },
                    { name: 'OR', value: 'OR' },
                ],
                default: 'AND',
                description: 'How to combine multiple conditions.',
                displayOptions: {
                    show: {
                        conditions: { minLength: 2 },
                    },
                },
            },
            {
                displayName: 'Ignore Case',
                name: 'ignoreCase',
                type: 'boolean',
                default: false,
                description: 'Whether to ignore case when comparing string values.',
            }
        ],
    },

    // This function gets called when the node is executed
    async execute(nodeData, inputData, connectedNodes = []) {
        console.log('🔀 IF Node Execution Starting');
        console.log('Node configuration:', {
            conditions: nodeData.conditions,
            combinator: nodeData.combinator,
            ignoreCase: nodeData.ignoreCase
        });

        try {
            // Validate required fields
            if (!nodeData.conditions || !Array.isArray(nodeData.conditions) || nodeData.conditions.length === 0) {
                throw new Error('At least one condition is required');
            }

            // Process each condition
            const results = [];
            for (let i = 0; i < nodeData.conditions.length; i++) {
                const condition = nodeData.conditions[i];
                const result = await evaluateCondition(condition, inputData, nodeData.ignoreCase);
                results.push(result);
                
                console.log(`Condition ${i + 1}: ${condition.value1} ${condition.operator} ${condition.value2} = ${result}`);
            }

            // Combine results based on combinator
            let finalResult;
            if (nodeData.combinator === 'OR') {
                finalResult = results.some(r => r === true);
            } else { // AND (default)
                finalResult = results.every(r => r === true);
            }

            console.log(`✅ IF Node evaluation completed: ${finalResult} (${nodeData.combinator})`);

            // Return result with routing information
            return {
                success: true,
                result: finalResult,
                conditionsMet: finalResult,
                route: finalResult ? 'true' : 'false',
                evaluatedConditions: nodeData.conditions.map((cond, i) => ({
                    condition: cond,
                    result: results[i]
                })),
                combinator: nodeData.combinator,
                inputData: inputData, // Pass through input data for downstream nodes
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ IF Node execution failed:', error.message);
            throw new Error(`IF Node failed: ${error.message}`);
        }
    }
};

// Helper function to evaluate a single condition
async function evaluateCondition(condition, inputData, ignoreCase = false) {
    const { value1, operator, value2 } = condition;
    
    // Process templates in both values
    const processedValue1 = processTemplates(value1, inputData);
    const processedValue2 = processTemplates(value2, inputData);
    
    console.log(`Evaluating: "${processedValue1}" ${operator} "${processedValue2}"`);
    
    // Convert values for comparison
    let val1 = processedValue1;
    let val2 = processedValue2;
    
    // Apply case insensitivity for strings
    if (ignoreCase && typeof val1 === 'string' && typeof val2 === 'string') {
        val1 = val1.toLowerCase();
        val2 = val2.toLowerCase();
    }
    
    // Perform comparison based on operator
    switch (operator) {
        case 'is_equal_to':
            return val1 == val2; // Loose equality to handle type coercion
            
        case 'is_not_equal_to':
            return val1 != val2;
            
        case 'contains':
            if (typeof val1 === 'string' && typeof val2 === 'string') {
                return val1.includes(val2);
            }
            return false;
            
        case 'greater_than':
            const num1 = parseFloat(val1);
            const num2 = parseFloat(val2);
            if (!isNaN(num1) && !isNaN(num2)) {
                return num1 > num2;
            }
            return false;
            
        case 'less_than':
            const n1 = parseFloat(val1);
            const n2 = parseFloat(val2);
            if (!isNaN(n1) && !isNaN(n2)) {
                return n1 < n2;
            }
            return false;
            
        default:
            console.warn(`Unknown operator: ${operator}`);
            return false;
    }
}

// Helper function to process templates (copied from other nodes)
function processTemplates(text, inputData) {
    if (!text || typeof text !== 'string') {
        return text;
    }
    
    // Handle cascading data structure similar to other nodes
    let dataToProcess;
    if (Array.isArray(inputData) && inputData.length > 0 && inputData[0].nodeId) {
        // This is cascading data structure - convert to flat object for template resolution
        dataToProcess = {};
        inputData.forEach(nodeInfo => {
            // Create entries like "1. AI Agent" for easy template access
            const nodeKey = `${nodeInfo.order}. ${nodeInfo.nodeLabel}`;
            dataToProcess[nodeKey] = nodeInfo.data;
            
            // Also create direct data entries for backwards compatibility
            if (nodeInfo.data && typeof nodeInfo.data === 'object') {
                Object.keys(nodeInfo.data).forEach(key => {
                    // Priority: Give Telegram Trigger data priority over AI Agent data for common keys
                    if (!(key in dataToProcess) || nodeInfo.nodeType === 'telegramTrigger') {
                        dataToProcess[key] = nodeInfo.data[key];
                    }
                });
            }
        });
    } else {
        // Use original data structure
        dataToProcess = inputData;
    }
    
    // Enhanced template processing - replace {{ key }} with data values
    return text.replace(/\{\{\s*([^}]+)\s*\}\}/g, (match, path) => {
        try {
            const pathStr = path.trim();
            const keys = pathStr.split('.');
            
            // Try direct path first (e.g., "message.text" or "1. Telegram Trigger.message.text")
            let current = dataToProcess;
            let found = true;
            
            for (const key of keys) {
                if (current && typeof current === 'object' && key in current) {
                    current = current[key];
                } else {
                    found = false;
                    break;
                }
            }
            
            if (found) {
                const result = typeof current === 'object' ? JSON.stringify(current) : String(current);
                return result;
            }
            
            // If direct path fails, try to find in nested data (backwards compatibility)
            if (typeof dataToProcess === 'object' && dataToProcess !== null) {
                for (const [nodeKey, nodeData] of Object.entries(dataToProcess)) {
                    if (typeof nodeData === 'object' && nodeData !== null) {
                        let nestedCurrent = nodeData;
                        let nestedFound = true;
                        
                        for (const key of keys) {
                            if (nestedCurrent && typeof nestedCurrent === 'object' && key in nestedCurrent) {
                                nestedCurrent = nestedCurrent[key];
                            } else {
                                nestedFound = false;
                                break;
                            }
                        }
                        
                        if (nestedFound) {
                            const result = typeof nestedCurrent === 'object' ? JSON.stringify(nestedCurrent) : String(nestedCurrent);
                            return result;
                        }
                    }
                }
            }
            
            return match; // Return original if path not found anywhere
        } catch (error) {
            console.warn(`Template processing error for ${match}:`, error.message);
            return match;
        }
    });
}

module.exports = ifNode;