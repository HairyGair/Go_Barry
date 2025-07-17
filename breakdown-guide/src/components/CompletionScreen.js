import React from 'react';
import { CheckCircle, Printer, Home } from 'lucide-react';

const CompletionScreen = ({ category, responses, onExit }) => {
    const getDecision = () => {
        if (!category) return 'Assessment completed';
        
        switch (category.id) {
            case 'loose-wheel-nuts':
                return 'STOP IMMEDIATELY - Critical loose wheel nuts identified. Do not move vehicle. Contact Engineering Manager and Managing Director IMMEDIATELY.';
            
            case 'oil-warning-light':
                return responses.oil_leak === 'yes' ? 
                    'STOP - Oil leak confirmed. Switch off engine immediately. Fire risk.' :
                    'STOP - Oil warning light on. Do not continue. Contact Engineering.';
            
            case 'abs-light':
                return responses.light_status === 'red_off' || responses.light_status === 'amber_off' ?
                    'CONTINUE - ABS light cleared after reset' :
                    'STOP - ABS fault persistent. Contact Engineering.';
            
            case 'brakes':
                return 'STOP - Critical brake defect identified. Do not continue.';
            
            case 'steering':
                return 'STOP - Steering defect. Vehicle unsafe to drive.';
            
            case 'overheating':
                return responses.temperature > 105 ?
                    'STOP - Critical temperature. Allow cooling before proceeding.' :
                    'CONTINUE - Temperature within safe limits. Monitor closely.';
            
            case 'road-traffic-incidents':
                return responses.driver_fit === 'no' ?
                    'REPLACEMENT DRIVER REQUIRED - Current driver unfit to continue' :
                    'CONTINUE - Driver assessed as fit. Document all details.';
            
            case 'interior-lights':
                const fiftyPercentMet = responses.fifty_percent_rule === 'yes';
                const stepLightOk = responses.step_light_function === 'yes';
                
                if (responses.operating_conditions === 'hours_of_darkness') {
                    if (!fiftyPercentMet || !stepLightOk) {
                        return 'CHANGEOVER REQUIRED - Critical lighting failure during darkness';
                    }
                }
                return fiftyPercentMet && stepLightOk ?
                    'CONTINUE - Lighting meets minimum requirements' :
                    'CHANGEOVER WHEN POSSIBLE - Lighting below standard';
            
            default:
                return 'Assessment complete - Follow engineering guidance';
        }
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white shadow-sm border-b no-print">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <div className="flex items-center">
                                <span className="text-2xl font-bold text-blue-900">Go</span>
                                <span className="text-2xl font-bold text-red-600">NorthEast</span>
                            </div>
                            <span className="ml-4 text-gray-500">Assessment Complete</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white rounded-lg shadow-sm p-8">
                    <div className="text-center mb-8">
                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Assessment Complete</h1>
                        <p className="text-gray-600">
                            {new Date().toLocaleString('en-GB', {
                                dateStyle: 'full',
                                timeStyle: 'short'
                            })}
                        </p>
                    </div>

                    <div className="border-t pt-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Assessment Summary</h2>
                        
                        <div className="space-y-3 mb-6">
                            {responses.driver_name && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Driver:</span>
                                    <span className="font-medium">{responses.driver_name}</span>
                                </div>
                            )}
                            {responses.vehicle_number && (
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Vehicle:</span>
                                    <span className="font-medium">{responses.vehicle_number}</span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span className="text-gray-600">Category:</span>
                                <span className="font-medium">{category?.name || 'Unknown'}</span>
                            </div>
                        </div>

                        <div className={`p-4 rounded-lg mb-6 ${
                            getDecision().includes('STOP') || getDecision().includes('REPLACEMENT') ?
                                'bg-red-50 border border-red-200' :
                            getDecision().includes('CHANGEOVER') ?
                                'bg-yellow-50 border border-yellow-200' :
                                'bg-green-50 border border-green-200'
                        }`}>
                            <h3 className="font-semibold mb-2">Decision:</h3>
                            <p className={`font-medium ${
                                getDecision().includes('STOP') || getDecision().includes('REPLACEMENT') ?
                                    'text-red-800' :
                                getDecision().includes('CHANGEOVER') ?
                                    'text-yellow-800' :
                                    'text-green-800'
                            }`}>
                                {getDecision()}
                            </p>
                        </div>

                        {responses.notes && (
                            <div className="mb-6">
                                <h3 className="font-semibold mb-2">Additional Notes:</h3>
                                <p className="text-gray-600 whitespace-pre-wrap">{responses.notes}</p>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-4 no-print">
                        <button
                            onClick={handlePrint}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            <Printer className="w-4 h-4" />
                            Print Summary
                        </button>
                        <button
                            onClick={onExit}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <Home className="w-4 h-4" />
                            New Assessment
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CompletionScreen;