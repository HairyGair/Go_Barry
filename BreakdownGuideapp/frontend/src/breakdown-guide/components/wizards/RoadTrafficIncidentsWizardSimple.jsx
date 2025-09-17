import React from 'react';

// Simplified version to test button functionality
const RoadTrafficIncidentsWizardSimple = ({ currentStep, responses = {}, updateResponse, onNext }) => {
    console.log('RoadTrafficIncidentsWizardSimple rendered with:', {
        currentStep,
        responses,
        updateResponseType: typeof updateResponse
    });
    
    const handleButtonClick = (value) => {
        console.log('Button clicked with value:', value);
        if (updateResponse) {
            updateResponse('test_field', value);
        } else {
            console.error('updateResponse function is not defined!');
        }
    };
    
    if (currentStep === 2) {
        return (
            <div className="space-y-6 p-6">
                <h2 className="text-2xl font-bold text-white mb-4">Simple Button Test - Step 2</h2>
                
                <div className="bg-white/10 p-4 rounded">
                    <p className="text-white mb-4">Testing basic button functionality:</p>
                    
                    {/* Test with regular HTML button */}
                    <div className="mb-4">
                        <h3 className="text-yellow-300 mb-2">HTML Button Test:</h3>
                        <button
                            type="button"
                            onClick={() => {
                                console.log('HTML button clicked');
                                alert('HTML button works!');
                            }}
                            style={{ 
                                padding: '10px 20px', 
                                backgroundColor: '#3B82F6', 
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            HTML Button
                        </button>
                    </div>
                    
                    {/* Test with React button */}
                    <div className="mb-4">
                        <h3 className="text-yellow-300 mb-2">React Button Test:</h3>
                        <button
                            type="button"
                            onClick={() => handleButtonClick('test-value')}
                            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-500 cursor-pointer"
                        >
                            React Button (Check Console)
                        </button>
                    </div>
                    
                    {/* Test with depot selection style buttons */}
                    <div className="mb-4">
                        <h3 className="text-yellow-300 mb-2">Depot Style Buttons:</h3>
                        <div className="grid grid-cols-2 gap-3">
                            {['Gateshead', 'Consett', 'Washington', 'Percy Main'].map((depot) => (
                                <button
                                    key={depot}
                                    type="button"
                                    onClick={() => {
                                        console.log(`Depot clicked: ${depot}`);
                                        if (updateResponse) {
                                            updateResponse('garage_depot', depot);
                                        }
                                    }}
                                    className={`p-3 rounded-lg border-2 transition-all text-left cursor-pointer ${
                                        responses.garage_depot === depot
                                            ? 'border-blue-400 bg-blue-400/20 text-blue-200'
                                            : 'border-white/30 bg-white/10 text-white hover:border-blue-400/50'
                                    }`}
                                >
                                    <span className="font-medium">{depot}</span>
                                </button>
                            ))}
                        </div>
                        <p className="text-white mt-2">Selected: {responses.garage_depot || 'None'}</p>
                    </div>
                </div>
                
                <button
                    type="button"
                    onClick={() => {
                        console.log('Next button clicked');
                        if (onNext) onNext();
                    }}
                    className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-500"
                >
                    Next Step
                </button>
            </div>
        );
    }
    
    // Step 1
    return (
        <div className="space-y-6 p-6">
            <h2 className="text-2xl font-bold text-white mb-4">Step 1</h2>
            <p className="text-white">This is step 1. Click Next to test buttons on step 2.</p>
            <button
                type="button"
                onClick={() => {
                    console.log('Step 1 Next clicked');
                    if (onNext) onNext();
                }}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500"
            >
                Go to Step 2
            </button>
        </div>
    );
};

export default RoadTrafficIncidentsWizardSimple;
