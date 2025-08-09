/*
=================================================================
BACKEND FILE: backend/nodes/logic/ifNode.js
=================================================================
If node implementation for true/false conditional routing
*/

class IfNode {
    constructor(config) {
        this.config = config || {};
        this.conditions = this.config.conditions || [];
        this.combinator = this.config.combinator || 'AND';
        this.ignoreCase = this.config.ignoreCase || false;
    }

    async execute(config, inputData, connectedNodes) {
        try {
            console.log('🔀 Executing If Node');
            console.log('Conditions:', config.conditions);
            console.log('Combinator:', config.combinator);
            console.log('Ignore case:', config.ignoreCase);
            console.log('Input data:', inputData);

            const conditions = config.conditions || [];
            const combinator = config.combinator || 'AND';
            const ignoreCase = config.ignoreCase || false;

            // If no conditions, pass all data to true path
            if (conditions.length === 0) {
                return {
                    success: true,
                    result: true,
                    trueData: inputData || [],
                    falseData: [],
                    totalProcessed: Array.isArray(inputData) ? inputData.length : 1
                };
            }

            // If no input data, return false
            if (!inputData || (Array.isArray(inputData) && inputData.length === 0)) {
                return {
                    success: true,
                    result: false,
                    trueData: [],
                    falseData: [],
                    totalProcessed: 0
                };
            }

            const trueData = [];
            const falseData = [];

            // Process each input item
            const processItem = (item) => {
                const conditionResults = conditions.map(condition => 
                    this.evaluateCondition(condition, item, ignoreCase)
                );

                let finalResult;
                if (combinator === 'AND') {
                    finalResult = conditionResults.every(result => result === true);
                } else { // OR
                    finalResult = conditionResults.some(result => result === true);
                }

                if (finalResult) {
                    trueData.push({
                        ...item,
                        _ifResult: {
                            result: true,
                            conditionResults: conditionResults
                        }
                    });
                } else {
                    falseData.push({
                        ...item,
                        _ifResult: {
                            result: false,
                            conditionResults: conditionResults
                        }
                    });
                }

                return finalResult;
            };

            let overallResult;
            if (Array.isArray(inputData)) {
                // Process array of items
                inputData.forEach(item => processItem(item));
                overallResult = trueData.length > 0;
            } else {
                // Process single item
                overallResult = processItem(inputData);
            }

            console.log('✅ If node executed successfully');
            console.log(`True items: ${trueData.length}, False items: ${falseData.length}`);

            return {
                success: true,
                result: overallResult,
                trueData: trueData,
                falseData: falseData,
                totalProcessed: Array.isArray(inputData) ? inputData.length : 1,
                trueCount: trueData.length,
                falseCount: falseData.length
            };

        } catch (error) {
            console.error('❌ If node execution failed:', error);
            throw new Error(`If node failed: ${error.message}`);
        }
    }

    evaluateCondition(condition, data, ignoreCase = false) {
        const { value1, operator, value2 } = condition;
        
        // Resolve values from input data
        const resolvedValue1 = this.resolveValue(value1, data);
        const resolvedValue2 = this.resolveValue(value2, data);

        return this.compareValues(resolvedValue1, operator, resolvedValue2, ignoreCase);
    }

    resolveValue(value, data) {
        if (typeof value !== 'string') return value;
        
        // Handle template expressions like {{message}} or {{user.name}}
        if (value.includes('{{') && value.includes('}}')) {
            return value.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
                const keys = path.trim().split('.');
                let current = data;
                
                for (const key of keys) {
                    if (current && typeof current === 'object' && key in current) {
                        current = current[key];
                    } else {
                        return match; // Return original if path not found
                    }
                }
                
                return current;
            });
        }
        
        return value;
    }

    compareValues(value1, operator, value2, ignoreCase = false) {
        // Convert to strings for comparison if ignoreCase is true
        const v1 = ignoreCase && typeof value1 === 'string' ? value1.toLowerCase() : value1;
        const v2 = ignoreCase && typeof value2 === 'string' ? value2.toLowerCase() : value2;

        switch (operator) {
            case 'is_equal_to':
                return v1 == v2;
            case 'is_not_equal_to':
                return v1 != v2;
            case 'contains':
                return typeof v1 === 'string' && typeof v2 === 'string' && v1.includes(v2);
            case 'greater_than':
                return Number(v1) > Number(v2);
            case 'less_than':
                return Number(v1) < Number(v2);
            case 'greater_than_or_equal':
                return Number(v1) >= Number(v2);
            case 'less_than_or_equal':
                return Number(v1) <= Number(v2);
            case 'starts_with':
                return typeof v1 === 'string' && typeof v2 === 'string' && v1.startsWith(v2);
            case 'ends_with':
                return typeof v1 === 'string' && typeof v2 === 'string' && v1.endsWith(v2);
            case 'regex_match':
                try {
                    const regex = new RegExp(v2, ignoreCase ? 'i' : '');
                    return regex.test(String(v1));
                } catch (e) {
                    console.warn('Invalid regex:', v2);
                    return false;
                }
            default:
                console.warn('Unknown operator:', operator);
                return false;
        }
    }
}

module.exports = {
    execute: async (config, inputData, connectedNodes) => {
        const ifNode = new IfNode(config);
        return await ifNode.execute(config, inputData, connectedNodes);
    }
};