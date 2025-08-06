import { Navigate } from 'react-router-dom';
import { tokenManager } from '../api';
import './Terms.css';

function Terms() {
  // Check if user is authenticated
  if (!tokenManager.isLoggedIn()) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="terms-page">
      <div className="terms-container">
        <div className="terms-content">
          <div className="terms-header">
            <h1>Terms of Service</h1>
            <p className="last-updated">Last updated: August 2025</p>
          </div>

          <div className="terms-section">
            <h2>1. Acceptance of Terms</h2>
            <p>
              By using our Service at yourdomain.com, you agree to these Terms of Service ("Terms").
            </p>
          </div>

          <div className="terms-section">
            <h2>2. Description of Service</h2>
            <p>
              We provide a workflow automation and shop-creation platform that connects to third-party services 
              (TikTok, Meta, Telegram, WhatsApp, X, LinkedIn, etc.).
            </p>
          </div>

          <div className="terms-section">
            <h2>3. Account Registration</h2>
            <ul>
              <li>You must be 16+ and provide a valid email.</li>
              <li>Keep your password secure. You are responsible for activity under your account.</li>
            </ul>
          </div>

          <div className="terms-section">
            <h2>4. User Content & Workflows</h2>
            <ul>
              <li>You retain ownership of your data (workflows, shop products, messages).</li>
              <li>You grant us a license to store and process your content to provide the Service.</li>
              <li>You represent that your content does not infringe third-party rights.</li>
            </ul>
          </div>

          <div className="terms-section">
            <h2>5. Third-Party Integrations</h2>
            <ul>
              <li>To connect external accounts, you grant us permission (via OAuth) to access those services on your behalf.</li>
              <li>You agree to comply with each provider's terms (e.g., TikTok Developer Policy, Meta Platform Policy).</li>
              <li>We are not responsible for your use of third-party APIs or their availability.</li>
            </ul>
          </div>

          <div className="terms-section">
            <h2>6. Fees & Payments (if applicable)</h2>
            <ul>
              <li>Some features may require a paid subscription.</li>
              <li>Payment terms, billing cycles, and refund policy are detailed in our separate Billing & Subscription page.</li>
            </ul>
          </div>

          <div className="terms-section">
            <h2>7. Prohibited Conduct</h2>
            <p>You may not:</p>
            <ul>
              <li>Violate any law or infringe rights.</li>
              <li>Send spam, malware, or unauthorized messages via integrations.</li>
              <li>Attempt to reverse-engineer our platform.</li>
            </ul>
          </div>

          <div className="terms-section">
            <h2>8. Suspension & Termination</h2>
            <ul>
              <li>We may suspend or terminate your account for violations or inactivity.</li>
              <li>On termination, we delete your data within 30 days (unless required by law).</li>
            </ul>
          </div>

          <div className="terms-section">
            <h2>9. Disclaimers & Limitations</h2>
            <ul>
              <li>The Service is provided "as-is." We disclaim all warranties, express or implied.</li>
              <li>We are not liable for indirect, incidental, or consequential damages.</li>
            </ul>
          </div>

          <div className="terms-section">
            <h2>10. Indemnification</h2>
            <p>
              You agree to indemnify and hold us harmless from claims arising from your use of the Service 
              or violation of these Terms.
            </p>
          </div>

          <div className="terms-section">
            <h2>11. Governing Law</h2>
            <p>
              These Terms are governed by the laws of [Your Jurisdiction], without regard to conflict of laws.
            </p>
          </div>

          <div className="terms-section">
            <h2>12. Changes to Terms</h2>
            <p>
              We may update these Terms. We will notify you by email and publish the new version with a 
              revised date. Continued use constitutes acceptance.
            </p>
          </div>

          <div className="terms-section">
            <h2>13. Contact Information</h2>
            <p>
              Questions? Email <a href="mailto:support@yourdomain.com">support@yourdomain.com</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Terms;