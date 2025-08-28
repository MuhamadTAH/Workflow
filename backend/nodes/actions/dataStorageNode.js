/*
=================================================================
BACKEND FILE: backend/nodes/actions/dataStorageNode.js
=================================================================
Data Storage node for storing and retrieving data.
Enhanced version with database support for WhatsApp conversations.
*/

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { createBackendExecutionContext } = require('../../utils/executionContext');

class DataStorageNode {
    constructor() {
        this.name = 'Data Storage';
        this.type = 'dataStorageNode';
        this.icon = 'fas fa-database';
        this.description = 'Store and retrieve data from database or memory';
        
        // Database connection
        const dbPath = path.join(__dirname, '../../database.sqlite');
        this.db = new sqlite3.Database(dbPath);
    }

    /**
     * Get node parameters structure (for UI configuration)
     */
    getParameters() {
        return {
            storageType: {
                displayName: 'Storage Type',
                name: 'storageType',
                type: 'select',
                options: [
                    { label: 'Database', value: 'database' },
                    { label: 'Memory', value: 'memory' }
                ],
                default: 'database',
                required: true
            },
            tableName: {
                displayName: 'Table Name',
                name: 'tableName',
                type: 'string',
                default: 'whatsapp_conversations',
                required: true,
                displayCondition: 'storageType === "database"'
            },
            operation: {
                displayName: 'Operation',
                name: 'operation',
                type: 'select',
                options: [
                    { label: 'Insert', value: 'insert' },
                    { label: 'Update', value: 'update' },
                    { label: 'Select', value: 'select' }
                ],
                default: 'insert',
                required: true
            },
            fields: {
                displayName: 'Fields',
                name: 'fields',
                type: 'object',
                default: {},
                description: 'Key-value pairs for database fields'
            }
        };
    }

    /**
     * Execute the Data Storage Node
     */
    async execute(config, inputData, connectedNodes = [], executionContext = null) {
        console.log('💾 Data Storage Node Execution');
        console.log('Config:', JSON.stringify(config, null, 2));
        console.log('Input data:', JSON.stringify(inputData, null, 2));
        
        try {
            // Create execution context if not provided
            if (!executionContext) {
                const workflowData = { id: 'data_workflow', name: 'Data Storage', active: true };
                const allNodes = this.buildNodesMap(connectedNodes);
                executionContext = createBackendExecutionContext(
                    { id: 'data_storage', type: 'dataStorageNode' },
                    allNodes,
                    workflowData
                );
            }

            // Process templates with context
            const processedConfig = this.processConfigTemplates(config, inputData, executionContext);
            
            console.log('Processed config:', JSON.stringify(processedConfig, null, 2));

            // Handle different storage types
            if (processedConfig.storageType === 'database') {
                return await this.handleDatabaseOperation(processedConfig, inputData);
            } else {
                return await this.handleMemoryOperation(processedConfig, inputData);
            }

        } catch (error) {
            console.error('❌ Data Storage Error:', error);
            return {
                success: false,
                error: error.message,
                nodeType: this.type,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Handle database operations
     */
    async handleDatabaseOperation(config, inputData) {
        const { tableName, operation, fields } = config;
        
        if (operation === 'insert') {
            return await this.insertData(tableName, fields);
        } else if (operation === 'update') {
            return await this.updateData(tableName, fields, config.whereCondition);
        } else if (operation === 'select') {
            return await this.selectData(tableName, config.whereCondition);
        }
        
        throw new Error(`Unsupported database operation: ${operation}`);
    }

    /**
     * Insert data into database
     */
    async insertData(tableName, fields) {
        return new Promise((resolve, reject) => {
            const columns = Object.keys(fields);
            const values = Object.values(fields);
            const placeholders = columns.map(() => '?').join(', ');
            
            const sql = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;
            
            console.log('💾 Executing INSERT:', sql);
            console.log('💾 Values:', values);
            
            this.db.run(sql, values, function(err) {
                if (err) {
                    console.error('❌ Database INSERT error:', err);
                    reject(err);
                } else {
                    console.log('✅ Data inserted successfully, ID:', this.lastID);
                    resolve({
                        success: true,
                        operation: 'insert',
                        tableName: tableName,
                        insertedId: this.lastID,
                        rowsAffected: this.changes,
                        timestamp: new Date().toISOString()
                    });
                }
            });
        });
    }

    /**
     * Update data in database
     */
    async updateData(tableName, fields, whereCondition) {
        return new Promise((resolve, reject) => {
            const setClause = Object.keys(fields).map(key => `${key} = ?`).join(', ');
            const values = Object.values(fields);
            
            let sql = `UPDATE ${tableName} SET ${setClause}`;
            if (whereCondition) {
                sql += ` WHERE ${whereCondition}`;
            }
            
            console.log('💾 Executing UPDATE:', sql);
            console.log('💾 Values:', values);
            
            this.db.run(sql, values, function(err) {
                if (err) {
                    console.error('❌ Database UPDATE error:', err);
                    reject(err);
                } else {
                    console.log('✅ Data updated successfully, rows affected:', this.changes);
                    resolve({
                        success: true,
                        operation: 'update',
                        tableName: tableName,
                        rowsAffected: this.changes,
                        timestamp: new Date().toISOString()
                    });
                }
            });
        });
    }

    /**
     * Select data from database
     */
    async selectData(tableName, whereCondition) {
        return new Promise((resolve, reject) => {
            let sql = `SELECT * FROM ${tableName}`;
            if (whereCondition) {
                sql += ` WHERE ${whereCondition}`;
            }
            
            console.log('💾 Executing SELECT:', sql);
            
            this.db.all(sql, [], (err, rows) => {
                if (err) {
                    console.error('❌ Database SELECT error:', err);
                    reject(err);
                } else {
                    console.log('✅ Data selected successfully, rows:', rows.length);
                    resolve({
                        success: true,
                        operation: 'select',
                        tableName: tableName,
                        data: rows,
                        rowCount: rows.length,
                        timestamp: new Date().toISOString()
                    });
                }
            });
        });
    }

    /**
     * Handle memory operations (legacy support)
     */
    async handleMemoryOperation(config, inputData) {
        if (!this.storage) {
            this.storage = new Map();
        }
        
        const key = config.storageKey || 'default';
        
        if (config.operation === 'store' || config.operation === 'insert') {
            this.storage.set(key, inputData);
            return {
                success: true,
                operation: 'store',
                key: key,
                stored: true,
                timestamp: new Date().toISOString()
            };
        } else {
            const storedData = this.storage.get(key);
            return {
                success: true,
                operation: 'retrieve',
                key: key,
                data: storedData,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Process configuration templates with execution context
     */
    processConfigTemplates(config, inputData, executionContext) {
        const processed = { ...config };
        
        // Process field values if they exist
        if (processed.fields && typeof processed.fields === 'object') {
            const processedFields = {};
            
            for (const [key, value] of Object.entries(processed.fields)) {
                if (typeof value === 'string') {
                    const actualNodeId = executionContext.currentNode?.id || 'data_storage';
                    
                    let resolvedValue = executionContext.evaluateExpression(
                        value,
                        actualNodeId,
                        inputData,
                        0
                    );
                    
                    // Handle special values
                    if (resolvedValue === '{{$now}}') {
                        resolvedValue = new Date().toISOString();
                    }
                    
                    console.log(`🔧 Field template resolved: ${key}: "${value}" → "${resolvedValue}"`);
                    processedFields[key] = resolvedValue;
                } else {
                    processedFields[key] = value;
                }
            }
            
            processed.fields = processedFields;
        }
        
        return processed;
    }

    /**
     * Build nodes map from connected nodes
     */
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

    /**
     * Legacy process method for backward compatibility
     */
    async process(inputData) {
        return await this.execute(this.config, inputData);
    }
}

module.exports = new DataStorageNode();