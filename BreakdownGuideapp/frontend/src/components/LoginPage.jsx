// Enhanced Login Page with Professional Desktop Layout
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import SupervisorLoginWithContext from './SupervisorLoginWithContext.jsx';

const LoginPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isSessionChecking } = useAuth();

  // Redirect to homepage if already authenticated
  useEffect(() => {
    if (!isSessionChecking && isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, isSessionChecking, navigate]);

  // Handle successful login
  const handleLoginSuccess = (user) => {
    console.log('Login successful, redirecting to homepage...', user);
    // Small delay to ensure auth state updates
    setTimeout(() => {
      navigate('/', { replace: true });
    }, 100);
  };

  return (
    <div className="login-page-wrapper">
      <div className="login-split-container">
        {/* Left Panel - Branding */}
        <div className="login-brand-panel">
          <div className="brand-content">
            <img 
              src="/GO_NORTHEAST_WHITE_RGB.png" 
              alt="Go North East" 
              className="brand-logo"
            />
            <h1>Breakdown Management System</h1>
            <p className="brand-tagline">
              Ensuring passenger safety through structured assessment and rapid response
            </p>
            
            <div className="feature-highlights">
              <div className="feature-item">
                <span className="feature-icon">🚨</span>
                <div>
                  <h3>Rapid Response</h3>
                  <p>Quick assessment wizards for immediate action</p>
                </div>
              </div>
              <div className="feature-item">
                <span className="feature-icon">📊</span>
                <div>
                  <h3>Real-time Tracking</h3>
                  <p>Monitor breakdowns and engineering response</p>
                </div>
              </div>
              <div className="feature-item">
                <span className="feature-icon">✅</span>
                <div>
                  <h3>SDC Compliant</h3>
                  <p>Aligned with Service Delivery Centre guidelines</p>
                </div>
              </div>
            </div>

            <div className="brand-footer">
              <p>© 2025 Go North East. Part of GoAhead Group</p>
            </div>
          </div>
        </div>

        {/* Right Panel - Login Form */}
        <div className="login-form-panel">
          <SupervisorLoginWithContext 
            className="embedded-login" 
            onSuccess={handleLoginSuccess}
          />
        </div>
      </div>

      <style jsx>{`
        .login-page-wrapper {
          min-height: 100vh;
          width: 100%;
          display: flex;
          background: #f7f9fc;
        }

        .login-split-container {
          width: 100%;
          display: flex;
          flex-direction: row;
          min-height: 100vh;
        }

        /* Left Brand Panel */
        .login-brand-panel {
          flex: 1;
          background: linear-gradient(135deg, #003B5C 0%, #E4002B 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 60px;
          position: relative;
          overflow: hidden;
        }

        .login-brand-panel::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%);
          animation: float 20s ease-in-out infinite;
        }

        .login-brand-panel::after {
          content: '';
          position: absolute;
          bottom: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 70%);
          animation: float 25s ease-in-out infinite reverse;
        }

        @keyframes float {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(30px, -30px) rotate(120deg); }
          66% { transform: translate(-20px, 20px) rotate(240deg); }
        }

        .brand-content {
          position: relative;
          z-index: 1;
          color: white;
          text-align: center;
          max-width: 500px;
        }

        .brand-logo {
          height: 100px;
          width: auto;
          margin-bottom: 40px;
          filter: drop-shadow(0 4px 20px rgba(0,0,0,0.2));
        }

        .brand-content h1 {
          font-size: 42px;
          font-weight: 700;
          margin: 0 0 20px 0;
          text-shadow: 0 2px 10px rgba(0,0,0,0.2);
          line-height: 1.2;
        }

        .brand-tagline {
          font-size: 18px;
          opacity: 0.95;
          margin: 0 0 60px 0;
          line-height: 1.5;
        }

        .feature-highlights {
          display: flex;
          flex-direction: column;
          gap: 30px;
          margin-bottom: 60px;
        }

        .feature-item {
          display: flex;
          align-items: flex-start;
          gap: 20px;
          text-align: left;
        }

        .feature-icon {
          font-size: 32px;
          width: 50px;
          height: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.15);
          border-radius: 12px;
          flex-shrink: 0;
        }

        .feature-item h3 {
          margin: 0 0 4px 0;
          font-size: 18px;
          font-weight: 600;
        }

        .feature-item p {
          margin: 0;
          font-size: 14px;
          opacity: 0.9;
        }

        .brand-footer {
          position: absolute;
          bottom: 40px;
          left: 60px;
          right: 60px;
          text-align: center;
        }

        .brand-footer p {
          font-size: 13px;
          opacity: 0.7;
          margin: 0;
        }

        /* Right Login Panel */
        .login-form-panel {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          padding: 40px;
          position: relative;
          min-height: 100vh;
        }

        /* Add subtle pattern to right panel */
        .login-form-panel::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: 
            radial-gradient(circle at 20% 80%, rgba(99, 102, 241, 0.05) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(244, 114, 182, 0.05) 0%, transparent 50%);
          pointer-events: none;
        }

        /* Override embedded login styles for better desktop view */
        .login-form-panel :global(.supervisor-login) {
          background: transparent !important;
          padding: 0 !important;
          min-height: auto !important;
          width: 100% !important;
          max-width: 480px !important;
        }

        .login-form-panel :global(.login-card) {
          width: 100% !important;
          max-width: none !important;
          padding: 45px !important;
          box-shadow: 
            0 10px 25px rgba(0, 0, 0, 0.08),
            0 20px 48px rgba(0, 0, 0, 0.08),
            0 1px 4px rgba(0, 0, 0, 0.1) !important;
          border: 1px solid rgba(0, 0, 0, 0.05) !important;
        }

        .login-form-panel :global(.login-header) {
          margin-bottom: 30px !important;
        }

        .login-form-panel :global(.login-logo) {
          height: 60px !important;
        }

        .login-form-panel :global(.login-header h2) {
          font-size: 24px !important;
        }

        .login-form-panel :global(.login-subtitle) {
          font-size: 14px !important;
        }

        .login-form-panel :global(.form-group) {
          margin-bottom: 4px !important;
        }

        .login-form-panel :global(.form-control) {
          background: white !important;
          border-color: #cbd5e1 !important;
          font-size: 14px !important;
          height: 44px !important;
          padding: 10px 14px !important;
        }

        .login-form-panel :global(.form-control:hover) {
          border-color: #94a3b8 !important;
        }

        .login-form-panel :global(.btn-login) {
          height: 44px !important;
          font-size: 15px !important;
          margin-top: 8px !important;
        }

        .login-form-panel :global(.auth-status-badge) {
          display: none !important;
        }

        /* Mobile Responsive Design */
        @media (max-width: 1024px) {
          .login-split-container {
            flex-direction: column;
          }

          .login-brand-panel {
            flex: none;
            min-height: 300px;
            padding: 40px;
          }

          .brand-content h1 {
            font-size: 32px;
          }

          .brand-logo {
            height: 70px;
          }

          .feature-highlights {
            display: none;
          }

          .brand-footer {
            position: static;
            margin-top: 30px;
          }

          .login-form-panel {
            flex: 1;
            min-height: calc(100vh - 300px);
          }
        }

        @media (max-width: 640px) {
          .login-brand-panel {
            min-height: 200px;
            padding: 30px;
          }

          .brand-content h1 {
            font-size: 24px;
          }

          .brand-tagline {
            font-size: 14px;
            margin-bottom: 20px;
          }

          .brand-logo {
            height: 50px;
            margin-bottom: 20px;
          }

          .login-form-panel {
            padding: 20px;
          }

          .login-form-panel :global(.login-card) {
            padding: 30px !important;
          }
        }

        /* Animation for entrance */
        .login-brand-panel {
          animation: slideInLeft 0.6s ease-out;
        }

        .login-form-panel {
          animation: slideInRight 0.6s ease-out;
        }

        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        /* Pattern overlay for brand panel */
        .login-brand-panel {
          background-image: 
            linear-gradient(135deg, #003B5C 0%, #E4002B 100%),
            repeating-linear-gradient(
              45deg,
              transparent,
              transparent 35px,
              rgba(255,255,255,.01) 35px,
              rgba(255,255,255,.01) 70px
            );
        }
      `}</style>
    </div>
  );
};

export default LoginPage;