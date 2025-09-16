import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI, tokenManager } from '../api';
import { API_BASE_URL } from '../config/api';
import PhoneMockup from '../components/PhoneMockup';
import '../styles/AuthStyles.css';

function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [conversation, setConversation] = useState([
    { id: 1, text: 'Hey there! 👋 Ready to log in or need to create an account?', sender: 'them' }
  ]);
  const navigate = useNavigate();

  const addMessage = (text, sender) => {
    setConversation(prev => [...prev, { id: Date.now() + Math.random(), text, sender }]);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    
    if (e.target.name === 'email' && e.target.value.includes('@')) {
      const hasFollowUpMessage = conversation.some(msg => msg.id === 2);
      if (!hasFollowUpMessage) {
        const newMessage = { id: 2, text: "Looks like you've been here before! 😉", sender: 'them' };
        setConversation(prev => [...prev, newMessage]);
      }
    }
  };

  const handlePasswordFocus = () => {
    const hasSentEmail = conversation.some(msg => msg.sender === 'me' && msg.text === formData.email);
    if (formData.email.includes('@') && formData.email.includes('.') && !hasSentEmail) {
      addMessage(formData.email, 'me');
      setTimeout(() => {
        addMessage("Got it! ✅ Now, just enter your secret password.", 'them');
      }, 250);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.password || loading) return;

    setLoading(true);
    setError('');
    
    const maskedPassword = '•'.repeat(formData.password.length);
    addMessage(maskedPassword, 'me');

    try {
      console.log('🔑 Attempting login with:', { email: formData.email, password: '***' });
      console.log('🌐 API Base URL:', API_BASE_URL);
      
      // TODO: Integrate with n8n authentication
      // For now, bypass authentication to test n8n workflows
      if (formData.email === 'mhamadtah548@gmail.com' && formData.password === '1qazxsw2') {
        const mockToken = 'MOCK_TOKEN_FOR_TESTING_' + Date.now();
        tokenManager.setToken(mockToken);
        addMessage("Awesome, you're in! Welcome back! 🚀", 'them');
        
        setTimeout(() => {
          navigate('/');
        }, 1500);
      } else {
        throw new Error('Invalid credentials');
      }
    } catch (err) {
      console.error('❌ Login error:', err);
      console.error('❌ Error response:', err.response);
      console.error('❌ Error status:', err.response?.status);
      console.error('❌ Error data:', err.response?.data);
      
      const errorMessage = err.response?.data?.message || err.message || 'Login failed';
      setError(errorMessage);
      addMessage("Hmm, that combo didn't work. 🤔 Double-check your email and password and let's give it another shot!", 'them');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css" />
      <main className="auth-container">
        <PhoneMockup conversation={conversation} view="login" />
        <div className="auth-form">
          <div className="brand-header">
            <h2 className="brand-name">⚡ FIXDAI LLC</h2>
            <p className="brand-subtitle">AI-Powered Business Solutions</p>
          </div>
          <h1 className="auth-form__title">Login</h1>
          
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <i className="fa-solid fa-at input-group__icon"></i>
              <input 
                type="email" 
                name="email"
                className="input-group__input" 
                placeholder="Email Address" 
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
                required
              />
            </div>
            
            <div className="input-group">
              <i className="fa-solid fa-lock input-group__icon"></i>
              <input 
                type="password" 
                name="password"
                className="input-group__input" 
                placeholder="Password" 
                value={formData.password}
                onChange={handleChange}
                onFocus={handlePasswordFocus}
                autoComplete="current-password"
                required
              />
            </div>
            
            <div className="auth-form__buttons">
              <button type="submit" className="auth-btn" disabled={loading}>
                {loading ? 'Logging in...' : 'Login'}
              </button>
              <Link to="/signup" className="auth-btn">Sign Up</Link>
            </div>
            
            <div className="auth-form__secondary-buttons">
              <Link to="/forgot-password" className="auth-btn">Forgot Password</Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default Login;