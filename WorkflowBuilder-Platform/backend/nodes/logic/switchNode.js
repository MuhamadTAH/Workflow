/*
=================================================================
BACKEND FILE: backend/nodes/logic/switchNode.js
=================================================================
Switch node implementation for multi-path routing based on rules
*/

class SwitchNode {
    constructor(config) {
        this.config = config || {};
        this.switchRules = this.config.switchRules || [];
        this.switchOptions = this.config.switchOptions || [];
    }

    async execute(config, inputData, connectedNodes) {
        try {
            console.log('🔀 Executing Switch Node');
            console.log('Rules:', config.switchRules);
            console.log('Options:', config.switchOptions);
            console.log('Input data:', inputData);

            const rules = config.switchRules || [];
            const options = config.switchOptions || [];
            const ignoreCase = options.includes('ignoreCase');
            const hasFallback = options.includes('fallbackOutput');

            // If no input data, return with no match
            if (!inputData || (Array.isArray(inputData) && inputData.length === 0)) {
                return {
                    success: true,
                    matchedRule: null,
                    outputPath: hasFallback ? 'fallback' : null,
                    data: inputData || []
                };
            }

            // Process each input item
            const processItem = (item) => {
                for (let i = 0; i < rules.length; i++) {
                    const rule = rules[i];
                    if (this.evaluateCondition(rule, item, ignoreCase)) {
                        return {
                            matchedRule: i,
                            outputPath: `output_${i}`,
                            passed: true
                        };
                    }
                }
                
                // No rules matched
                return {
                    matchedRule: null,
                    outputPath: hasFallback ? 'fallback' : null,
                    passed: hasFallback
                };
            };

            let results = [];
            let outputPaths = {};

            if (Array.isArray(inputData)) {
                // Process array of items
                inputData.forEach((item, index) => {
                    const result = processItem(item);
                    if (result.passed) {
                        if (!outputPaths[result.outputPath]) {
                            outputPaths[result.outputPath] = [];
                        }
                        outputPaths[result.outputPath].push({
                            ...item,
                            _switchResult: {
                                matchedRule: result.matchedRule,
                                outputPath: result.outputPath
                            }
                        });
                    }
                });
            } else {
                // Process single item
                const result = processItem(inputData);
                if (result.passed) {
                    outputPaths[result.outputPath] = [{
                        ...inputData,
                        _switchResult: {
                            matchedRule: result.matchedRule,
                            outputPath: result.outputPath
                        }
                    }];
                }
            }

            console.log('✅ Switch node executed successfully');
            console.log('Output paths:', Object.keys(outputPaths));

            return {
                success: true,
                outputPaths: outputPaths,
                totalProcessed: Array.isArray(inputData) ? inputData.length : 1,
                totalMatched: Object.values(outputPaths).reduce((sum, items) => sum + items.length, 0)
            };

        } catch (error) {
            console.error('❌ Switch node execution failed:', error);
            throw new Error(`Switch node failed: ${error.message}`);
        }
    }

    evaluateCondition(rule, data, ignoreCase = false) {
        const { value1, operator, value2 } = rule;
        
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
        const switchNode = new SwitchNode(config);
        return await switchNode.execute(config, inputData, connectedNodes);
    }
};