import { Navigate } from 'react-router-dom';
import { tokenManager } from '../api';
import './Privacy.css';

function Privacy() {
  // Check if user is authenticated
  if (!tokenManager.isLoggedIn()) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="privacy-page">
      <div className="privacy-container">
        <div className="privacy-content">
          <div className="privacy-header">
            <h1>Privacy Policy</h1>
            <p className="last-updated">Last updated: August 2025</p>
          </div>

          <div className="privacy-section">
            <h2>1. Introduction</h2>
            <p>
              Your Company ("we", "us", "our") operates the service at yourdomain.com (the "Service"). 
              This Privacy Policy explains what personal data we collect, how we use it, and your rights.
            </p>
          </div>

          <div className="privacy-section">
            <h2>2. Data We Collect</h2>
            
            <h3>2.1. Account Information</h3>
            <p>Name, email address, password (hashed), profile picture.</p>

            <h3>2.2. Social Media Integrations</h3>
            <p>
              When you connect a TikTok, Facebook, Instagram, Telegram, WhatsApp, X, or LinkedIn account, 
              we store the OAuth tokens, your user ID or username, and any basic profile data 
              (e.g., display name, avatar).
            </p>

            <h3>2.3. Workflow & Shop Data</h3>
            <p>
              Workflows you create, node configurations, shop products (titles, descriptions, images, prices), 
              order/contact methods.
            </p>

            <h3>2.4. Communications</h3>
            <p>
              Messages you send via Telegram or other bots, chat history if you opt in to memory.
            </p>

            <h3>2.5. Usage Data & Analytics</h3>
            <p>
              IP address, browser type, operating system, pages visited, actions performed, timestamps 
              (for performance monitoring and security).
            </p>
          </div>

          <div className="privacy-section">
            <h2>3. How We Use Your Data</h2>
            <ul>
              <li><strong>Provide & improve the Service:</strong> authenticate you, run workflows, store configurations.</li>
              <li><strong>Integrations:</strong> use your OAuth tokens to connect to third-party APIs (TikTok, Meta, etc.).</li>
              <li><strong>Communication:</strong> send notifications, workflow results, shop inquiries.</li>
              <li><strong>Analytics & troubleshooting:</strong> monitor performance, diagnose issues.</li>
              <li><strong>Marketing (optional):</strong> with your consent, email announcements about new features.</li>
            </ul>
          </div>

          <div className="privacy-section">
            <h2>4. Data Sharing & Disclosure</h2>
            <p>We do not sell or rent your personal data.</p>
            <p>We share data with:</p>
            <ul>
              <li>Third-party API providers (TikTok, Meta, Telegram, etc.) only to execute your workflows.</li>
              <li>Service providers (hosting, analytics, email) under strict confidentiality agreements.</li>
              <li>Legal requirements: if compelled by law or to protect our rights.</li>
            </ul>
          </div>

          <div className="privacy-section">
            <h2>5. Data Storage & Security</h2>
            <ul>
              <li>Data is stored in secure, encrypted databases (e.g. MongoDB Atlas/PostgreSQL).</li>
              <li>OAuth tokens are encrypted at rest.</li>
              <li>We use HTTPS everywhere, and industry-standard security practices (firewalls, access controls, regular audits).</li>
            </ul>
          </div>

          <div className="privacy-section">
            <h2>6. Your Rights</h2>
            <ul>
              <li><strong>Access & portability:</strong> request a copy of your data.</li>
              <li><strong>Correction:</strong> correct any inaccurate data.</li>
              <li><strong>Deletion:</strong> delete your account and associated data (except data we must retain for legal reasons).</li>
              <li><strong>Opt-out:</strong> unsubscribe from marketing emails.</li>
            </ul>
            <p>To exercise these rights, email us at <a href="mailto:privacy@yourdomain.com">privacy@yourdomain.com</a>.</p>
          </div>

          <div className="privacy-section">
            <h2>7. Cookies & Tracking</h2>
            <ul>
              <li>We use essential cookies for authentication and optional cookies for analytics (Google Analytics, etc.).</li>
              <li>You may disable non-essential cookies in your browser settings.</li>
            </ul>
          </div>

          <div className="privacy-section">
            <h2>8. Children's Privacy</h2>
            <p>Our Service is not directed to children under 16. We do not knowingly collect data from minors.</p>
          </div>

          <div className="privacy-section">
            <h2>9. Changes to This Policy</h2>
            <p>
              We may update this Policy. We will notify registered users by email and post the revised date above.
            </p>
          </div>

          <div className="privacy-section">
            <h2>10. Contact Us</h2>
            <p>
              If you have questions, contact <a href="mailto:privacy@yourdomain.com">privacy@yourdomain.com</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Privacy;