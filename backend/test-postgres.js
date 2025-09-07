// Test PostgreSQL connection
require('dotenv').config();

async function testConnection() {
  console.log('🧪 Testing PostgreSQL connection...');
  
  try {
    // Test the connection
    const db = require('./db-postgres');
    console.log('✅ Database connection established');
    
    // Test basic query
    const result = await db.query('SELECT NOW() as current_time');
    console.log('✅ Query test successful:', result.rows[0]);
    
    // Initialize database
    const PostgreSQLInitializer = require('./services/dbInitializer-postgres');
    await PostgreSQLInitializer.initialize();
    console.log('✅ Database initialization successful');
    
    // Health check
    const health = await PostgreSQLInitializer.healthCheck();
    console.log('✅ Health check:', health);
    
    console.log('🎉 All tests passed! PostgreSQL is ready.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testConnection();