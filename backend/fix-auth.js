const bcrypt = require('bcrypt');
const Database = require('better-sqlite3');
const db = new Database('./database.sqlite');

const email = 'mhamadtah548@gmail.com';
const password = '1qazxsw2';

console.log('🔍 Checking authentication for:', email);

async function checkAuth() {
  try {
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    const user = stmt.get(email);
    
    if (!user) {
      console.log('❌ User not found. Creating new user...');
      
      const hashedPassword = await bcrypt.hash(password, 10);
      
      try {
        const insertStmt = db.prepare('INSERT INTO users (name, email, password) VALUES (?, ?, ?)');
        const result = insertStmt.run('Muhamad TAH', email, hashedPassword);
        
        console.log('✅ User created successfully! ID:', result.lastInsertRowid);
        console.log('✅ You can now login with:', email);
      } catch (insertError) {
        console.log('❌ Error creating user:', insertError);
      }
    } else {
      console.log('✅ User found:', user.email);
      
      const isValidPassword = await bcrypt.compare(password, user.password);
      
      if (isValidPassword) {
        console.log('✅ Password is correct! Login should work.');
      } else {
        console.log('❌ Password incorrect. Updating password...');
        
        const newHashedPassword = await bcrypt.hash(password, 10);
        
        try {
          const updateStmt = db.prepare('UPDATE users SET password = ? WHERE email = ?');
          updateStmt.run(newHashedPassword, email);
          
          console.log('✅ Password updated successfully!');
          console.log('✅ You can now login with:', email);
        } catch (updateError) {
          console.log('❌ Error updating password:', updateError);
        }
      }
    }
  } catch (error) {
    console.log('❌ Error:', error);
  } finally {
    db.close();
  }
}

checkAuth();