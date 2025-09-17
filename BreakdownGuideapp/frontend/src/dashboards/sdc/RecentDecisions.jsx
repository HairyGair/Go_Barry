import React from 'react';

const RecentDecisions = ({ decisions = [] }) => {
  // Get decision type class
  const getDecisionClass = (decision) => {
    const type = decision.toUpperCase();
    if (type === 'STOP' || type === 'RED') return 'stop';
    if (type === 'AMBER') return 'amber';
    if (type === 'CONTINUE' || type === 'GREEN') return 'continue';
    return 'continue';
  };

  return (
    <div className="recent-decisions">
      <h3>Recent Decisions</h3>
      
      {decisions.length === 0 ? (
        <div className="no-decisions">No recent decisions</div>
      ) : (
        <div className="decisions-list">
          {decisions.map((decision, index) => (
            <div key={index} className={`decision-item ${getDecisionClass(decision.decision)}`}>
              <span className="decision-time">{decision.time}</span>
              <span className="decision-fleet">Fleet {decision.fleet}</span>
              <span className={`decision-type ${getDecisionClass(decision.decision)}`}>
                {decision.decision}
              </span>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .recent-decisions {
          background: 
            linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.95) 100%),
            radial-gradient(circle at 80% 80%, rgba(219, 39, 119, 0.02) 0%, transparent 50%);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.9);
          border-radius: 20px;
          padding: 28px;
          box-shadow: 
            0 10px 40px rgba(0,0,0,0.06),
            0 2px 10px rgba(0,0,0,0.04),
            inset 0 2px 0 rgba(255,255,255,0.7);
        }

        .recent-decisions h3 {
          font-size: 18px;
          color: #0f172a;
          margin: 0 0 20px 0;
          font-weight: 800;
          display: flex;
          align-items: center;
          gap: 8px;
          letter-spacing: -0.02em;
        }
        
        .recent-decisions h3::before {
          content: '📜';
          font-size: 20px;
          filter: brightness(1.2);
        }

        .no-decisions {
          color: #6b7280;
          font-size: 13px;
          text-align: center;
          padding: 20px 0;
          font-style: italic;
        }

        .decisions-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .decision-item {
          padding: 16px 18px;
          background: 
            linear-gradient(135deg, rgba(248,250,252,0.9) 0%, rgba(241,245,249,0.9) 100%),
            radial-gradient(circle at 100% 50%, rgba(59, 130, 246, 0.02) 0%, transparent 50%);
          border: 1px solid rgba(226,232,240,0.3);
          border-radius: 14px;
          font-size: 13px;
          display: flex;
          align-items: center;
          gap: 14px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0,0,0,0.03);
        }
        
        .decision-item::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 3px;
          background: #e5e7eb;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .decision-item.stop::before {
          background: #dc2626;
        }
        
        .decision-item.amber::before {
          background: #f59e0b;
        }
        
        .decision-item.continue::before {
          background: #10b981;
        }
        
        .decision-item:hover::before {
          width: 5px;
        }

        .decision-item:hover {
          transform: translateX(6px);
          box-shadow: 
            0 4px 12px rgba(0,0,0,0.08),
            0 1px 4px rgba(0,0,0,0.04);
          border-color: rgba(209,213,219,0.5);
          background: 
            linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%),
            radial-gradient(circle at 100% 50%, rgba(59, 130, 246, 0.03) 0%, transparent 50%);
        }

        .decision-time {
          font-weight: 700;
          color: #475569;
          min-width: 45px;
          font-size: 14px;
          font-variant-numeric: tabular-nums;
        }

        .decision-fleet {
          flex: 1;
          color: #1e40af;
          font-weight: 600;
          font-size: 14px;
        }

        .decision-type {
          display: inline-flex;
          align-items: center;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }

        .decision-type.stop {
          background: linear-gradient(135deg, #fee2e2, #fecaca);
          color: #dc2626;
          border: 1px solid rgba(220, 38, 38, 0.2);
        }

        .decision-type.amber {
          background: linear-gradient(135deg, #fef3c7, #fde68a);
          color: #d97706;
          border: 1px solid rgba(217, 119, 6, 0.2);
        }

        .decision-type.continue {
          background: linear-gradient(135deg, #dcfce7, #bbf7d0);
          color: #16a34a;
          border: 1px solid rgba(22, 163, 74, 0.2);
        }

        @media (max-width: 640px) {
          .recent-decisions {
            padding: 15px;
          }

          .decision-item {
            font-size: 12px;
            padding: 8px;
          }
        }
      `}</style>
    </div>
  );
};

export default RecentDecisions;
