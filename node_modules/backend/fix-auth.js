const bcrypt = require('bcrypt');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

const email = 'mhamadtah548@gmail.com';
const password = '1qazxsw2';

console.log('🔍 Checking authentication for:', email);

db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
  if (err) {
    console.log('❌ Database error:', err);
    return;
  }
  
  try {
    if (!user) {
      console.log('❌ User not found. Creating new user...');
      
      const hashedPassword = await bcrypt.hash(password, 10);
      
      db.run('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', 
        ['Muhamad TAH', email, hashedPassword], 
        function(err) {
          if (err) {
            console.log('❌ Error creating user:', err);
          } else {
            console.log('✅ User created successfully! ID:', this.lastID);
            console.log('✅ You can now login with:', email);
          }
          db.close();
        });
    } else {
      console.log('✅ User found:', user.email);
      
      const isValidPassword = await bcrypt.compare(password, user.password);
      
      if (isValidPassword) {
        console.log('✅ Password is correct! Login should work.');
        db.close();
      } else {
        console.log('❌ Password incorrect. Updating password...');
        
        const newHashedPassword = await bcrypt.hash(password, 10);
        
        db.run('UPDATE users SET password = ? WHERE email = ?', 
          [newHashedPassword, email], 
          (err) => {
            if (err) {
              console.log('❌ Error updating password:', err);
            } else {
              console.log('✅ Password updated successfully!');
              console.log('✅ You can now login with:', email);
            }
            db.close();
          });
      }
    }
  } catch (error) {
    console.log('❌ Error:', error);
    db.close();
  }
});