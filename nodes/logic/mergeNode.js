/*
=================================================================
BACKEND FILE: backend/nodes/logic/mergeNode.js
=================================================================
Merge node for combining data from multiple workflow paths.
*/

const mergeNode = {
    description: {
        displayName: 'Merge',
        name: 'merge',
        icon: 'fa:code-merge',
        group: 'logic',
        version: 1,
        description: 'Merge data from multiple inputs into a single output.',
        defaults: {
            name: 'Merge',
        },
        properties: [
            {
                displayName: 'Merge Mode',
                name: 'mergeMode',
                type: 'options',
                options: [
                    { name: 'Append', value: 'append' },
                    { name: 'Override', value: 'override' },
                    { name: 'Combine Keys', value: 'combineKeys' },
                ],
                default: 'append',
                description: 'How to merge the data from multiple inputs.',
            }
        ],
    },

    async execute(nodeData, inputData, connectedNodes = []) {
        console.log('🔗 Merge Node Execution Starting');
        console.log('Node configuration:', {
            mergeMode: nodeData.mergeMode,
            inputDataLength: Array.isArray(inputData) ? inputData.length : 'single'
        });

        try {
            const mergeMode = nodeData.mergeMode || 'append';
            
            // Handle different input data structures
            let dataToMerge;
            if (Array.isArray(inputData) && inputData.length > 0) {
                // Multiple inputs - extract data from each
                dataToMerge = inputData.map(input => {
                    if (input && input.nodeId) {
                        // Cascading data structure
                        return {
                            nodeId: input.nodeId,
                            nodeLabel: input.nodeLabel,
                            data: input.data
                        };
                    }
                    return input;
                });
            } else {
                // Single input
                dataToMerge = [inputData];
            }
            
            console.log(`🔗 Merge Node processing ${dataToMerge.length} inputs with mode: ${mergeMode}`);
            
            let mergedResult;
            
            switch (mergeMode) {
                case 'append':
                    // Create array with all inputs
                    mergedResult = {
                        mergedData: dataToMerge,
                        totalInputs: dataToMerge.length,
                        mergeType: 'array'
                    };
                    break;
                    
                case 'override':
                    // Last input overrides previous ones
                    mergedResult = {
                        mergedData: dataToMerge[dataToMerge.length - 1],
                        totalInputs: dataToMerge.length,
                        mergeType: 'override'
                    };
                    break;
                    
                case 'combineKeys':
                    // Combine all object keys into single object
                    const combined = {};
                    dataToMerge.forEach((input, index) => {
                        if (input && typeof input === 'object') {
                            if (input.data && typeof input.data === 'object') {
                                // Handle cascading data structure
                                Object.assign(combined, input.data);
                            } else {
                                // Handle direct object
                                Object.assign(combined, input);
                            }
                        }
                    });
                    mergedResult = {
                        mergedData: combined,
                        totalInputs: dataToMerge.length,
                        mergeType: 'combined'
                    };
                    break;
                    
                default:
                    mergedResult = {
                        mergedData: dataToMerge,
                        totalInputs: dataToMerge.length,
                        mergeType: 'default'
                    };
            }
            
            console.log(`✅ Merge Node completed with ${mergedResult.totalInputs} inputs`);
            
            return {
                success: true,
                result: mergedResult.mergedData,
                mergeMode: mergeMode,
                totalInputs: mergedResult.totalInputs,
                mergeType: mergedResult.mergeType,
                inputData: mergedResult.mergedData, // For downstream compatibility
                message: `Merged ${mergedResult.totalInputs} inputs using ${mergeMode} mode`,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ Merge Node execution failed:', error.message);
            throw new Error(`Merge Node failed: ${error.message}`);
        }
    }
};

module.exports = mergeNode;