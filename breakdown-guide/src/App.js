import React, { useState, useEffect } from 'react';
import './styles/index.css';

// Import screens
import HomeScreen from './components/HomeScreen';
import CategoryScreen from './components/CategoryScreen';
import WizardScreen from './components/WizardScreen';

// Import utilities
import { CATEGORIES } from './utils/categories';

const App = () => {
    const [currentScreen, setCurrentScreen] = useState('home');
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [sessionData, setSessionData] = useState({});

    useEffect(() => {
        const saved = localStorage.getItem('breakdown-guide-session');
        if (saved) {
            try {
                setSessionData(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to load session data');
            }
        }
        // Hide loading screen
        const loadingEl = document.getElementById('loading');
        if (loadingEl) {
            loadingEl.style.display = 'none';
        }
    }, []);

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
        saveSession({ lastCategory: category, timestamp: new Date().toISOString() });
    };

    const renderScreen = () => {
        switch (currentScreen) {
            case 'home':
                return (
                    <HomeScreen
                        onStartDiagnosis={() => setCurrentScreen('category')}
                        onCategorySelect={startDiagnosis}
                    />
                );
            
            case 'category':
                return (
                    <CategoryScreen
                        categories={CATEGORIES}
                        onBack={goHome}
                        onCategorySelect={startDiagnosis}
                    />
                );
            
            case 'wizard':
                return (
                    <WizardScreen
                        category={selectedCategory}
                        onExit={() => setCurrentScreen('category')}
                        sessionData={sessionData}
                        saveSession={saveSession}
                    />
                );
            
            default:
                return <HomeScreen onStartDiagnosis={() => setCurrentScreen('category')} />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {renderScreen()}
        </div>
    );
};

export default App;