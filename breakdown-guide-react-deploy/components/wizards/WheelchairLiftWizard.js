// Wheelchair Lift Wizard Component
// Uses icons and constants from common components

const WheelchairLiftWizard = ({ currentStep, responses, updateResponse, onNext, onPrevious, onComplete }) => {
    // Get icons from global scope
    const { AlertTriangle, ArrowLeft, ArrowRight, Home, CheckCircle, XCircle, FileText } = window.Icons;
    
    switch (currentStep) {
        case 1:
            return (
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="mb-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">♿ Wheelchair Lift Assessment</h2>
                        <p className="text-gray-600">Following SDC guidance for wheelchair accessibility systems - ensuring safe operation and compliance with disability access requirements.</p>
                    </div>
                    
                    <div className="bg-blue-50 border-l-4 border-blue-600 p-6 mb-6">
                        <div className="flex items-start">
                            <AlertTriangle className="w-6 h-6 text-blue-600 mt-1 mr-3" />
                            <div>
                                <h3 className="text-lg font-semibold text-blue-800 mb-2">♿ Accessibility Legal Requirement</h3>
                                <p className="text-blue-700">Wheelchair lift systems are legally required for accessibility compliance. A defective lift system may prevent wheelchair users from boarding, requiring immediate attention.</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <h3 className="font-semibold text-green-900 mb-3">Vehicle Type & Lift Configuration</h3>
                            <p className="text-green-700 text-sm mb-4">First, identify the vehicle type and lift system configuration.</p>
                            <div className="space-y-3">
                                <label className="flex items-start p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="vehicle_type"
                                        checked={responses.vehicle_type === 'single_deck_manual'}
                                        onChange={() => updateResponse('vehicle_type', 'single_deck_manual')}
                                        className="mt-1 mr-3 h-4 w-4 text-green-600 border-gray-300 focus:ring-green-500"
                                    />
                                    <div>
                                        <span className="font-medium text-green-600">🚌 Single deck - Manual lift</span>
                                        <p className="text-sm text-gray-600 mt-1">Manually operated wheelchair lift system</p>
                                    </div>
                                </label>
                                <label className="flex items-start p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="vehicle_type"
                                        checked={responses.vehicle_type === 'single_deck_electric'}
                                        onChange={() => updateResponse('vehicle_type', 'single_deck_electric')}
                                        className="mt-1 mr-3 h-4 w-4 text-green-600 border-gray-300 focus:ring-green-500"
                                    />
                                    <div>
                                        <span className="font-medium text-green-600">🚌 Single deck - Electric lift</span>
                                        <p className="text-sm text-gray-600 mt-1">Electrically operated wheelchair lift system</p>
                                    </div>
                                </label>
                                <label className="flex items-start p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="vehicle_type"
                                        checked={responses.vehicle_type === 'low_floor_ramp'}
                                        onChange={() => updateResponse('vehicle_type', 'low_floor_ramp')}
                                        className="mt-1 mr-3 h-4 w-4 text-green-600 border-gray-300 focus:ring-green-500"
                                    />
                                    <div>
                                        <span className="font-medium text-green-600">🚍 Low floor - Ramp system</span>
                                        <p className="text-sm text-gray-600 mt-1">Low floor vehicle with deployable ramp</p>
                                    </div>
                                </label>
                                <label className="flex items-start p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="vehicle_type"
                                        checked={responses.vehicle_type === 'no_lift_fitted'}
                                        onChange={() => updateResponse('vehicle_type', 'no_lift_fitted')}
                                        className="mt-1 mr-3 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                    />
                                    <div>
                                        <span className="font-medium text-blue-600">ℹ️ No wheelchair lift fitted</span>
                                        <p className="text-sm text-gray-600 mt-1">Vehicle not equipped with accessibility system</p>
                                    </div>
                                </label>
                            </div>
                        </div>
                        
                        {responses.vehicle_type && responses.vehicle_type !== 'no_lift_fitted' && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <h3 className="font-semibold text-yellow-900 mb-3">Current Service Context</h3>
                                <p className="text-yellow-700 text-sm mb-4">What is the current operational context?</p>
                                <div className="space-y-3">
                                    <label className="flex items-start p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="service_context"
                                            checked={responses.service_context === 'normal_service'}
                                            onChange={() => updateResponse('service_context', 'normal_service')}
                                            className="mt-1 mr-3 h-4 w-4 text-yellow-600 border-gray-300 focus:ring-yellow-500"
                                        />
                                        <div>
                                            <span className="font-medium text-yellow-600">🚌 Normal passenger service</span>
                                            <p className="text-sm text-gray-600 mt-1">Currently operating regular passenger service</p>
                                        </div>
                                    </label>
                                    <label className="flex items-start p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="service_context"
                                            checked={responses.service_context === 'wheelchair_user_present'}
                                            onChange={() => updateResponse('service_context', 'wheelchair_user_present')}
                                            className="mt-1 mr-3 h-4 w-4 text-red-600 border-gray-300 focus:ring-red-500"
                                        />
                                        <div>
                                            <span className="font-medium text-red-600">♿ Wheelchair user present/waiting</span>
                                            <p className="text-sm text-gray-600 mt-1">Immediate accessibility requirement</p>
                                        </div>
                                    </label>
                                    <label className="flex items-start p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="service_context"
                                            checked={responses.service_context === 'routine_check'}
                                            onChange={() => updateResponse('service_context', 'routine_check')}
                                            className="mt-1 mr-3 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                        />
                                        <div>
                                            <span className="font-medium text-blue-600">🔍 Routine functionality check</span>
                                            <p className="text-sm text-gray-600 mt-1">Preventive maintenance assessment</p>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        )}
                        
                        {responses.service_context === 'wheelchair_user_present' && (
                            <div className="border-2 border-red-500 bg-red-50 rounded-lg p-6">
                                <div className="flex items-start">
                                    <AlertTriangle className="w-8 h-8 text-red-600 mt-1 mr-4" />
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold text-red-800 mb-3">♿ URGENT - WHEELCHAIR USER WAITING</h3>
                                        <div className="text-red-700 space-y-2">
                                            <p className="font-semibold">Immediate accessibility requirement - legal duty to provide access</p>
                                            <div className="bg-white rounded p-4 mt-4">
                                                <h4 className="font-semibold text-red-800 mb-2">Priority Actions:</h4>
                                                <ul className="list-disc list-inside space-y-1 text-red-700">
                                                    <li>Must provide accessibility or arrange immediate alternative</li>
                                                    <li>Cannot refuse wheelchair user due to lift defect</li>
                                                    <li>Legal obligation under Equality Act</li>
                                                    <li>Contact engineering immediately if lift not functional</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {responses.vehicle_type === 'no_lift_fitted' && (
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                                <div className="flex items-start">
                                    <AlertTriangle className="w-6 h-6 text-gray-600 mt-1 mr-3" />
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-800 mb-2">ℹ️ No Accessibility System</h3>
                                        <p className="text-gray-700">This vehicle is not equipped with wheelchair accessibility systems. Assessment not applicable.</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mt-8 flex justify-between">
                        <div></div>
                        <button
                            onClick={responses.vehicle_type === 'no_lift_fitted' ? onComplete : onNext}
                            disabled={!responses.vehicle_type || (responses.vehicle_type !== 'no_lift_fitted' && !responses.service_context)}
                            className="flex items-center px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                            {responses.vehicle_type === 'no_lift_fitted' ? 'Complete Assessment' : 'Continue to Lift Test'}
                            <ArrowRight className="w-4 h-4 ml-1" />
                        </button>
                    </div>
                </div>
            );

        case 2:
            return (
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="mb-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">🔧 Lift Operation Test</h2>
                        <p className="text-gray-600">Test the wheelchair lift system operation through its full cycle.</p>
                    </div>
                    
                    <div className="bg-orange-50 border-l-4 border-orange-600 p-6 mb-6">
                        <div className="flex items-start">
                            <AlertTriangle className="w-6 h-6 text-orange-600 mt-1 mr-3" />
                            <div>
                                <h3 className="text-lg font-semibold text-orange-800 mb-2">⚠️ Safety During Testing</h3>
                                <p className="text-orange-700">Ensure area is clear of passengers and obstacles before testing. Follow safe operating procedures.</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h3 className="font-semibold text-blue-900 mb-3">Lift Deployment Test</h3>
                            <p className="text-blue-700 text-sm mb-4">Test deploying the lift from stowed position.</p>
                            <div className="space-y-3">
                                <label className="flex items-start p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="deployment_test"
                                        checked={responses.deployment_test === 'deploys_normally'}
                                        onChange={() => updateResponse('deployment_test', 'deploys_normally')}
                                        className="mt-1 mr-3 h-4 w-4 text-green-600 border-gray-300 focus:ring-green-500"
                                    />
                                    <div>
                                        <span className="font-medium text-green-600">✅ Deploys normally</span>
                                        <p className="text-sm text-gray-600 mt-1">Lift deploys smoothly from stowed position</p>
                                    </div>
                                </label>
                                <label className="flex items-start p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="deployment_test"
                                        checked={responses.deployment_test === 'deploys_slowly'}
                                        onChange={() => updateResponse('deployment_test', 'deploys_slowly')}
                                        className="mt-1 mr-3 h-4 w-4 text-yellow-600 border-gray-300 focus:ring-yellow-500"
                                    />
                                    <div>
                                        <span className="font-medium text-yellow-600">⚠️ Deploys slowly/hesitantly</span>
                                        <p className="text-sm text-gray-600 mt-1">Operation sluggish but functional</p>
                                    </div>
                                </label>
                                <label className="flex items-start p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="deployment_test"
                                        checked={responses.deployment_test === 'will_not_deploy'}
                                        onChange={() => updateResponse('deployment_test', 'will_not_deploy')}
                                        className="mt-1 mr-3 h-4 w-4 text-red-600 border-gray-300 focus:ring-red-500"
                                    />
                                    <div>
                                        <span className="font-medium text-red-600">❌ Will not deploy</span>
                                        <p className="text-sm text-gray-600 mt-1">Lift stuck in stowed position</p>
                                    </div>
                                </label>
                                <label className="flex items-start p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="deployment_test"
                                        checked={responses.deployment_test === 'deploys_partially'}
                                        onChange={() => updateResponse('deployment_test', 'deploys_partially')}
                                        className="mt-1 mr-3 h-4 w-4 text-orange-600 border-gray-300 focus:ring-orange-500"
                                    />
                                    <div>
                                        <span className="font-medium text-orange-600">🔧 Deploys partially only</span>
                                        <p className="text-sm text-gray-600 mt-1">Incomplete deployment - may jam</p>
                                    </div>
                                </label>
                            </div>
                        </div>
                        
                        {(responses.deployment_test === 'deploys_normally' || responses.deployment_test === 'deploys_slowly' || responses.deployment_test === 'deploys_partially') && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <h3 className="font-semibold text-green-900 mb-3">Lift Movement Test</h3>
                                <p className="text-green-700 text-sm mb-4">Test the lift raising and lowering operation.</p>
                                <div className="space-y-3">
                                    <label className="flex items-start p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="movement_test"
                                            checked={responses.movement_test === 'raises_lowers_normally'}
                                            onChange={() => updateResponse('movement_test', 'raises_lowers_normally')}
                                            className="mt-1 mr-3 h-4 w-4 text-green-600 border-gray-300 focus:ring-green-500"
                                        />
                                        <div>
                                            <span className="font-medium text-green-600">✅ Raises and lowers normally</span>
                                            <p className="text-sm text-gray-600 mt-1">Smooth up and down movement</p>
                                        </div>
                                    </label>
                                    <label className="flex items-start p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="movement_test"
                                            checked={responses.movement_test === 'jerky_movement'}
                                            onChange={() => updateResponse('movement_test', 'jerky_movement')}
                                            className="mt-1 mr-3 h-4 w-4 text-yellow-600 border-gray-300 focus:ring-yellow-500"
                                        />
                                        <div>
                                            <span className="font-medium text-yellow-600">⚠️ Jerky or uneven movement</span>
                                            <p className="text-sm text-gray-600 mt-1">Operational but not smooth</p>
                                        </div>
                                    </label>
                                    <label className="flex items-start p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="movement_test"
                                            checked={responses.movement_test === 'movement_failure'}
                                            onChange={() => updateResponse('movement_test', 'movement_failure')}
                                            className="mt-1 mr-3 h-4 w-4 text-red-600 border-gray-300 focus:ring-red-500"
                                        />
                                        <div>
                                            <span className="font-medium text-red-600">❌ Cannot raise/lower properly</span>
                                            <p className="text-sm text-gray-600 mt-1">Movement mechanism failure</p>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        )}
                        
                        {(responses.deployment_test === 'deploys_normally' || responses.deployment_test === 'deploys_slowly') && 
                         (responses.movement_test === 'raises_lowers_normally' || responses.movement_test === 'jerky_movement') && (
                            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                                <h3 className="font-semibold text-purple-900 mb-3">Safety Features Test</h3>
                                <p className="text-purple-700 text-sm mb-4">Test safety interlocks and emergency stop functions.</p>
                                <div className="space-y-3">
                                    <label className="flex items-start p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="safety_features"
                                            checked={responses.safety_features === 'all_working'}
                                            onChange={() => updateResponse('safety_features', 'all_working')}
                                            className="mt-1 mr-3 h-4 w-4 text-green-600 border-gray-300 focus:ring-green-500"
                                        />
                                        <div>
                                            <span className="font-medium text-green-600">✅ All safety features working</span>
                                            <p className="text-sm text-gray-600 mt-1">Emergency stop, interlocks, and barriers functional</p>
                                        </div>
                                    </label>
                                    <label className="flex items-start p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="safety_features"
                                            checked={responses.safety_features === 'some_not_working'}
                                            onChange={() => updateResponse('safety_features', 'some_not_working')}
                                            className="mt-1 mr-3 h-4 w-4 text-red-600 border-gray-300 focus:ring-red-500"
                                        />
                                        <div>
                                            <span className="font-medium text-red-600">❌ Some safety features not working</span>
                                            <p className="text-sm text-gray-600 mt-1">Safety system compromised</p>
                                        </div>
                                    </label>
                                    <label className="flex items-start p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="safety_features"
                                            checked={responses.safety_features === 'cannot_test'}
                                            onChange={() => updateResponse('safety_features', 'cannot_test')}
                                            className="mt-1 mr-3 h-4 w-4 text-orange-600 border-gray-300 focus:ring-orange-500"
                                        />
                                        <div>
                                            <span className="font-medium text-orange-600">⚠️ Cannot test safely</span>
                                            <p className="text-sm text-gray-600 mt-1">Testing not possible due to operational issues</p>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mt-8 flex justify-between">
                        <button onClick={onPrevious} className="flex items-center px-6 py-2 text-gray-600 hover:text-gray-800">
                            <ArrowLeft className="w-4 h-4 mr-1" />Previous
                        </button>
                        <button
                            onClick={onNext}
                            disabled={!responses.deployment_test || 
                                     (responses.deployment_test !== 'will_not_deploy' && !responses.movement_test) ||
                                     (responses.movement_test && responses.movement_test !== 'movement_failure' && !responses.safety_features)}
                            className="flex items-center px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                            Continue to Decision<ArrowRight className="w-4 h-4 ml-1" />
                        </button>
                    </div>
                </div>
            );

        case 3:
            const deploymentOK = responses.deployment_test === 'deploys_normally' || responses.deployment_test === 'deploys_slowly';
            const movementOK = responses.movement_test === 'raises_lowers_normally' || responses.movement_test === 'jerky_movement';
            const safetyOK = responses.safety_features === 'all_working';
            const hasWheelchairUserWaiting = responses.service_context === 'wheelchair_user_present';
            
            const isFullyFunctional = deploymentOK && movementOK && safetyOK;
            const hasMinorIssues = deploymentOK && movementOK && !safetyOK;
            const hasMajorFailure = responses.deployment_test === 'will_not_deploy' || 
                                  responses.movement_test === 'movement_failure' ||
                                  responses.safety_features === 'some_not_working';

            return (
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="mb-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">📋 Wheelchair Lift Assessment Decision</h2>
                        <p className="text-gray-600">Based on your lift system assessment, here is the recommended action:</p>
                    </div>

                    <div className="space-y-6">
                        {/* Assessment Summary */}
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                            <h3 className="font-semibold text-gray-900 mb-3">Assessment Summary</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="font-medium">System Type:</span> {responses.vehicle_type?.replace(/_/g, ' ')}
                                </div>
                                <div>
                                    <span className="font-medium">Service Context:</span> {responses.service_context?.replace(/_/g, ' ')}
                                </div>
                                <div>
                                    <span className="font-medium">Deployment:</span> 
                                    <span className={deploymentOK ? 'text-green-600 ml-1' : 'text-red-600 ml-1'}>
                                        {responses.deployment_test === 'deploys_normally' ? '✅ Normal' :
                                         responses.deployment_test === 'deploys_slowly' ? '⚠️ Slow' :
                                         responses.deployment_test === 'will_not_deploy' ? '❌ Failed' : '🔧 Partial'}
                                    </span>
                                </div>
                                <div>
                                    <span className="font-medium">Movement:</span>
                                    <span className={movementOK ? 'text-green-600 ml-1' : 'text-red-600 ml-1'}>
                                        {responses.movement_test === 'raises_lowers_normally' ? '✅ Normal' :
                                         responses.movement_test === 'jerky_movement' ? '⚠️ Jerky' :
                                         responses.movement_test === 'movement_failure' ? '❌ Failed' : 'Not tested'}
                                    </span>
                                </div>
                                <div>
                                    <span className="font-medium">Safety Features:</span>
                                    <span className={safetyOK ? 'text-green-600 ml-1' : 'text-red-600 ml-1'}>
                                        {responses.safety_features === 'all_working' ? '✅ Working' :
                                         responses.safety_features === 'some_not_working' ? '❌ Defective' : '⚠️ Not tested'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Decision Logic */}
                        {hasMajorFailure || (hasWheelchairUserWaiting && !isFullyFunctional) ? (
                            <div className="bg-red-50 border-l-4 border-red-600 p-6">
                                <div className="flex items-start">
                                    <XCircle className="w-8 h-8 text-red-600 mt-1 mr-4" />
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold text-red-800 mb-3">🚫 IMMEDIATE CHANGEOVER REQUIRED</h3>
                                        <div className="text-red-700 space-y-2">
                                            <p className="font-semibold">Wheelchair accessibility system failure - immediate action required</p>
                                            <div className="bg-white rounded p-4 mt-4">
                                                <h4 className="font-semibold text-red-800 mb-2">Critical Issues:</h4>
                                                <ul className="list-disc list-inside space-y-1 text-red-700">
                                                    {responses.deployment_test === 'will_not_deploy' && <li>Lift will not deploy - no accessibility available</li>}
                                                    {responses.movement_test === 'movement_failure' && <li>Lift movement failure - unsafe for passengers</li>}
                                                    {responses.safety_features === 'some_not_working' && <li>Safety systems compromised</li>}
                                                    {hasWheelchairUserWaiting && !isFullyFunctional && <li>Wheelchair user waiting - legal obligation to provide access</li>}
                                                </ul>
                                                <h4 className="font-semibold text-red-800 mb-2 mt-4">Required Actions:</h4>
                                                <ul className="list-disc list-inside space-y-1 text-red-700">
                                                    <li>Arrange immediate changeover to accessible vehicle</li>
                                                    <li>Cannot refuse wheelchair passengers</li>
                                                    <li>Legal compliance under Equality Act</li>
                                                    <li>Record defects in Go-Check system</li>
                                                    <li>Contact engineering for urgent repair</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : hasMinorIssues ? (
                            <div className="bg-yellow-50 border-l-4 border-yellow-600 p-6">
                                <div className="flex items-start">
                                    <AlertTriangle className="w-8 h-8 text-yellow-600 mt-1 mr-4" />
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold text-yellow-800 mb-3">⚠️ CONTINUE WITH CAUTION</h3>
                                        <div className="text-yellow-700 space-y-2">
                                            <p className="font-semibold">Lift operational but with minor defects - monitor closely</p>
                                            <div className="bg-white rounded p-4 mt-4">
                                                <h4 className="font-semibold text-yellow-800 mb-2">Issues to Monitor:</h4>
                                                <ul className="list-disc list-inside space-y-1 text-yellow-700">
                                                    {responses.deployment_test === 'deploys_slowly' && <li>Slow deployment - may worsen</li>}
                                                    {responses.movement_test === 'jerky_movement' && <li>Uneven movement - passenger comfort affected</li>}
                                                    {responses.safety_features !== 'all_working' && <li>Safety system issues</li>}
                                                </ul>
                                                <h4 className="font-semibold text-yellow-800 mb-2 mt-4">Required Actions:</h4>
                                                <ul className="list-disc list-inside space-y-1 text-yellow-700">
                                                    <li>Continue service but arrange changeover at next opportunity</li>
                                                    <li>Test lift before each wheelchair passenger</li>
                                                    <li>Monitor system closely for deterioration</li>
                                                    <li>Record defects for maintenance attention</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-green-50 border-l-4 border-green-600 p-6">
                                <div className="flex items-start">
                                    <CheckCircle className="w-8 h-8 text-green-600 mt-1 mr-4" />
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold text-green-800 mb-3">✅ CONTINUE IN SERVICE</h3>
                                        <div className="text-green-700 space-y-2">
                                            <p className="font-semibold">Wheelchair accessibility system fully functional</p>
                                            <div className="bg-white rounded p-4 mt-4">
                                                <h4 className="font-semibold text-green-800 mb-2">System Status:</h4>
                                                <ul className="list-disc list-inside space-y-1 text-green-700">
                                                    <li>All accessibility functions working correctly</li>
                                                    <li>Safety systems operational</li>
                                                    <li>Vehicle compliant for wheelchair passengers</li>
                                                </ul>
                                                <h4 className="font-semibold text-green-800 mb-2 mt-4">Routine Actions:</h4>
                                                <ul className="list-disc list-inside space-y-1 text-green-700">
                                                    <li>Continue normal service</li>
                                                    <li>Maintain regular operational checks</li>
                                                    <li>Report any new issues immediately</li>
                                                    <li>Include in routine maintenance schedule</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mt-8 flex justify-between">
                        <button onClick={onPrevious} className="flex items-center px-6 py-2 text-gray-600 hover:text-gray-800">
                            <ArrowLeft className="w-4 h-4 mr-1" />Previous
                        </button>
                        <button onClick={onComplete} className="flex items-center px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                            Complete Assessment<CheckCircle className="w-4 h-4 ml-1" />
                        </button>
                    </div>
                </div>
            );

        default:
            return <div>Unknown step</div>;
    }
};

// Export to global scope for use in the main application
window.WheelchairLiftWizard = WheelchairLiftWizard;
