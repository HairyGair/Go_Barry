// Go_BARRY/app/display.jsx
// Web-compatible Display Route

import React from 'react';
import DisplayScreen from '../components/DisplayScreen';

export default function Display() {
  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      margin: 0,
      padding: 0
    }}>
      <DisplayScreen />
    </div>
  );
}
