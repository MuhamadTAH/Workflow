import { useState } from 'react';
import { Link } from 'react-router-dom';
import PhoneMockup from '../components/PhoneMockup';
import '../styles/AuthStyles.css';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [conversation, setConversation] = useState([
    { id: 1, text: "No worries! It happens. What's the email address associated with your account? 🤔", sender: 'them' }
  ]);

  const addMessage = (text, sender) => {
    setConversation(prev => [...prev, { id: Date.now() + Math.random(), text, sender }]);
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    if (!email) {
      setError("Please enter your email address first.");
      addMessage("Please enter your email address first. 📧", 'them');
      return;
    }
    
    if (!email.includes('@') || !email.includes('.')) {
      setError("That email doesn't look quite right. Please check it and try again.");
      addMessage("That email doesn't look quite right. Please check it and try again.", 'them');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    addMessage(email, 'me');

    // Simulate API call for password reset
    const simulatePasswordReset = () => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ success: true });
        }, 1500);
      });
    };

    try {
      await simulatePasswordReset();
      const successMessage = "If an account exists for that email, you'll find a reset link in your inbox.";
      setSuccess(successMessage);
      addMessage("Got it! If an account exists for that email, you'll find a reset link in your inbox. 💌", 'them');
    } catch (err) {
      const errorMessage = "Something went wrong. Please try again.";
      setError(errorMessage);
      addMessage("Uh oh! 🤖 Our servers are a bit shy right now. Please try again in a moment.", 'them');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css" />
      <main className="auth-container">
        <PhoneMockup conversation={conversation} view="forgotPassword" />
        <div className="auth-form">
          <h1 className="auth-form__title">Forgot Password</h1>
          <p className="auth-form__subtitle">Enter your email and we'll send you a reset link.</p>
          
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {success && (
            <div className="success-message">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <i className="fa-solid fa-at input-group__icon"></i>
              <input 
                type="email" 
                className="input-group__input" 
                placeholder="Email" 
                value={email}
                onChange={handleEmailChange}
                autoComplete="email"
                required
              />
            </div>
            
            <div className="auth-form__buttons">
              <button type="submit" className="auth-btn" disabled={loading}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </div>
            
            <div className="auth-form__secondary-buttons">
              <Link to="/login" className="auth-btn">Back to Login</Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default ForgotPassword;