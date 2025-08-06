const bcrypt = require('bcrypt');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'backend', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

const email = 'mhamadtah548@gmail.com';
const password = '1qazxsw2';

console.log('🔍 Checking user authentication...');

db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
  if (err) {
    console.log('❌ Database error:', err);
    db.close();
    return;
  }
  
  if (!user) {
    console.log('❌ User not found with email:', email);
    console.log('📋 Checking all users in database...');
    
    db.all('SELECT id, email, name, created_at FROM users', (err, users) => {
      if (err) {
        console.log('Error getting users:', err);
        db.close();
        return;
      }
      
      console.log('Total users found:', users.length);
      users.forEach(u => {
        console.log(`- ID: ${u.id}, Email: ${u.email}, Name: ${u.name || 'No name'}`);
      });
      
      if (users.length === 0) {
        console.log('🔧 No users found. Creating user with provided credentials...');
        createUser();
      } else {
        console.log('❌ User with email', email, 'does not exist in database');
        console.log('💡 Try using one of the existing emails above or create a new account');
        db.close();
      }
    });
  } else {
    console.log('✅ User found:', user.email);
    console.log('🔐 Testing password...');
    
    try {
      const isValidPassword = await bcrypt.compare(password, user.password);
      console.log('Password validation result:', isValidPassword);
      
      if (!isValidPassword) {
        console.log('🔧 Password incorrect. Updating to correct password...');
        updatePassword(user.id);
      } else {
        console.log('✅ Password is correct! Login should work.');
        db.close();
      }
    } catch (error) {
      console.log('Error comparing password:', error);
      console.log('🔧 Updating password anyway...');
      updatePassword(user.id);
    }
  }
});

function createUser() {
  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) {
      console.log('Error hashing password:', err);
      db.close();
      return;
    }
    
    db.run('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', 
      ['Muhamad TAH', email, hashedPassword], 
      function(err) {
        if (err) {
          console.log('Error creating user:', err);
        } else {
          console.log('✅ User created successfully with ID:', this.lastID);
          console.log('✅ You can now login with:', email, '/', password);
        }
        db.close();
      });
  });
}

function updatePassword(userId) {
  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) {
      console.log('Error hashing password:', err);
      db.close();
      return;
    }
    
    db.run('UPDATE users SET password = ? WHERE id = ?', 
      [hashedPassword, userId], 
      (err) => {
        if (err) {
          console.log('Error updating password:', err);
        } else {
          console.log('✅ Password updated successfully');
          console.log('✅ You can now login with:', email, '/', password);
        }
        db.close();
      });
  });
}