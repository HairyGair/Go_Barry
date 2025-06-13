# WebSocket Debug Instructions

To add the WebSocket debug panel to your screens for troubleshooting:

## 1. In DisplayScreen.jsx

Add the import at the top:
```jsx
import WebSocketDebugPanel from './WebSocketDebugPanel';
```

Add before the closing `</View>` tag:
```jsx
{/* WebSocket Debug Panel - Remove after testing */}
<WebSocketDebugPanel
  connectionState={connectionState}
  isConnected={wsConnected}
  lastError={lastError}
  connectionStats={connectionStats}
  activeSupervisors={activeSupervisors}
  connectedSupervisors={connectedSupervisors}
  clientType="display"
/>
```

## 2. In SupervisorControl.jsx

Add the import at the top:
```jsx
import WebSocketDebugPanel from './WebSocketDebugPanel';
```

Add before the closing `</View>` tag:
```jsx
{/* WebSocket Debug Panel - Remove after testing */}
<WebSocketDebugPanel
  connectionState={connectionState}
  isConnected={isConnected}
  lastError={lastError}
  connectionStats={connectionStats}
  activeSupervisors={activeSupervisors}
  connectedSupervisors={connectedSupervisors}
  clientType="supervisor"
  supervisorId={supervisorId}
/>
```

The debug panel will appear as a small indicator in the bottom right corner. Click to expand and see connection details.
