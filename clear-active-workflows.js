#!/usr/bin/env node
/*
=================================================================
SCRIPT: clear-active-workflows.js  
=================================================================
Safely removes active workflow execution state from database.
Does NOT affect saved workflow designs in Workflow Builder.
*/

const db = require('./backend/db');

console.log('🧹 Clearing Active Workflow Execution State...\n');

try {
  // Check current active workflows
  const checkStmt = db.prepare('SELECT workflow_id, activated_at FROM active_workflows WHERE status = "active"');
  const activeWorkflows = checkStmt.all() || [];
  
  console.log(`📋 Found ${activeWorkflows.length} active workflow executions:`);
  if (Array.isArray(activeWorkflows) && activeWorkflows.length > 0) {
    activeWorkflows.forEach(workflow => {
      console.log(`   • ${workflow.workflow_id} (activated: ${workflow.activated_at})`);
    });
  }
  
  if (!activeWorkflows || activeWorkflows.length === 0) {
    console.log('✅ No active workflows found. Database is already clean.');
    console.log('✅ WhatsApp messages will not trigger automatic execution.');
    process.exit(0);
  }
  
  console.log('\n🗑️ Deleting active workflow execution state...');
  
  // Delete all active workflows (only execution state, not designs)
  const deleteStmt = db.prepare('DELETE FROM active_workflows');
  const result = deleteStmt.run();
  
  console.log(`✅ Successfully removed ${result.changes} active workflow executions.`);
  console.log('✅ WhatsApp webhook will receive messages but NOT execute workflows.');
  console.log('\n📝 What this means:');
  console.log('   ✅ Your workflow designs remain saved in Workflow Builder');
  console.log('   ✅ WhatsApp Trigger/Send nodes keep their configurations');
  console.log('   ✅ You can still edit workflows in Workflow Builder');
  console.log('   ✅ Webhook receives messages but ignores them');
  console.log('   ✅ WhatsApp Chat page will show no conversations');
  console.log('   ❌ No automatic message processing until manually activated');
  
} catch (error) {
  console.error('❌ Error clearing active workflows:', error);
  process.exit(1);
}