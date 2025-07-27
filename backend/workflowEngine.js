const fs = require('fs');
const path = require('path');
const { TelegramAPI, TemplateProcessor } = require('./services/telegramAPI');
const logger = require('./services/logger');
const { handleWorkflowError, handleTelegramError } = require('./middleware/errorHandler');

// Store for workflow executions (in production, use database)
const activeExecutions = new Map();
const executionHistory = [];

class WorkflowEngine {
  constructor() {
    this.workflows = new Map();
    this.loadWorkflowsFromStorage();
  }

  // Load workflows from frontend localStorage equivalent (simulate)
  loadWorkflowsFromStorage() {
    try {
      // In production, this would load from database
      // For now, we'll store workflows when they're saved from frontend
      logger.info('Workflow engine initialized');
    } catch (error) {
      logger.logError(error, { context: 'loadWorkflowsFromStorage' });
    }
  }

  // Register a workflow (called when saved from frontend)
  registerWorkflow(workflowData) {
    try {
      const { id, name, nodes, connections } = workflowData;
      
      this.workflows.set(id, {
        id,
        name,
        nodes: nodes || [],
        connections: connections || [],
        registeredAt: new Date().toISOString()
      });

      logger.info(`Registered workflow: ${name}`, { 
        workflowId: id, 
        nodeCount: nodes?.length || 0 
      });
      return true;
    } catch (error) {
      logger.logError(error, { 
        context: 'registerWorkflow', 
        workflowData: { id, name } 
      });
      return false;
    }
  }

  // Find workflow containing a specific trigger node
  findWorkflowByTriggerNode(nodeId) {
    for (const [workflowId, workflow] of this.workflows) {
      const triggerNode = workflow.nodes.find(node => 
        node.id === nodeId && node.type === 'telegram-trigger'
      );
      
      if (triggerNode) {
        return { workflow, triggerNode };
      }
    }
    return null;
  }

  // Start workflow execution from trigger node
  async startExecution(triggerNodeId, triggerData, webhookConfig) {
    try {
      const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      logger.logWorkflowExecution(executionId, 'started', {
        triggerNodeId,
        webhookConfig: webhookConfig ? { 
          nodeId: webhookConfig.nodeId, 
          updateType: webhookConfig.updateType 
        } : null
      });

      // Find the workflow containing this trigger node
      const workflowInfo = this.findWorkflowByTriggerNode(triggerNodeId);
      
      if (!workflowInfo) {
        logger.warn(`No workflow found containing trigger node ${triggerNodeId}`);
        return null;
      }

      const { workflow, triggerNode } = workflowInfo;
      
      // Create execution context
      const execution = {
        id: executionId,
        workflowId: workflow.id,
        workflowName: workflow.name,
        triggerNodeId,
        triggerData,
        webhookConfig,
        startedAt: new Date().toISOString(),
        status: 'running',
        currentNodeId: triggerNodeId,
        nodeOutputs: new Map(),
        errors: []
      };

      activeExecutions.set(executionId, execution);

      // Set the trigger node's output data
      execution.nodeOutputs.set(triggerNodeId, triggerData);

      logger.logWorkflowExecution(executionId, 'trigger_data_set', {
        triggerNodeId,
        dataSize: JSON.stringify(triggerData).length
      });

      // Find and execute the next nodes
      await this.executeNextNodes(execution, triggerNodeId, workflow);

      return executionId;
    } catch (error) {
      logger.logError(error, {
        context: 'startExecution',
        triggerNodeId,
        webhookConfig
      });
      return null;
    }
  }

  // Execute nodes connected to the current node
  async executeNextNodes(execution, currentNodeId, workflow) {
    try {
      // Find connections from current node
      const outgoingConnections = workflow.connections.filter(conn => 
        conn.from === currentNodeId
      );

      if (outgoingConnections.length === 0) {
        logger.logWorkflowExecution(execution.id, 'completed', {
          totalNodes: execution.nodeOutputs.size,
          duration: Date.now() - new Date(execution.startedAt).getTime()
        });
        execution.status = 'completed';
        execution.completedAt = new Date().toISOString();
        this.moveToHistory(execution);
        return;
      }

      // Execute each connected node
      for (const connection of outgoingConnections) {
        const nextNodeId = connection.to;
        const nextNode = workflow.nodes.find(n => n.id === nextNodeId);

        if (!nextNode) {
          logger.warn(`Node ${nextNodeId} not found in workflow`, {
            executionId: execution.id,
            workflowId: workflow.id
          });
          continue;
        }

        logger.logWorkflowExecution(execution.id, 'node_started', {
          nodeId: nextNodeId,
          nodeType: nextNode.type,
          nodeLabel: nextNode.label
        });

        // Get input data from previous node
        const inputData = execution.nodeOutputs.get(currentNodeId);

        // Execute the node based on its type
        const nodeOutput = await this.executeNode(nextNode, inputData, execution);

        if (nodeOutput.success) {
          // Store node output for next nodes
          execution.nodeOutputs.set(nextNodeId, nodeOutput.data);
          
          logger.logWorkflowExecution(execution.id, 'node_completed', {
            nodeId: nextNodeId,
            nodeType: nextNode.type
          });
          
          // Continue to next nodes
          await this.executeNextNodes(execution, nextNodeId, workflow);
        } else {
          // Handle node execution error
          logger.logWorkflowExecution(execution.id, 'node_failed', {
            nodeId: nextNodeId,
            nodeType: nextNode.type,
            error: nodeOutput.error
          });
          
          execution.errors.push({
            nodeId: nextNodeId,
            error: nodeOutput.error,
            timestamp: new Date().toISOString()
          });
          
          execution.status = 'failed';
          execution.completedAt = new Date().toISOString();
          this.moveToHistory(execution);
        }
      }
    } catch (error) {
      logger.logError(error, {
        context: 'executeNextNodes',
        executionId: execution.id,
        currentNodeId
      });
      
      execution.status = 'failed';
      execution.errors.push({
        error: error.message,
        timestamp: new Date().toISOString()
      });
      this.moveToHistory(execution);
    }
  }

  // Execute a single node based on its type
  async executeNode(node, inputData, execution) {
    try {
      logger.debug(`Executing ${node.type} node: ${node.label}`, {
        nodeId: node.id,
        executionId: execution.id
      });

      switch (node.type) {
        case 'telegram-send':
          return await this.executeTelegramSendNode(node, inputData, execution);

        case 'telegram-trigger':
          // Trigger nodes don't execute (they only provide initial data)
          return {
            success: true,
            data: inputData
          };

        default:
          logger.warn(`Unknown node type: ${node.type}`, {
            nodeId: node.id,
            executionId: execution.id
          });
          return {
            success: false,
            error: `Unknown node type: ${node.type}`
          };
      }
    } catch (error) {
      logger.logError(error, {
        context: 'executeNode',
        nodeId: node.id,
        nodeType: node.type,
        executionId: execution.id
      });
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Execute Telegram Send node
  async executeTelegramSendNode(node, inputData, execution) {
    try {
      logger.logTelegramEvent(node.id, 'send_message_started', {
        executionId: execution.id,
        inputDataSize: JSON.stringify(inputData).length
      });
      
      // Get node configuration (in production, this would be stored with the node)
      // For now, we'll use default/mock configuration
      const nodeConfig = node.config || {
        botToken: process.env.TELEGRAM_BOT_TOKEN || 'mock_token',
        chatId: inputData?.message?.chat?.id || '@test_channel',
        messageText: 'Hello {{message.from.first_name}}! You said: {{message.text}}',
        parseMode: '',
        disableWebPagePreview: false
      };

      // Validate required fields
      if (!nodeConfig.botToken || nodeConfig.botToken === 'mock_token') {
        logger.logTelegramEvent(node.id, 'using_mock_response', {
          reason: 'no_valid_bot_token',
          executionId: execution.id
        });
        return this.getMockTelegramResponse(inputData);
      }

      if (!nodeConfig.chatId) {
        throw new Error('Chat ID is required for Telegram send node');
      }

      if (!nodeConfig.messageText) {
        throw new Error('Message text is required for Telegram send node');
      }

      // Process templates in configuration
      const processedChatId = TemplateProcessor.processTemplate(nodeConfig.chatId, inputData);
      const processedMessageText = TemplateProcessor.processTemplate(nodeConfig.messageText, inputData);

      logger.logTelegramEvent(node.id, 'message_processed', {
        chatId: processedChatId,
        messageLength: processedMessageText.length,
        executionId: execution.id
      });

      // Create Telegram API instance
      const telegramAPI = new TelegramAPI(nodeConfig.botToken);

      // Send message
      const result = await telegramAPI.sendMessage(processedChatId, processedMessageText, {
        parseMode: nodeConfig.parseMode,
        disableWebPagePreview: nodeConfig.disableWebPagePreview
      });

      if (result.success) {
        logger.logTelegramEvent(node.id, 'message_sent_success', {
          messageId: result.data?.result?.message_id,
          executionId: execution.id
        });
        return {
          success: true,
          data: result.data
        };
      } else {
        logger.logTelegramEvent(node.id, 'message_sent_failed', {
          error: result.error.message,
          executionId: execution.id
        });
        return handleTelegramError(new Error(result.error.message || 'Failed to send message'), {
          nodeId: node.id,
          executionId: execution.id
        });
      }

    } catch (error) {
      logger.logError(error, {
        context: 'executeTelegramSendNode',
        nodeId: node.id,
        executionId: execution.id
      });
      return handleWorkflowError(error, execution.id, node.id);
    }
  }

  // Mock response for testing when no real bot token is provided
  getMockTelegramResponse(inputData) {
    const mockResponse = {
      ok: true,
      result: {
        message_id: Math.floor(Math.random() * 1000000),
        from: {
          id: 123456789,
          is_bot: true,
          first_name: "WorkflowBot",
          username: "workflow_bot"
        },
        chat: {
          id: inputData?.message?.chat?.id || 987654321,
          type: "private"
        },
        date: Math.floor(Date.now() / 1000),
        text: `Mock response to: ${inputData?.message?.text || 'trigger'}`
      }
    };

    logger.debug('Mock Telegram response generated', { 
      messageId: mockResponse.result.message_id 
    });
    return {
      success: true,
      data: mockResponse
    };
  }

  // Move completed execution to history
  moveToHistory(execution) {
    activeExecutions.delete(execution.id);
    executionHistory.push({
      ...execution,
      nodeOutputs: Array.from(execution.nodeOutputs.entries())
    });

    // Keep only last 100 executions
    if (executionHistory.length > 100) {
      executionHistory.shift();
    }

    logger.logWorkflowExecution(execution.id, 'moved_to_history', {
      status: execution.status,
      nodeCount: execution.nodeOutputs.size,
      errorCount: execution.errors.length
    });
  }

  // Get execution status
  getExecution(executionId) {
    return activeExecutions.get(executionId) || 
           executionHistory.find(exec => exec.id === executionId);
  }

  // Get all executions for debugging
  getAllExecutions() {
    return {
      active: Array.from(activeExecutions.values()),
      history: executionHistory.slice(-20) // Last 20
    };
  }
}

// Create singleton instance
const workflowEngine = new WorkflowEngine();

module.exports = workflowEngine;