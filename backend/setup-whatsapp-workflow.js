/*
=================================================================
FILE: backend/setup-whatsapp-workflow.js
=================================================================
Script to create and activate a default WhatsApp trigger workflow
This will process incoming WhatsApp messages and store conversations
*/

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const workflowExecutor = require('./services/workflowExecutor');

// Database setup
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

// Default WhatsApp trigger workflow configuration
const defaultWhatsAppWorkflow = {
  name: "WhatsApp Message Handler",
  description: "Default workflow to process incoming WhatsApp messages and store conversations",
  nodes: [
    {
      id: "whatsapp-trigger-1",
      type: "whatsappTrigger", 
      position: { x: 100, y: 100 },
      data: {
        type: "whatsappTrigger",
        label: "WhatsApp Trigger",
        appId: "{{$env.WHATSAPP_APP_ID}}",
        clientSecret: "{{$env.WHATSAPP_CLIENT_SECRET}}"
      }
    },
    {
      id: "data-storage-1",
      type: "dataStorageNode",
      position: { x: 400, y: 100 },
      data: {
        type: "dataStorageNode", 
        label: "Store Message",
        tableName: "whatsapp_conversations",
        operation: "insert",
        fields: {
          phone_number: "{{$node.whatsapp-trigger-1.phoneNumber}}",
          contact_name: "{{$node.whatsapp-trigger-1.fromName}}",
          message_text: "{{$node.whatsapp-trigger-1.message}}",
          message_id: "{{$node.whatsapp-trigger-1.messageId}}",
          timestamp: "{{$node.whatsapp-trigger-1.timestamp}}",
          direction: "incoming",
          created_at: "{{$now}}"
        }
      }
    }
  ],
  edges: [
    {
      id: "edge-1",
      source: "whatsapp-trigger-1",
      target: "data-storage-1",
      type: "default"
    }
  ],
  connections: [
    {
      source: "whatsapp-trigger-1",
      target: "data-storage-1"
    }
  ]
};

// Create conversations table if it doesn't exist
function createConversationsTable() {
  return new Promise((resolve, reject) => {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS whatsapp_conversations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phone_number TEXT NOT NULL,
        contact_name TEXT,
        message_text TEXT,
        message_id TEXT UNIQUE,
        timestamp TEXT,
        direction TEXT DEFAULT 'incoming',
        processed BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    db.run(createTableSQL, (err) => {
      if (err) {
        console.error('❌ Error creating conversations table:', err);
        reject(err);
      } else {
        console.log('✅ WhatsApp conversations table created/verified');
        resolve();
      }
    });
  });
}

// Create the workflow in database
function createWorkflow() {
  return new Promise((resolve, reject) => {
    const userId = 'system'; // System user for default workflows
    const workflowData = {
      nodes: defaultWhatsAppWorkflow.nodes,
      connections: defaultWhatsAppWorkflow.connections,
      edges: defaultWhatsAppWorkflow.edges,
      metadata: {
        version: '1.0',
        createdBy: 'system',
        purpose: 'WhatsApp message processing',
        savedAt: new Date().toISOString()
      }
    };

    db.run(
      'INSERT OR REPLACE INTO workflows (id, user_id, name, description, data) VALUES (?, ?, ?, ?, ?)',
      [1, userId, defaultWhatsAppWorkflow.name, defaultWhatsAppWorkflow.description, JSON.stringify(workflowData)],
      function(err) {
        if (err) {
          console.error('❌ Error creating workflow:', err);
          reject(err);
        } else {
          console.log('✅ Default WhatsApp workflow created with ID:', this.lastID || 1);
          resolve(this.lastID || 1);
        }
      }
    );
  });
}

// Activate the workflow
function activateWorkflow(workflowId) {
  return new Promise((resolve, reject) => {
    try {
      console.log(`🚀 Activating WhatsApp workflow ${workflowId}...`);
      
      // Register workflow with executor
      const success = workflowExecutor.registerWorkflow(
        workflowId.toString(), 
        defaultWhatsAppWorkflow, 
        { autoCreated: true }
      );
      
      if (success) {
        console.log('✅ WhatsApp workflow activated successfully');
        console.log(`📊 Total active workflows: ${workflowExecutor.activeWorkflows.size}`);
        resolve(workflowId);
      } else {
        reject(new Error('Failed to register workflow with executor'));
      }
    } catch (error) {
      console.error('❌ Error activating workflow:', error);
      reject(error);
    }
  });
}

// Main setup function
async function setupDefaultWhatsAppWorkflow() {
  try {
    console.log('\n🚀 Setting up default WhatsApp workflow...\n');
    
    // Step 1: Create conversations table
    console.log('📋 Step 1: Creating WhatsApp conversations table...');
    await createConversationsTable();
    
    // Step 2: Create workflow in database
    console.log('📋 Step 2: Creating default WhatsApp workflow...');
    const workflowId = await createWorkflow();
    
    // Step 3: Activate workflow
    console.log('📋 Step 3: Activating WhatsApp workflow...');
    await activateWorkflow(workflowId);
    
    console.log('\n✅ DEFAULT WHATSAPP WORKFLOW SETUP COMPLETE!');
    console.log('📱 WhatsApp messages will now be processed and stored automatically');
    console.log(`📊 Workflow ID: ${workflowId}`);
    console.log(`🗄️ Messages stored in: whatsapp_conversations table`);
    
    // Show current active workflows
    if (workflowExecutor && workflowExecutor.activeWorkflows) {
      console.log(`\n📈 Active Workflows Summary:`);
      console.log(`   Total active: ${workflowExecutor.activeWorkflows.size}`);
      
      for (const [id, config] of workflowExecutor.activeWorkflows.entries()) {
        const triggerTypes = config.nodes ? 
          config.nodes.filter(n => n.data?.type?.includes('Trigger')).map(n => n.data.type) : [];
        console.log(`   - Workflow ${id}: ${triggerTypes.join(', ')}`);
      }
    }
    
  } catch (error) {
    console.error('\n❌ SETUP FAILED:', error.message);
    throw error;
  } finally {
    // Close database connection
    db.close((err) => {
      if (err) {
        console.error('❌ Error closing database:', err.message);
      } else {
        console.log('📊 Database connection closed');
      }
    });
  }
}

// Run setup if called directly
if (require.main === module) {
  setupDefaultWhatsAppWorkflow()
    .then(() => {
      console.log('\n🎉 WhatsApp workflow setup completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Setup failed:', error);
      process.exit(1);
    });
}

module.exports = {
  setupDefaultWhatsAppWorkflow,
  createConversationsTable,
  defaultWhatsAppWorkflow
};