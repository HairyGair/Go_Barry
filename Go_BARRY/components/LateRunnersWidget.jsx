// Go_BARRY/components/LateRunnersWidget.jsx
// Display top late running buses from VIX data

import React from 'react';

const LateRunnersWidget = ({ lateRunners = [], limit = 5 }) => {
  // Sort by delay and take top N
  const topLateRunners = lateRunners
    .sort((a, b) => b.delayMinutes - a.delayMinutes)
    .slice(0, limit);

  if (!topLateRunners.length) {
    return (
      <div style={{
        backgroundColor: '#1a1a1a',
        borderRadius: '12px',
        padding: '20px',
        border: '2px solid #10b981',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '36px', marginBottom: '10px' }}>✅</div>
        <h3 style={{ fontSize: '28px', color: '#10b981', margin: 0 }}>
          All Buses On Time
        </h3>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: '#1a1a1a',
      borderRadius: '12px',
      padding: '20px',
      border: '2px solid #ff6b6b'
    }}>
      <h3 style={{
        fontSize: '32px',
        color: '#ff6b6b',
        marginBottom: '15px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <span>🚌</span>
        LATE RUNNERS
      </h3>
      
      {topLateRunners.map((bus, index) => (
        <div
          key={`${bus.fleetNo}-${index}`}
          style={{
            padding: '15px',
            marginBottom: '10px',
            backgroundColor: index === 0 ? '#3a1f1f' : '#222222',
            borderRadius: '8px',
            borderLeft: `4px solid ${
              bus.delayMinutes >= 20 ? '#ff0000' :
              bus.delayMinutes >= 10 ? '#ff6b6b' :
              '#ffa500'
            }`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: '28px',
              fontWeight: 'bold',
              color: '#ffffff',
              marginBottom: '5px'
            }}>
              Route {bus.service}
              <span style={{
                fontSize: '20px',
                color: '#999999',
                marginLeft: '15px'
              }}>
                Fleet {bus.fleetNo}
              </span>
            </div>
            <div style={{
              fontSize: '20px',
              color: '#cccccc'
            }}>
              📍 {bus.stop || 'Unknown location'}
            </div>
          </div>
          
          <div style={{
            fontSize: '36px',
            fontWeight: 'bold',
            color: bus.delayMinutes >= 20 ? '#ff0000' : 
                   bus.delayMinutes >= 10 ? '#ff6b6b' : 
                   '#ffa500',
            minWidth: '100px',
            textAlign: 'right'
          }}>
            {bus.delayMinutes}'
          </div>
        </div>
      ))}
      
      {lateRunners.length > limit && (
        <div style={{
          fontSize: '18px',
          color: '#999999',
          textAlign: 'center',
          marginTop: '15px',
          paddingTop: '15px',
          borderTop: '1px solid #333333'
        }}>
          +{lateRunners.length - limit} more buses running late
        </div>
      )}
    </div>
  );
};

export default LateRunnersWidget;