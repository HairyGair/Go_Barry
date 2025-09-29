/**
 * Test Launcher - Quick access button for development testing
 * Shows only in development mode and provides access to testing tools
 */

import React, { useState } from 'react';
import SDCTestingPanel from './SDCTestingPanel';

const TestLauncher = () => {
  const [showTestPanel, setShowTestPanel] = useState(false);
  
  // Only show in development mode
  const isDevelopment = import.meta.env.MODE === 'development' || 
                       window.location.hostname === 'localhost' ||
                       window.location.hostname === '127.0.0.1';

  if (!isDevelopment) {
    return null;
  }

  return (
    <>
      {/* Floating Test Button */}
      <button 
        className="test-launcher-btn"
        onClick={() => setShowTestPanel(true)}
        title="Open SDC Testing Panel"
      >
        🧪
      </button>

      {/* Testing Panel Modal */}
      {showTestPanel && (
        <SDCTestingPanel onClose={() => setShowTestPanel(false)} />
      )}

      <style jsx>{`
        .test-launcher-btn {
          position: fixed;
          bottom: 20px;
          left: 20px;
          width: 50px;
          height: 50px;
          background: linear-gradient(135deg, #8b5cf6, #7c3aed);
          border: none;
          border-radius: 50%;
          color: white;
          font-size: 24px;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
          transition: all 0.3s ease;
          z-index: 9998;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .test-launcher-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(139, 92, 246, 0.5);
          background: linear-gradient(135deg, #7c3aed, #6d28d9);
        }

        .test-launcher-btn:active {
          transform: translateY(0);
        }

        /* Pulse animation to draw attention */
        .test-launcher-btn::after {
          content: '';
          position: absolute;
          inset: -4px;
          border: 2px solid rgba(139, 92, 246, 0.4);
          border-radius: 50%;
          animation: testPulse 3s infinite;
        }

        @keyframes testPulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.3;
            transform: scale(1.2);
          }
        }

        /* Hide on very small screens to avoid overlap */
        @media (max-width: 480px) {
          .test-launcher-btn {
            bottom: 100px; /* Above mobile nav */
            width: 45px;
            height: 45px;
            font-size: 20px;
          }
        }
      `}</style>
    </>
  );
};

export default TestLauncher;