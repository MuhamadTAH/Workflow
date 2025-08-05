// Test login functionality
const axios = require('axios');

async function testLogin() {
  try {
    console.log('Testing login with your credentials...');
    
    const response = await axios.post('http://localhost:3001/api/login', {
      email: 'mhamadtah548@gmail.com',
      password: '1qazxsw2'
    });
    
    console.log('✅ Login successful!');
    console.log('Response:', response.data);
    console.log('Token:', response.data.token);
    
    // Test the token by getting profile
    const profileResponse = await axios.get('http://localhost:3001/api/profile', {
      headers: {
        'Authorization': `Bearer ${response.data.token}`
      }
    });
    
    console.log('✅ Profile fetch successful!');
    console.log('User data:', profileResponse.data);
    
  } catch (error) {
    console.error('❌ Login failed:');
    console.error('Status:', error.response?.status);
    console.error('Message:', error.response?.data?.message);
    console.error('Full error:', error.message);
  }
}

testLogin();