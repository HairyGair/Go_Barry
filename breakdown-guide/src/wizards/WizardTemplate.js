// This is a template for creating new wizard components
// Copy this file and replace "TemplateWizard" with your wizard name

import React from 'react';
import { AlertTriangle, ArrowRight } from 'lucide-react';

const TemplateWizard = ({ currentStep, responses, updateResponse, onNext, onPrevious, onComplete }) => {
    switch (currentStep) {
        case 1:
            return (
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="mb-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">🔧 [Wizard Title]</h2>
                        <p className="text-gray-600">[Description of what this wizard does]</p>
                    </div>
                    
                    {/* Add your first step content here */}
                    
                    <div className="flex justify-end mt-6">
                        <button
                            onClick={onNext}
                            className="flex items-center px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            Continue <ArrowRight className="w-4 h-4 ml-1" />
                        </button>
                    </div>
                </div>
            );

        case 2:
            return (
                <div className="bg-white rounded-lg shadow-sm p-6">
                    {/* Add your second step content here */}
                    
                    <div className="flex justify-between mt-6">
                        <button
                            onClick={onPrevious}
                            className="px-6 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
                        >
                            Previous
                        </button>
                        <button
                            onClick={onComplete}
                            className="flex items-center px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                        >
                            Complete Assessment
                        </button>
                    </div>
                </div>
            );

        default:
            return null;
    }
};

export default TemplateWizard;