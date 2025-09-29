/**
 * SDCQuickActionsPanel Component
 * Contextual quick actions for Control Room operators
 * Clean, efficient design with no unnecessary animations
 */

import React, { useState } from 'react';

const SDCQuickActionsPanel = ({ 
  breakdown,
  onAction,
  position = 'inline' // 'inline', 'floating', 'sidebar'
}) => {
  const [activeAction, setActiveAction] = useState(null);

  const quickActions = [
    {
      id: 'acknowledge_all',
      label: 'Acknowledge All',
      icon: '👁️',
      description: 'Acknowledge all pending breakdowns',
      condition: () => true,
      action: 'acknowledge_all'
    },
    {
      id: 'request_engineer',
      label: 'Request Engineer',
      icon: '🔧',
      description: 'Request engineering for critical breakdowns',
      condition: (b) => b?.decision === 'STOP' && !b?.engineer_assigned,
      action: 'request_engineer'
    },
    {
      id: 'changeover',
      label: 'Arrange Changeover',
      icon: '🔄',
      description: 'Mark vehicle for changeover',
      condition: (b) => b?.decision === 'AMBER' || b?.decision === 'CHANGEOVER',
      action: 'changeover'
    },
    {
      id: 'escalate',
      label: 'Escalate',
      icon: '📢',
      description: 'Escalate to management',
      condition: (b) => b?.isCritical || b?.elapsed > 30,
      action: 'escalate'
    },
    {
      id: 'add_note',
      label: 'Add Note',
      icon: '📝',
      description: 'Add update note to breakdown',
      condition: () => true,
      action: 'add_note'
    },
    {
      id: 'view_history',
      label: 'View History',
      icon: '📜',
      description: 'View audit trail',
      condition: () => true,
      action: 'view_history'
    }
  ];

  const availableActions = quickActions.filter(action => 
    action.condition(breakdown)
  );

  const handleAction = (action) => {
    setActiveAction(action.id);
    onAction(action.action, breakdown?.breakdown_id, action);
    
    // Reset active state after action
    setTimeout(() => setActiveAction(null), 1000);
  };

  if (position === 'floating') {
    return (
      <div className="quick-actions-floating">
        <div className="floating-header">
          <span className="header-icon">⚡</span>
          <span className="header-text">Quick Actions</span>
        </div>
        <div className="floating-actions">
          {availableActions.map(action => (
            <button
              key={action.id}
              className={`floating-action ${activeAction === action.id ? 'active' : ''}`}
              onClick={() => handleAction(action)}
              title={action.description}
            >
              <span className="action-icon">{action.icon}</span>
              <span className="action-label">{action.label}</span>
            </button>
          ))}
        </div>

        <style jsx>{`
          .quick-actions-floating {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
            padding: 16px;
            z-index: 100;
            min-width: 200px;
          }

          .floating-header {
            display: flex;
            align-items: center;
            gap: 8px;
            padding-bottom: 12px;
            border-bottom: 1px solid #e5e7eb;
            margin-bottom: 12px;
          }

          .header-icon {
            font-size: 16px;
          }

          .header-text {
            font-size: 14px;
            font-weight: 600;
            color: #374151;
          }

          .floating-actions {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }

          .floating-action {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 12px;
            background: transparent;
            border: none;
            border-radius: 8px;
            font-size: 13px;
            color: #374151;
            cursor: pointer;
            transition: background-color 0.2s ease;
            text-align: left;
          }

          .floating-action:hover {
            background: #f3f4f6;
          }

          .floating-action.active {
            background: #eff6ff;
            color: #3b82f6;
          }

          .action-icon {
            font-size: 16px;
            width: 20px;
            text-align: center;
          }

          .action-label {
            flex: 1;
          }
        `}</style>
      </div>
    );
  }

  // Default inline view
  return (
    <div className="quick-actions-inline">
      {availableActions.map(action => (
        <button
          key={action.id}
          className={`quick-action-btn ${activeAction === action.id ? 'active' : ''}`}
          onClick={() => handleAction(action)}
          title={action.description}
        >
          <span className="btn-icon">{action.icon}</span>
          <span className="btn-label">{action.label}</span>
        </button>
      ))}

      <style jsx>{`
        .quick-actions-inline {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          padding: 12px 0;
        }

        .quick-action-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: #f3f4f6;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          color: #374151;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .quick-action-btn:hover {
          background: #e5e7eb;
          border-color: #d1d5db;
        }

        .quick-action-btn.active {
          background: #3b82f6;
          border-color: #3b82f6;
          color: white;
        }

        .btn-icon {
          font-size: 14px;
        }

        .btn-label {
          white-space: nowrap;
        }

        @media (max-width: 768px) {
          .quick-actions-inline {
            flex-direction: column;
          }

          .quick-action-btn {
            width: 100%;
            justify-content: center;
            padding: 10px 12px;
          }
        }
      `}</style>
    </div>
  );
};

export default SDCQuickActionsPanel;