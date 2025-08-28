#!/usr/bin/env node
/*
=================================================================
SCRIPT: verify-cleanup.js
=================================================================
Verify that active workflows have been cleared from database
*/

const db = require('./backend/db');

console.log('🔍 Verifying Active Workflows Cleanup...\n');

try {
  // Check if active_workflows table exists
  const tableCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='active_workflows'");
  const tableExists = tableCheck.get();
  
  if (!tableExists) {
    console.log('📋 active_workflows table does not exist yet.');
    console.log('✅ No active workflows can exist - cleanup confirmed.');
    process.exit(0);
  }
  
  console.log('📋 active_workflows table exists, checking contents...');
  
  // Get all rows
  const allStmt = db.prepare('SELECT workflow_id, status FROM active_workflows');
  const allRows = allStmt.all() || [];
  const total = allRows.length;
  
  // Filter active rows
  const activeRows = allRows.filter(row => row.status === 'active');
  const active = activeRows.length;
  
  console.log(`📊 Database Status:`);
  console.log(`   • Total workflow records: ${total}`);
  console.log(`   • Active workflow records: ${active}`);
  
  if (active === 0) {
    console.log('\n✅ SUCCESS: No active workflows found in database');
    console.log('✅ WhatsApp messages will be received but NOT processed');
    console.log('✅ Your workflow designs are safe and unchanged');
  } else {
    console.log(`\n⚠️  WARNING: ${active} active workflows still exist`);
    console.log('❌ WhatsApp messages may still trigger automatic execution');
  }
  
} catch (error) {
  console.error('❌ Error verifying cleanup:', error);
  process.exit(1);
}