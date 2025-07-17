import React, { useState, useEffect } from 'react';
import { AlertTriangle, Phone, FileText, ArrowLeft, ArrowRight, Home, CheckCircle, XCircle, Clock } from 'lucide-react';

// Go North East Brand Colors
const colors = {
  navy: '#1a2b5a',
  red: '#dc2626',
  white: '#ffffff',
  lightGray: '#f8f9fa',
  darkGray: '#6b7280'
};

// Main App Component
const BreakdownGuideApp = () => {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [sessionData, setSessionData] = useState({});

  // Load session data from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('breakdown-guide-session');
    if (saved) {
      try {
        setSessionData(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load session data');
      }
    }
  }, []);

  // Save session data to localStorage
  const saveSession = (data) => {
    const newData = { ...sessionData, ...data };
    setSessionData(newData);
    localStorage.setItem('breakdown-guide-session', JSON.stringify(newData));
  };

  const goHome = () => {
    setCurrentScreen('home');
    setSelectedCategory(null);
  };

  const startDiagnosis = (category) => {
    setSelectedCategory(category);
    setCurrentScreen('wizard');
    saveSession({ 
      currentCategory: category,
      startTime: new Date().toISOString(),
      sessionId: Date.now()
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b-4 border-red-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="text-2xl font-bold">
                <span style={{ color: colors.navy }}>Go</span>
                <span style={{ color: colors.red }}>NorthEast</span>
              </div>
              <div className="ml-4 text-sm text-gray-600">
                Part of <span className="font-semibold" style={{ color: colors.navy }}>GoAhead</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {currentScreen !== 'home' && (
                <button
                  onClick={goHome}
                  className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  <Home className="w-4 h-4 mr-1" />
                  Home
                </button>
              )}
              <div className="text-sm text-gray-500">
                SDC Engineering Guide v1.3
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentScreen === 'home' && (
          <HomePage onStartDiagnosis={startDiagnosis} />
        )}
        {currentScreen === 'wizard' && selectedCategory && (
          <WizardContainer 
            category={selectedCategory} 
            onExit={goHome}
            sessionData={sessionData}
            saveSession={saveSession}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center text-sm text-gray-500">
            <div>
              © 2025 Go North East. Safety is non-negotiable.
            </div>
            <div className="flex items-center space-x-4">
              <span>Emergency: 0800 123 456</span>
              <span>Engineering: 0800 789 012</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default BreakdownGuideApp;