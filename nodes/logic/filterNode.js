/*
=================================================================
BACKEND FILE: backend/nodes/logic/filterNode.js
=================================================================
Filter node for filtering data based on conditions.
*/

const filterNode = {
    description: {
        displayName: 'Filter',
        name: 'filter',
        icon: 'fa:filter',
        group: 'logic',
        version: 1,
        description: 'Filter items based on conditions.',
        defaults: {
            name: 'Filter',
        },
        properties: [
            {
                displayName: 'Conditions',
                name: 'conditions',
                type: 'collection',
                default: [{ value1: '', operator: 'is_equal_to', value2: '' }],
                required: true,
                description: 'Conditions to filter by.',
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
            }
        ],
    },

    async execute(nodeData, inputData, connectedNodes = []) {
        console.log('🔍 Filter Node Execution Starting');
        
        try {
            const conditions = nodeData.conditions || [{ value1: '', operator: 'is_equal_to', value2: '' }];
            const combinator = nodeData.combinator || 'AND';
            
            // Evaluate conditions similar to IF node
            const results = [];
            for (let i = 0; i < conditions.length; i++) {
                const condition = conditions[i];
                const result = await evaluateCondition(condition, inputData);
                results.push(result);
                console.log(`Condition ${i + 1}: ${condition.value1} ${condition.operator} ${condition.value2} = ${result}`);
            }

            // Combine results based on combinator
            let passed;
            if (combinator === 'OR') {
                passed = results.some(r => r === true);
            } else { // AND
                passed = results.every(r => r === true);
            }
            
            console.log(`✅ Filter Node evaluation: ${passed ? 'PASSED' : 'FILTERED OUT'}`);
            
            return {
                success: true,
                filtered: !passed,
                passed: passed,
                conditions: conditions,
                combinator: combinator,
                inputData: passed ? inputData : null, // Only pass data if conditions met
                message: passed ? 'Item passed filter' : 'Item filtered out',
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ Filter Node execution failed:', error.message);
            throw new Error(`Filter Node failed: ${error.message}`);
        }
    }
};

// Reuse condition evaluation from other nodes
async function evaluateCondition(condition, inputData) {
    const { value1, operator, value2 } = condition;
    
    // Process templates in both values
    const processedValue1 = processTemplates(value1, inputData);
    const processedValue2 = processTemplates(value2, inputData);
    
    let val1 = processedValue1;
    let val2 = processedValue2;
    
    switch (operator) {
        case 'is_equal_to':
            return val1 == val2;
        case 'is_not_equal_to':
            return val1 != val2;
        case 'contains':
            return typeof val1 === 'string' && typeof val2 === 'string' && val1.includes(val2);
        case 'greater_than':
            return !isNaN(parseFloat(val1)) && !isNaN(parseFloat(val2)) && parseFloat(val1) > parseFloat(val2);
        case 'less_than':
            return !isNaN(parseFloat(val1)) && !isNaN(parseFloat(val2)) && parseFloat(val1) < parseFloat(val2);
        default:
            return false;
    }
}

function processTemplates(text, inputData) {
    if (!text || typeof text !== 'string') return text;
    
    let dataToProcess = inputData;
    if (Array.isArray(inputData) && inputData.length > 0 && inputData[0].nodeId) {
        dataToProcess = {};
        inputData.forEach(nodeInfo => {
            if (nodeInfo.data && typeof nodeInfo.data === 'object') {
                Object.assign(dataToProcess, nodeInfo.data);
            }
        });
    }
    
    return text.replace(/\{\{\s*([^}]+)\s*\}\}/g, (match, path) => {
        try {
            const keys = path.trim().split('.');
            let current = dataToProcess;
            
            for (const key of keys) {
                if (current && typeof current === 'object' && key in current) {
                    current = current[key];
                } else {
                    return match;
                }
            }
            
            return typeof current === 'object' ? JSON.stringify(current) : String(current);
        } catch (error) {
            return match;
        }
    });
}

module.exports = filterNode;