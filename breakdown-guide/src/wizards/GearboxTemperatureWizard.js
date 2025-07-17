import React from 'react';

const GearboxTemperatureWizard = ({ currentStep, responses, updateResponse, onNext, onPrevious, onComplete }) => {
    return (
        <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">🔧 GearboxTemperature Assessment</h2>
            <p className="text-gray-600 mb-6">Implementation pending</p>
            <button onClick={onComplete} className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                Complete (Placeholder)
            </button>
        </div>
    );
};

export default GearboxTemperatureWizard;
