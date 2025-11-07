// Steering Wizard Component - Safety-Critical Steering System Assessment
// Uses icons and constants from common components
// Follows operational safety procedures v1.3 - Steering Section (Page 8)
// DVSA Compliance: Categorisation of Vehicle Defects

import React, { useState, useEffect } from 'react';
import * as Icons from '../common/icons.jsx';
import constants from '../common/constants.js';
import locationService from '../../../utils/locationService.js';

const SteeringWizard = ({ currentStep, responses, updateResponse, onNext, onPrevious, onComplete }) => {
    const { AlertTriangle, ArrowLeft, ArrowRight, Home, CheckCircle, XCircle, FileText, Shield, AlertCircle, Users } = Icons;

    // Location state management
    const [locationStatus, setLocationStatus] = useState('idle'); // 'idle', 'detecting', 'success', 'error'
    const [locationName, setLocationName] = useState('');
    const [coordinates, setCoordinates] = useState(null);

    // Auto-detect location when wizard loads
    useEffect(() => {
        if (currentStep === 1 && !coordinates) {
            detectLocation();
        }
    }, [currentStep]);

    const detectLocation = async () => {
        if (!navigator.geolocation) {
            setLocationStatus('error');
            setLocationName('GPS not available');
            return;
        }

        setLocationStatus('detecting');

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;

                    setCoordinates({ lat, lng });

                    // Use our location service to get a readable name
                    const readableName = await locationService.getLocationName(lat, lng);
                    setLocationName(readableName);
                    setLocationStatus('success');

                    // Store in responses for later use
                    updateResponse('currentLocation', {
                        name: readableName,
                        coordinates: { lat, lng },
                        accuracy: position.coords.accuracy,
                        timestamp: new Date().toISOString()
                    });

                } catch (error) {
                    console.error('Error getting location name:', error);
                    setLocationName(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
                    setLocationStatus('success');
                }
            },
            (error) => {
                console.error('Geolocation error:', error);
                setLocationStatus('error');
                setLocationName('Location access denied');
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000 // 5 minutes
            }
        );
    };

    switch (currentStep) {
        case 1:
            return (
                <div className="space-y-6">
                    <div className="text-center">
                        <div className="mx-auto w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mb-4">
                            <Users className="w-8 h-8 text-purple-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">🚌 Passenger Status Assessment</h2>
                        <p className="text-gray-300">Essential safety information before steering system diagnosis</p>
                    </div>

                    <div className="bg-purple-500/20 backdrop-blur-sm rounded-lg p-6 border border-purple-400/30">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                            <div>
                                <h4 className="font-semibold text-purple-200 mb-1">Passenger Safety Priority</h4>
                                <p className="text-purple-200/80 text-sm">
                                    Understanding passenger status is critical for steering system emergencies. This information helps prioritize emergency response and evacuation planning if needed.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                        <h3 className="text-lg font-semibold text-white mb-4">Are there passengers currently on board?</h3>

                        <div className="space-y-3">
                            <button
                                onClick={() => updateResponse('passengersOnBoard', true)}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.passengersOnBoard === true
                                        ? 'border-orange-500 bg-orange-500/20 text-orange-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-orange-500/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.passengersOnBoard === true ? 'border-orange-500 bg-orange-500' : 'border-white/50'
                                    }`}>
                                        {responses.passengersOnBoard === true && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Users className="w-4 h-4 text-orange-400" />
                                        <span>Yes - Passengers on board</span>
                                    </div>
                                </div>
                            </button>

                            <button
                                onClick={() => updateResponse('passengersOnBoard', false)}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.passengersOnBoard === false
                                        ? 'border-green-500 bg-green-500/20 text-green-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-green-500/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.passengersOnBoard === false ? 'border-green-500 bg-green-500' : 'border-white/50'
                                    }`}>
                                        {responses.passengersOnBoard === false && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4 text-green-400" />
                                        <span>No - Vehicle empty</span>
                                    </div>
                                </div>
                            </button>
                        </div>

                        {/* Passenger Count Input */}
                        {responses.passengersOnBoard === true && (
                            <div className="passenger-count-input fade-in bg-gray-700/30 backdrop-blur-sm rounded-lg p-4 border border-purple-500/30 mt-4">
                                <div className="flex items-center gap-3 mb-3">
                                    <Users className="w-5 h-5 text-purple-400" />
                                    <h4 className="font-semibold text-white">Passenger Count</h4>
                                </div>
                                <div className="space-y-3">
                                    <label className="block text-sm text-gray-300">
                                        Approximate passenger count:
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="100"
                                        value={responses.passengerCount || ''}
                                        onChange={(e) => updateResponse('passengerCount', e.target.value)}
                                        placeholder="Enter number"
                                        className="count-input w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors"
                                    />
                                    <p className="text-gray-500 text-xs">
                                        Optional: Helps prioritize emergency response and evacuation planning if needed.
                                    </p>
                                    {(!responses.passengerCount || responses.passengerCount === '') ? (
                                        <div className="flex items-center gap-2 mt-2 text-yellow-400 text-xs">
                                            <AlertTriangle className="w-3 h-3" />
                                            <span>Consider providing approximate passenger count for better emergency planning</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 mt-2 text-green-400 text-xs">
                                            <CheckCircle className="w-3 h-3" />
                                            <span>Passenger count recorded - emergency response can be prioritized accordingly</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Passenger Safety Notice */}
                        {responses.passengersOnBoard === true && (
                            <div className="bg-orange-500/20 backdrop-blur-sm rounded-lg p-4 border border-orange-400/30 mt-4">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="font-semibold text-orange-200 mb-1">⚠️ Critical Steering Scenarios with Passengers</h4>
                                        <p className="text-orange-200/80 text-sm">
                                            If steering system defects are identified, immediate vehicle shutdown is required. Passenger evacuation may be necessary. Ensure passenger safety is the absolute priority.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Current Location Detection */}
                    <div className="bg-blue-500/20 backdrop-blur-sm rounded-lg p-4 border border-blue-400/30">
                        <div className="flex items-start gap-3">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                                locationStatus === 'success' ? 'bg-green-500' :
                                locationStatus === 'detecting' ? 'bg-yellow-500 animate-pulse' :
                                locationStatus === 'error' ? 'bg-red-500' : 'bg-gray-500'
                            }`}>
                                {locationStatus === 'success' && <CheckCircle className="w-3 h-3 text-white" />}
                                {locationStatus === 'detecting' && <div className="w-2 h-2 bg-white rounded-full" />}
                                {locationStatus === 'error' && <XCircle className="w-3 h-3 text-white" />}
                            </div>
                            <div className="flex-1">
                                <h4 className="font-semibold text-blue-200 mb-1">📍 Current Location</h4>
                                <p className="text-blue-200/80 text-sm">
                                    {locationStatus === 'detecting' && 'Detecting current location...'}
                                    {locationStatus === 'success' && `Location: ${locationName}`}
                                    {locationStatus === 'error' && 'Unable to detect location - GPS may be disabled'}
                                    {locationStatus === 'idle' && 'Location detection starting...'}
                                </p>
                                {coordinates && locationStatus === 'success' && (
                                    <p className="text-blue-300/60 text-xs mt-1">
                                        Coordinates: {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
                                    </p>
                                )}
                            </div>
                            {locationStatus === 'error' && (
                                <button
                                    onClick={detectLocation}
                                    className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-500 transition-colors"
                                >
                                    Retry
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-between">
                        <button
                            onClick={onPrevious}
                            disabled={true}
                            className="px-6 py-3 bg-gray-600 text-gray-400 rounded-lg cursor-not-allowed transition-colors"
                        >
                            Previous
                        </button>
                        <button
                            onClick={onNext}
                            disabled={responses.passengersOnBoard === null || responses.passengersOnBoard === undefined}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Continue to Steering Assessment
                        </button>
                    </div>
                </div>
            );

        case 2:
            return (
                <div className="space-y-6">
                    <div className="text-center">
                        <div className="mx-auto w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                            <Shield className="w-8 h-8 text-red-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">🚗 Steering System Safety Assessment</h2>
                        <p className="text-gray-300">Critical safety evaluation following operational safety procedures - ensuring steering system control and directional stability.</p>
                    </div>
                    
                    <div className="bg-red-500/20 backdrop-blur-sm rounded-lg p-6 border border-red-400/30">
                        <h3 className="text-lg font-semibold text-red-200 mb-4">⚠️ SAFETY-CRITICAL CONTROL SYSTEM</h3>
                        <p className="text-red-300/80 text-sm leading-relaxed mb-4">
                            Steering system defects pose immediate danger to vehicle control and directional stability. ANY compromise requires immediate action.
                        </p>
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                            <h4 className="font-semibold text-red-200 mb-2">Critical Safety Rules:</h4>
                            <ul className="list-disc list-inside space-y-1 text-red-300/90 text-sm">
                                <li>ANY steering defect identified = immediate vehicle shutdown</li>
                                <li>NO exceptions for "continuing to next changeover"</li>
                                <li>Record all defects in Tranzaura System when stationary</li>
                                <li>Next step: physical inspection using comprehensive checklist</li>
                            </ul>
                        </div>
                    </div>
                    
                    <button 
                        onClick={onNext}
                        className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 shadow-lg transition-all duration-200"
                    >
                        Begin Critical Assessment <ArrowRight className="w-5 h-5" />
                    </button>
                </div>
            );

        case 3:
            return (
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-white">Driver Reporting - Steering Assessment</h2>
                    
                    <div className="bg-yellow-500/20 backdrop-blur-sm rounded-lg p-4 border border-yellow-400/30">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                            <p className="text-yellow-200 text-sm">
                                Has the driver reported ANY steering issues, unusual noises, or control problems? All reports must be treated as critical.
                            </p>
                        </div>
                    </div>
                    
                    <div className="space-y-3">
                        <button 
                            onClick={() => {
                                updateResponse(3, 'no');
                                onNext();
                            }}
                            className="w-full bg-gray-800/50 backdrop-blur-sm hover:bg-gray-700/50 text-white font-medium py-4 px-6 rounded-lg border border-gray-600/50 transition-all duration-200 text-left flex items-center justify-between group"
                        >
                            <div className="flex items-center gap-3">
                                <CheckCircle className="w-5 h-5 text-green-400" />
                                <div>
                                    <span className="block">No Steering Issues Reported</span>
                                    <span className="text-sm text-gray-400">Driver reports steering operates normally</span>
                                </div>
                            </div>
                            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-white" />
                        </button>
                        
                        <button 
                            onClick={() => {
                                updateResponse(3, 'yes');
                                onNext();
                            }}
                            className="w-full bg-red-900/30 backdrop-blur-sm hover:bg-red-900/50 text-white font-medium py-4 px-6 rounded-lg border border-red-600/50 transition-all duration-200 text-left flex items-center justify-between group"
                        >
                            <div className="flex items-center gap-3">
                                <XCircle className="w-5 h-5 text-red-400" />
                                <div>
                                    <span className="block">Steering Issue Reported</span>
                                    <span className="text-sm text-red-300">ANY steering complaint is safety-critical</span>
                                </div>
                            </div>
                            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-white" />
                        </button>
                    </div>
                    
                    <button 
                        onClick={onPrevious}
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                </div>
            );
            
        case 4:
            if (responses[3] === 'yes') {
                // IMMEDIATE STOP DECISION
                return (
                    <div className="space-y-6">
                        <div className="bg-red-500/30 backdrop-blur-sm rounded-lg p-6 border-2 border-red-500">
                            <div className="flex items-center gap-3 mb-4">
                                <AlertTriangle className="w-8 h-8 text-red-400" />
                                <h2 className="text-2xl font-bold text-red-200">IMMEDIATE STOP REQUIRED</h2>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="bg-black/30 rounded-lg p-4">
                                    <h3 className="font-semibold text-red-200 mb-2">Operational Mandate - STEERING DEFECTS:</h3>
                                    <p className="text-red-300 text-sm leading-relaxed">
                                        "If any of the following occur, advise the driver to switch off the vehicle and await engineering attendance"
                                    </p>
                                </div>
                                
                                <div className="bg-red-950/50 backdrop-blur-sm rounded-lg p-4 border border-red-600/30">
                                    <h4 className="font-semibold text-red-200 mb-3">⚡ Required Actions:</h4>
                                    <ol className="list-decimal list-inside space-y-2 text-red-300 text-sm">
                                        <li>Instruct driver to STOP IMMEDIATELY in safe location</li>
                                        <li>SWITCH OFF engine completely</li>
                                        <li>DO NOT attempt to move vehicle</li>
                                        <li>Await engineering attendance</li>
                                        <li>Log as SAFETY-CRITICAL STOP decision</li>
                                        <li>Record defect in Tranzaura System when stationary</li>
                                    </ol>
                                </div>
                                
                                <div className="bg-yellow-900/30 backdrop-blur-sm rounded-lg p-4 border border-yellow-600/30">
                                    <h4 className="font-semibold text-yellow-200 mb-2">⚠️ DVSA Warning:</h4>
                                    <p className="text-yellow-300/90 text-sm">
                                        Operating with known steering defects risks immediate PG9 prohibition and severe penalties. 
                                        Steering defects are classified as "Dangerous" under DVSA categorisation.
                                    </p>
                                </div>
                            </div>
                            
                            <button
                                onClick={() => onComplete('stop', 'Steering issue reported - safety-critical STOP required')}
                                className="mt-6 w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
                            >
                                <AlertTriangle className="w-5 h-5" />
                                CONFIRM SAFETY STOP DECISION
                            </button>
                        </div>
                    </div>
                );
            } else {
                // Continue to physical assessment
                return (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold text-white">Physical Steering Assessment</h2>
                        
                        <div className="bg-blue-500/20 backdrop-blur-sm rounded-lg p-4 border border-blue-400/30">
                            <p className="text-blue-200 text-sm">
                                Driver reports no issues. Proceed with mandatory physical checks for any of these conditions:
                            </p>
                        </div>
                        
                        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-600/50">
                            <h3 className="font-semibold text-white mb-4">Check for ANY of these conditions:</h3>
                            <ul className="space-y-3 text-gray-300 text-sm">
                                <li className="flex items-start gap-2">
                                    <span className="text-red-400 mt-0.5">•</span>
                                    <span>Excessive play in steering wheel (DVSA limit: &gt;75mm at rim for power steering)</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-red-400 mt-0.5">•</span>
                                    <span>Difficulty steering or maintaining control</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-red-400 mt-0.5">•</span>
                                    <span>Unusual noises when steering (knocking, grinding, squealing)</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-red-400 mt-0.5">•</span>
                                    <span>Vehicle pulling to one side during operation</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-red-400 mt-0.5">•</span>
                                    <span>Visible damage to steering system (column, linkage)</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-red-400 mt-0.5">•</span>
                                    <span>Leaks from power steering system</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-red-400 mt-0.5">•</span>
                                    <span>Steering becomes stiff or unresponsive</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-red-400 mt-0.5">•</span>
                                    <span>ANY steering-related warning light illuminated</span>
                                </li>
                            </ul>
                        </div>
                        
                        <div className="space-y-3">
                            <button 
                                onClick={() => { updateResponse(4, 'pass'); onNext(); }}
                                className="w-full bg-green-900/30 backdrop-blur-sm hover:bg-green-900/50 text-white font-medium py-4 px-6 rounded-lg border border-green-600/50 transition-all duration-200 text-left flex items-center justify-between group"
                            >
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-green-400" />
                                    <div>
                                        <span className="block">All Checks PASS</span>
                                        <span className="text-sm text-green-300">NO defects found in any category</span>
                                    </div>
                                </div>
                                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-white" />
                            </button>
                            
                            <button 
                                onClick={() => { updateResponse(4, 'fail'); onNext(); }}
                                className="w-full bg-red-900/30 backdrop-blur-sm hover:bg-red-900/50 text-white font-medium py-4 px-6 rounded-lg border border-red-600/50 transition-all duration-200 text-left flex items-center justify-between group"
                            >
                                <div className="flex items-center gap-3">
                                    <XCircle className="w-5 h-5 text-red-400" />
                                    <div>
                                        <span className="block">Defect Found</span>
                                        <span className="text-sm text-red-300">ANY condition above is present</span>
                                    </div>
                                </div>
                                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-white" />
                            </button>
                        </div>
                        
                        <button 
                            onClick={onPrevious}
                            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" /> Back
                        </button>
                    </div>
                );
            }
            
        case 5:
            if (responses[4] === 'fail') {
                // IMMEDIATE STOP for any physical defect
                return (
                    <div className="space-y-6">
                        <div className="bg-red-500/30 backdrop-blur-sm rounded-lg p-6 border-2 border-red-500">
                            <div className="flex items-center gap-3 mb-4">
                                <AlertTriangle className="w-8 h-8 text-red-400" />
                                <h2 className="text-2xl font-bold text-red-200">IMMEDIATE STOP REQUIRED</h2>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="bg-black/30 rounded-lg p-4">
                                    <h3 className="font-semibold text-red-200 mb-2">Operational Safety Procedures:</h3>
                                    <p className="text-red-300 text-sm leading-relaxed">
                                        "If any of the following occur, advise the driver to switch off the vehicle and await engineering attendance"
                                    </p>
                                </div>
                                
                                <div className="bg-red-950/50 backdrop-blur-sm rounded-lg p-4 border border-red-600/30">
                                    <h4 className="font-semibold text-red-200 mb-3">🛑 Critical Safety Actions:</h4>
                                    <ol className="list-decimal list-inside space-y-2 text-red-300 text-sm">
                                        <li>Vehicle must STOP immediately</li>
                                        <li>Engine OFF - no exceptions</li>
                                        <li>NO movement until repaired</li>
                                        <li>Engineering attendance required</li>
                                        <li>Document specific defect found in Tranzaura</li>
                                        <li>Report to depot management</li>
                                        <li>Note: Persistent false reports should be escalated</li>
                                    </ol>
                                </div>
                                
                                <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4">
                                    <h4 className="font-semibold text-gray-200 mb-2">Key Safety Guidance:</h4>
                                    <p className="text-gray-300 text-sm">
                                        "Record any defects immediately on the vehicle management system when the bus is stationary and in a safe location."
                                        <span className="block mt-2 text-red-300 font-semibold">
                                            ⚠️ Steering defects = NO continuation allowed - immediate stop required
                                        </span>
                                    </p>
                                </div>
                            </div>
                            
                            <button
                                onClick={() => onComplete('stop', 'Physical steering defect identified - safety-critical STOP required')}
                                className="mt-6 w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
                            >
                                <AlertTriangle className="w-5 h-5" />
                                CONFIRM SAFETY STOP DECISION
                            </button>
                        </div>
                    </div>
                );
            } else {
                // All clear - can continue
                return (
                    <div className="space-y-6">
                        <div className="bg-green-500/30 backdrop-blur-sm rounded-lg p-6 border-2 border-green-500">
                            <div className="flex items-center gap-3 mb-4">
                                <CheckCircle className="w-8 h-8 text-green-400" />
                                <h2 className="text-2xl font-bold text-green-200">Steering System SAFE</h2>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="bg-green-950/50 backdrop-blur-sm rounded-lg p-4">
                                    <h3 className="font-semibold text-green-200 mb-2">Assessment Complete:</h3>
                                    <ul className="space-y-2 text-green-300 text-sm">
                                        <li className="flex items-center gap-2">
                                            <CheckCircle className="w-4 h-4" />
                                            <span>No steering issues reported by driver</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <CheckCircle className="w-4 h-4" />
                                            <span>Physical inspection passed all criteria</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <CheckCircle className="w-4 h-4" />
                                            <span>Steering system meets safety requirements</span>
                                        </li>
                                    </ul>
                                </div>
                                
                                <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4">
                                    <h4 className="font-semibold text-gray-200 mb-2">Recommended Actions:</h4>
                                    <ul className="list-disc list-inside space-y-1 text-gray-300 text-sm">
                                        <li>Continue normal operation</li>
                                        <li>Monitor for any changes during shift</li>
                                        <li>Report any new symptoms immediately</li>
                                        <li>Document check completion in vehicle log</li>
                                        <li>If persistent false reports occur, notify depot management</li>
                                    </ul>
                                </div>
                                
                                <div className="bg-blue-900/30 backdrop-blur-sm rounded-lg p-4 border border-blue-600/30">
                                    <p className="text-blue-300 text-sm flex items-start gap-2">
                                        <FileText className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                        <span>
                                            This assessment has been logged with timestamp and supervisor details for compliance records.
                                            Management Guidance: "Report to the depot management team if you feel a particular individual is persistently
                                            reporting steering problems that, when investigated by engineering, reveal no fault."
                                        </span>
                                    </p>
                                </div>
                            </div>
                            
                            <button 
                                onClick={() => onComplete('continue', 'Steering system checked - all safety requirements met')}
                                className="mt-6 w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
                            >
                                <CheckCircle className="w-5 h-5" />
                                CONFIRM CONTINUE DECISION
                            </button>
                        </div>
                    </div>
                );
            }
            
        default:
            return null;
    }
};

export default SteeringWizard;
