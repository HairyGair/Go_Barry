/*
 * Go Barry - Traffic Intelligence Platform
 * © 2024-2025 Anthony Gair. All rights reserved.
 * anthonygair@icloud.com
 */

// Go_BARRY/app/index.jsx
// Main home page with login functionality

import React from 'react';
import { SupervisorProvider } from '../components/hooks/useSupervisorSession';
import HomePageWithLogin from '../components/HomePageWithLogin';

const IndexApp = () => {
  return (
    <SupervisorProvider>
      <HomePageWithLogin />
    </SupervisorProvider>
  );
};

export default IndexApp;
