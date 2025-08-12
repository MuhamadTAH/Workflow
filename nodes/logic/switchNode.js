/*
=================================================================
BACKEND FILE: backend/nodes/logic/switchNode.js
=================================================================
Switch node for multiple conditional routing based on rules.
Routes data to different outputs based on matching conditions.
*/

const switchNode = {
    description: {
        displayName: 'Switch',
        name: 'switch',
        icon: 'fa:code-branch',
        group: 'logic',
        version: 1,
        description: 'Route items to different outputs based on rules.',
        defaults: {
            name: 'Switch',
        },
        properties: [
            {
                displayName: 'Rules',
                name: 'switchRules',
                type: 'collection',
                default: [{ value1: '', operator: 'is_equal_to', value2: '', output: '0' }],
                required: true,
                description: 'Rules to evaluate for switching.',
            },
            {
                displayName: 'Fallback Output',
                name: 'fallbackOutput',
                type: 'string',
                default: 'default',
                description: 'Output to use when no rules match.',
            }
        ],
    },

    async execute(nodeData, inputData, connectedNodes = []) {
        console.log('🔀 Switch Node Execution Starting');
        console.log('Node configuration:', {
            rules: nodeData.switchRules,
            fallbackOutput: nodeData.fallbackOutput
        });

        try {
            // Validate required fields
            if (!nodeData.switchRules || !Array.isArray(nodeData.switchRules) || nodeData.switchRules.length === 0) {
                throw new Error('At least one rule is required');
            }

            // Process each rule until we find a match
            for (let i = 0; i < nodeData.switchRules.length; i++) {
                const rule = nodeData.switchRules[i];
                const result = await evaluateCondition(rule, inputData);
                
                console.log(`Rule ${i + 1}: ${rule.value1} ${rule.operator} ${rule.value2} = ${result}`);
                
                if (result) {
                    console.log(`✅ Switch Node matched rule ${i + 1} - routing to output: ${rule.output}`);
                    
                    return {
                        success: true,
                        matchedRule: i,
                        route: rule.output || '0',
                        ruleMatched: rule,
                        inputData: inputData,
                        message: `Matched rule ${i + 1} - routed to output ${rule.output}`,
                        timestamp: new Date().toISOString()
                    };
                }
            }

            // No rules matched - use fallback
            const fallback = nodeData.fallbackOutput || 'default';
            console.log(`⚠️ Switch Node no rules matched - using fallback output: ${fallback}`);
            
            return {
                success: true,
                matchedRule: -1,
                route: fallback,
                ruleMatched: null,
                inputData: inputData,
                message: `No rules matched - routed to fallback output ${fallback}`,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ Switch Node execution failed:', error.message);
            throw new Error(`Switch Node failed: ${error.message}`);
        }
    }
};

// Helper function to evaluate a single condition (reused from IF node)
async function evaluateCondition(condition, inputData) {
    const { value1, operator, value2 } = condition;
    
    // Process templates in both values
    const processedValue1 = processTemplates(value1, inputData);
    const processedValue2 = processTemplates(value2, inputData);
    
    console.log(`Evaluating: "${processedValue1}" ${operator} "${processedValue2}"`);
    
    // Convert values for comparison
    let val1 = processedValue1;
    let val2 = processedValue2;
    
    // Perform comparison based on operator
    switch (operator) {
        case 'is_equal_to':
            return val1 == val2;
            
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

// Helper function to process templates
function processTemplates(text, inputData) {
    if (!text || typeof text !== 'string') {
        return text;
    }
    
    // Handle cascading data structure
    let dataToProcess;
    if (Array.isArray(inputData) && inputData.length > 0 && inputData[0].nodeId) {
        dataToProcess = {};
        inputData.forEach(nodeInfo => {
            const nodeKey = `${nodeInfo.order}. ${nodeInfo.nodeLabel}`;
            dataToProcess[nodeKey] = nodeInfo.data;
            
            if (nodeInfo.data && typeof nodeInfo.data === 'object') {
                Object.keys(nodeInfo.data).forEach(key => {
                    if (!(key in dataToProcess) || nodeInfo.nodeType === 'telegramTrigger') {
                        dataToProcess[key] = nodeInfo.data[key];
                    }
                });
            }
        });
    } else {
        dataToProcess = inputData;
    }
    
    // Enhanced template processing
    return text.replace(/\{\{\s*([^}]+)\s*\}\}/g, (match, path) => {
        try {
            const pathStr = path.trim();
            const keys = pathStr.split('.');
            
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
                return typeof current === 'object' ? JSON.stringify(current) : String(current);
            }
            
            return match;
        } catch (error) {
            console.warn(`Template processing error for ${match}:`, error.message);
            return match;
        }
    });
}

module.exports = switchNode;