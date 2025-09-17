import React from 'react';

const PriorityAlerts = ({ breakdowns }) => {
  // Check if alert should be shown
  const criticalPriorityCount = breakdowns.filter(b => 
    b.isPriority && b.criticality === 'critical'
  ).length;

  const showAlert = criticalPriorityCount >= 2;

  if (!showAlert) return null;
  
  const affectedRoutes = [...new Set(
    breakdowns
      .filter(b => b.isPriority && b.criticality === 'critical')
      .map(b => b.route_id)
  )].join(', ');

  return (
    <div className="priority-alert-container">
      <div className="priority-alert active">
        <div className="alert-icon-pulse"></div>
        <div className="alert-icon">🚨</div>
        <div className="alert-content">
          <div className="alert-title">CRITICAL ALERT</div>
          <div className="alert-message">
            {criticalPriorityCount} breakdowns on priority routes ({affectedRoutes})
          </div>
          <div className="alert-action">Immediate attention required</div>
        </div>
      
      <style jsx>{`
        .priority-alert-container {
          margin: 0;
        }

        .priority-alert {
          background: 
            linear-gradient(135deg, #ef4444 0%, #dc2626 100%),
            radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 40%);
          color: white;
          padding: 20px 24px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          gap: 20px;
          margin-bottom: 16px;
          animation: slideDown 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
          position: relative;
          overflow: hidden;
          box-shadow: 
            0 8px 24px rgba(220, 38, 38, 0.35),
            0 2px 8px rgba(220, 38, 38, 0.2),
            inset 0 1px 0 rgba(255,255,255,0.2);
          border: 1px solid rgba(255, 255, 255, 0.15);
        }

        .priority-alert::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, 
            transparent,
            rgba(255,255,255,0.8),
            transparent
          );
          animation: shimmerAlert 2s infinite;
        }
        
        .priority-alert::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: rgba(0,0,0,0.2);
        }

        @keyframes shimmerAlert {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        .alert-icon {
          font-size: 36px;
          position: relative;
          z-index: 2;
          animation: shake 2s infinite;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
        }

        .alert-icon-pulse {
          position: absolute;
          left: 24px;
          top: 50%;
          transform: translateY(-50%);
          width: 48px;
          height: 48px;
          background: rgba(255,255,255,0.15);
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-2px); }
          75% { transform: translateX(2px); }
        }

        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          100% {
            transform: scale(2);
            opacity: 0;
          }
        }

        .alert-content {
          flex: 1;
        }

        .alert-title {
          font-size: 13px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          margin-bottom: 4px;
          opacity: 0.95;
          text-shadow: 0 1px 2px rgba(0,0,0,0.2);
        }

        .alert-message {
          font-size: 17px;
          font-weight: 700;
          margin-bottom: 2px;
          text-shadow: 0 1px 2px rgba(0,0,0,0.15);
        }

        .alert-action {
          font-size: 14px;
          opacity: 0.9;
          font-style: italic;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        
        .alert-action::before {
          content: '→';
          font-style: normal;
          font-weight: bold;
        }

        .priority-alert.active {
          display: flex;
        }

        @keyframes slideDown {
          from { 
            transform: translateY(-100%);
            opacity: 0;
          }
          to { 
            transform: translateY(0);
            opacity: 1;
          }
        }

        @media (max-width: 640px) {
          .priority-alert {
            padding: 15px;
            gap: 12px;
          }
          
          .alert-icon {
            font-size: 24px;
          }
          
          .alert-title {
            font-size: 12px;
          }
          
          .alert-message {
            font-size: 14px;
          }
          
          .alert-action {
            font-size: 12px;
          }
        }
      `}</style>
      </div>
    </div>
  );
};

export default PriorityAlerts;
