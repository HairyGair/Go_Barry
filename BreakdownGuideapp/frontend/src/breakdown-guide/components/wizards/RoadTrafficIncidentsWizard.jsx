import React, { useEffect, useState } from 'react';
import * as Icons from '../common/icons.jsx';
import constants from '../common/constants.js';
import { supervisorBreakdownLogger } from '../../supervisorBreakdownLogger.js';

// Road Traffic Incidents Wizard Component - Critical Incident Management
// Uses icons and constants from common components
// Follows operational safety procedures v1.3 - Road Traffic Incidents Section (Pages 4-5)
// Integrated with Tranzaura defect tracking system

const RoadTrafficIncidentsWizard = ({ currentStep, responses, updateResponse, onNext, onPrevious, onComplete, onWizardSelect }) => {
    // Get icons from global scope
    const { AlertTriangle, ArrowLeft, ArrowRight, Home, CheckCircle, XCircle, FileText, Shield, AlertCircle, Phone, Users, Tool, MapPin, Calendar, Clock, Camera, Building, Route, Hash, Copy, Download, Mail } = Icons;
    
    // State for location data
    const [locationData, setLocationData] = useState({
        coordinates: null,
        address: '',
        roadName: '',
        locality: '',
        isLoading: false
    });
    
    // Get supervisor data for pre-population
    const supervisorData = supervisorBreakdownLogger.supervisor || {};
    
    // Auto-generate incident number
    const generateIncidentNumber = () => {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const time = String(date.getHours()).padStart(2, '0') + String(date.getMinutes()).padStart(2, '0');
        return `RTI-${year}${month}${day}-${time}`;
    };
    
    // Get current date/time
    const getCurrentDateTime = () => {
        const date = new Date();
        return {
            date: date.toISOString().split('T')[0],
            time: date.toTimeString().split(' ')[0].slice(0, 5)
        };
    };
    
    // Initialize incident data when component mounts
    useEffect(() => {
        console.log('RoadTrafficIncidentsWizard useEffect running');
        console.log('Current responses:', responses);
        
        // Ensure incident number is generated
        if (!responses.incident_number) {
            const incidentNum = generateIncidentNumber();
            console.log('Generating incident number:', incidentNum);
            updateResponse('incident_number', incidentNum);
        }
        
        // Pre-populate smart defaults
        if (!responses.brand) {
            updateResponse('brand', 'Go North East');
        }
        
        if (!responses.garage_depot && supervisorData.depot) {
            updateResponse('garage_depot', supervisorData.depot);
        }
        
        if (!responses.vehicle_type) {
            updateResponse('vehicle_type', 'My Garage/Brand');
        }
        
        if (!responses.employee_type) {
            updateResponse('employee_type', 'My Garage/Brand');
        }
        
        // Set default incident date/time if not set (auto-fill with current date/time)
        if (!responses.incident_date || !responses.incident_time) {
            const { date, time } = getCurrentDateTime();
            console.log('Auto-filling date/time:', { date, time });
            updateResponse('incident_date', date);
            updateResponse('incident_time', time);
            updateResponse('time_known', true);
            updateResponse('report_received_date', new Date().toISOString());
        }
        
        // Get location from breakdown logger - do this for any step that needs location
        const breakdown = supervisorBreakdownLogger.getCurrentBreakdown();
        console.log('RoadTrafficIncidentsWizard - Breakdown data from logger:', breakdown);
        if (breakdown?.location && (currentStep === 4 || currentStep === 1)) {
            console.log('RoadTrafficIncidentsWizard - Found location in breakdown data:', breakdown.location);
            
            // Handle both coordinate formats
            const lat = breakdown.location.lat || breakdown.location.latitude;
            const lng = breakdown.location.lng || breakdown.location.longitude || breakdown.location.lon;
            
            console.log('RoadTrafficIncidentsWizard - Extracted coordinates:', { lat, lng });
            
            if (lat && lng && !locationData.coordinates) {
                console.log('RoadTrafficIncidentsWizard - Setting location data');
                setLocationData(prev => ({
                    ...prev,
                    coordinates: { lat, lng }
                }));
                
                // Store coordinates in responses
                updateResponse('latitude', lat);
                updateResponse('longitude', lng);
                updateResponse('location_captured', true);
                
                // If we have coordinates but no address details, reverse geocode
                if (!responses.precise_location) {
                    console.log('RoadTrafficIncidentsWizard - Starting reverse geocode');
                    reverseGeocode(lat, lng);
                }
            }
            
            // If we have address data directly, use it
            if (breakdown.location.address && !responses.precise_location) {
                console.log('RoadTrafficIncidentsWizard - Using direct address:', breakdown.location.address);
                updateResponse('precise_location', breakdown.location.address);
            }
        }
    }, [responses.incident_number, responses.incident_date, responses.incident_time, updateResponse, currentStep, locationData.coordinates]); // Proper dependencies
    
    // Reverse geocoding function
    const reverseGeocode = async (lat, lng) => {
        console.log('RoadTrafficIncidentsWizard - reverseGeocode called with:', { lat, lng });
        setLocationData(prev => ({ ...prev, isLoading: true }));
        try {
            // Using Nominatim (OpenStreetMap) for reverse geocoding
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=en`
            );
            const data = await response.json();
            console.log('RoadTrafficIncidentsWizard - Geocoding response:', data);
            
            if (data && data.address) {
                const address = data.display_name || '';
                const roadName = data.address.road || data.address.street || '';
                const locality = data.address.suburb || data.address.city || data.address.town || data.address.county || '';
                
                console.log('RoadTrafficIncidentsWizard - Parsed address data:', { address, roadName, locality });
                
                setLocationData(prev => ({
                    ...prev,
                    address,
                    roadName,
                    locality,
                    isLoading: false
                }));
                
                // Pre-populate the responses if they're empty
                if (!responses.precise_location) {
                    updateResponse('precise_location', address);
                }
                if (!responses.road_name) {
                    updateResponse('road_name', roadName);
                }
                if (!responses.locality) {
                    updateResponse('locality', locality);
                }
                
                // Store the coordinates too
                updateResponse('latitude', lat);
                updateResponse('longitude', lng);
                updateResponse('location_captured', true);
            }
        } catch (error) {
            console.error('RoadTrafficIncidentsWizard - Reverse geocoding failed:', error);
            setLocationData(prev => ({ ...prev, isLoading: false }));
        }
    };
    
    // Helper function to copy text to clipboard
    const copyToClipboard = (text, section) => {
        navigator.clipboard.writeText(text).then(() => {
            alert(`${section} copied to clipboard!`);
        });
    };
    
    // Helper function to generate summary text
    const generateSummaryText = () => {
        const summary = `ROAD TRAFFIC INCIDENT REPORT
` +
            `Incident Number: ${responses.incident_number || 'New Incident'}\n` +
            `Brand: ${responses.brand || 'Go North East'}\n` +
            `Garage/Depot: ${responses.garage_depot || ''}\n` +
            `Incident Type: ${responses.incident_type || ''}\n` +
            `Category: ${responses.incident_category || ''}\n` +
            `Date: ${responses.incident_date || ''}\n` +
            `Time: ${responses.incident_time || ''}\n` +
            `Location: ${responses.precise_location || ''}\n` +
            `Fleet Number: ${responses.fleet_number || ''}\n` +
            `Driver Status: ${responses.driver_wellbeing || ''}\n` +
            `Passenger Injuries: ${responses.passenger_injuries || ''}\n` +
            `Police Notified: ${responses.police_notified || ''}\n`;
        return summary;
    };
    
    const renderStep = () => {
        switch (currentStep) {
        case 1:
            return (
                <div className="space-y-6">
                    <div className="text-center">
                        <div className="mx-auto w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                            <Building className="w-8 h-8 text-red-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">📋 Incident Basic Details</h2>
                        <p className="text-gray-300">Start by recording the basic incident information.</p>
                    </div>
                    
                    {/* Brand Information - Auto-populated */}
                    <div className="bg-blue-500/20 backdrop-blur-sm rounded-lg p-6 border border-blue-400/30">
                        <h3 className="text-lg font-semibold text-blue-200 mb-4">🏷️ Brand Information</h3>
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-blue-300/80 mb-1">Brand</p>
                                    <p className="text-xl font-bold text-blue-200">{responses.brand || 'Go North East'}</p>
                                </div>
                                <div className="text-green-400">
                                    <CheckCircle className="w-6 h-6" />
                                </div>
                            </div>
                        </div>
                        <p className="text-blue-300/60 text-xs mt-2">Auto-populated from system settings</p>
                    </div>

                    {/* Garage/Depot Selection */}
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                        <h3 className="text-lg font-semibold text-white mb-4">Garage/Depot</h3>
                        <p className="text-gray-300 text-sm mb-4">Select the garage/depot associated with this incident:</p>
                        <div className="grid grid-cols-2 gap-3">
                            {['Gateshead', 'Consett', 'Washington', 'Percy Main', 'Deptford', 'Hexham'].map((depot) => (
                                <button
                                    key={depot}
                                    type="button"
                                    onClick={() => updateResponse('garage_depot', depot)}
                                    className={`p-3 rounded-lg border-2 transition-all text-left cursor-pointer hover:bg-white/5 ${
                                        responses.garage_depot === depot
                                            ? 'border-blue-400 bg-blue-400/20 text-blue-200'
                                            : 'border-white/30 bg-white/10 text-white hover:border-blue-400/50'
                                    }`}
                                >
                                    <span className="font-medium">{depot}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Incident Type */}
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                        <h3 className="text-lg font-semibold text-white mb-4">Incident Type</h3>
                        <p className="text-gray-300 text-sm mb-4">Select the type of incident:</p>
                        <div className="space-y-3">
                            <button
                                type="button"
                                onClick={() => updateResponse('incident_type', 'incident')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left cursor-pointer hover:bg-white/5 ${
                                    responses.incident_type === 'incident'
                                        ? 'border-yellow-400 bg-yellow-400/20 text-yellow-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-yellow-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.incident_type === 'incident' ? 'border-yellow-400 bg-yellow-400' : 'border-white/50'
                                    }`}>
                                        {responses.incident_type === 'incident' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">⚠️ Incident</span>
                                        <p className="text-sm text-gray-300 mt-1">Road traffic collision or safety incident</p>
                                    </div>
                                </div>
                            </button>
                            <button
                                type="button"
                                onClick={() => updateResponse('incident_type', 'occurrence')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left cursor-pointer hover:bg-white/5 ${
                                    responses.incident_type === 'occurrence'
                                        ? 'border-blue-400 bg-blue-400/20 text-blue-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-blue-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.incident_type === 'occurrence' ? 'border-blue-400 bg-blue-400' : 'border-white/50'
                                    }`}>
                                        {responses.incident_type === 'occurrence' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">ℹ️ Occurrence</span>
                                        <p className="text-sm text-gray-300 mt-1">Near miss or other safety-related event</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Incident Category */}
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                        <h3 className="text-lg font-semibold text-white mb-4">Incident Category</h3>
                        <p className="text-gray-300 text-sm mb-4">Select the most appropriate category:</p>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => updateResponse('incident_category', 'collision_moving_vehicle')}
                                className={`p-3 rounded-lg border-2 transition-all text-left cursor-pointer hover:bg-white/5 ${
                                    responses.incident_category === 'collision_moving_vehicle'
                                        ? 'border-red-400 bg-red-400/20 text-red-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                                }`}
                            >
                                <span className="font-medium text-sm">🚗 Collision - Moving Vehicle</span>
                            </button>
                            <button
                                onClick={() => updateResponse('incident_category', 'collision_stationary')}
                                className={`p-3 rounded-lg border-2 transition-all text-left ${
                                    responses.incident_category === 'collision_stationary'
                                        ? 'border-red-400 bg-red-400/20 text-red-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                                }`}
                            >
                                <span className="font-medium text-sm">🚧 Collision - Stationary Object</span>
                            </button>
                            <button
                                onClick={() => updateResponse('incident_category', 'pedestrian_incident')}
                                className={`p-3 rounded-lg border-2 transition-all text-left ${
                                    responses.incident_category === 'pedestrian_incident'
                                        ? 'border-red-400 bg-red-400/20 text-red-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                                }`}
                            >
                                <span className="font-medium text-sm">🚶 Pedestrian Incident</span>
                            </button>
                            <button
                                onClick={() => updateResponse('incident_category', 'passenger_incident')}
                                className={`p-3 rounded-lg border-2 transition-all text-left ${
                                    responses.incident_category === 'passenger_incident'
                                        ? 'border-red-400 bg-red-400/20 text-red-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                                }`}
                            >
                                <span className="font-medium text-sm">👥 Passenger Incident</span>
                            </button>
                            <button
                                onClick={() => updateResponse('incident_category', 'mechanical_failure')}
                                className={`p-3 rounded-lg border-2 transition-all text-left ${
                                    responses.incident_category === 'mechanical_failure'
                                        ? 'border-red-400 bg-red-400/20 text-red-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                                }`}
                            >
                                <span className="font-medium text-sm">⚙️ Mechanical Failure</span>
                            </button>
                            <button
                                onClick={() => updateResponse('incident_category', 'environmental')}
                                className={`p-3 rounded-lg border-2 transition-all text-left ${
                                    responses.incident_category === 'environmental'
                                        ? 'border-red-400 bg-red-400/20 text-red-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                                }`}
                            >
                                <span className="font-medium text-sm">🌧️ Environmental</span>
                            </button>
                            <button
                                onClick={() => updateResponse('incident_category', 'vandalism')}
                                className={`p-3 rounded-lg border-2 transition-all text-left ${
                                    responses.incident_category === 'vandalism'
                                        ? 'border-red-400 bg-red-400/20 text-red-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                                }`}
                            >
                                <span className="font-medium text-sm">🔨 Vandalism</span>
                            </button>
                            <button
                                onClick={() => updateResponse('incident_category', 'other')}
                                className={`p-3 rounded-lg border-2 transition-all text-left ${
                                    responses.incident_category === 'other'
                                        ? 'border-red-400 bg-red-400/20 text-red-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                                }`}
                            >
                                <span className="font-medium text-sm">📋 Other</span>
                            </button>
                        </div>
                    </div>
                    
                    {/* Quick Action Buttons */}
                    <div className="bg-purple-500/20 backdrop-blur-sm rounded-lg p-6 border border-purple-400/30">
                        <h3 className="text-lg font-semibold text-purple-200 mb-4">⚡ Quick Actions</h3>
                        <p className="text-purple-300/80 text-sm mb-4">Select a common scenario to pre-fill relevant fields:</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <button
                                onClick={() => {
                                    updateResponse('incident_type', 'incident');
                                    updateResponse('incident_category', 'collision_moving_vehicle');
                                }}
                                className="p-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors text-sm"
                            >
                                Minor Collision - No Injuries
                            </button>
                            <button
                                onClick={() => {
                                    updateResponse('incident_type', 'incident');
                                    updateResponse('incident_category', 'passenger_incident');
                                }}
                                className="p-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors text-sm"
                            >
                                Passenger Incident
                            </button>
                            <button
                                onClick={() => {
                                    updateResponse('incident_type', 'incident');
                                    updateResponse('incident_category', 'collision_stationary');
                                }}
                                className="p-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors text-sm"
                            >
                                Vehicle Damage Only
                            </button>
                        </div>
                    </div>
                    
                    <div className="flex justify-end">
                        <button
                            onClick={onNext}
                            disabled={!responses.garage_depot || !responses.incident_type || !responses.incident_category}
                            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Continue to Safety Assessment
                        </button>
                    </div>
                </div>
            );

        case 2:
            return (
                <div className="space-y-6">
                    <div className="text-center">
                        <div className="mx-auto w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                            <AlertTriangle className="w-8 h-8 text-red-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">🚨 Safety Assessment</h2>
                        <p className="text-gray-300">Check on the welfare of all persons involved in the incident.</p>
                    </div>
                    
                    <div className="bg-red-500/20 backdrop-blur-sm rounded-lg p-6 border border-red-400/30">
                        <h3 className="text-lg font-semibold text-red-200 mb-4">⚠️ EMERGENCY INCIDENT PROTOCOL</h3>
                        <p className="text-red-300/80 text-sm leading-relaxed mb-4">
                            Road traffic incidents require immediate assessment of safety, injuries, and legal obligations. Priority is on welfare of all persons involved.
                        </p>
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                            <h4 className="font-semibold text-red-200 mb-2">Critical Priorities (in order):</h4>
                            <ul className="list-disc list-inside space-y-1 text-red-300/90 text-sm">
                                <li>1. Check on the Driver's Wellbeing</li>
                                <li>2. Ask About Injuries on the Bus</li>
                                <li>3. Confirm Police Involvement</li>
                                <li>4. Document all injuries for reporting</li>
                            </ul>
                        </div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                        <h3 className="text-lg font-semibold text-white mb-4">Check on the Driver's Wellbeing</h3>
                        <p className="text-gray-300 text-sm mb-4">If the driver seems distressed or unfit to proceed, reassure them: "Take a moment to gather yourself. If you're feeling unwell or unable to continue, let me know so we can arrange support."</p>
                        <div className="space-y-3">
                            <button
                                onClick={() => updateResponse('driver_wellbeing', 'fit_and_well')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.driver_wellbeing === 'fit_and_well'
                                        ? 'border-green-400 bg-green-400/20 text-green-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-green-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.driver_wellbeing === 'fit_and_well' ? 'border-green-400 bg-green-400' : 'border-white/50'
                                    }`}>
                                        {responses.driver_wellbeing === 'fit_and_well' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">✅ Driver is fit and well</span>
                                        <p className="text-sm text-gray-300 mt-1">Driver appears calm, uninjured, and able to continue duties</p>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => updateResponse('driver_wellbeing', 'distressed_but_functional')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.driver_wellbeing === 'distressed_but_functional'
                                        ? 'border-yellow-400 bg-yellow-400/20 text-yellow-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-yellow-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.driver_wellbeing === 'distressed_but_functional' ? 'border-yellow-400 bg-yellow-400' : 'border-white/50'
                                    }`}>
                                        {responses.driver_wellbeing === 'distressed_but_functional' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">⚠️ Driver distressed but functional</span>
                                        <p className="text-sm text-gray-300 mt-1">Driver shaken but still capable of handling situation</p>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => updateResponse('driver_wellbeing', 'distressed_unfit')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.driver_wellbeing === 'distressed_unfit'
                                        ? 'border-red-400 bg-red-400/20 text-red-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.driver_wellbeing === 'distressed_unfit' ? 'border-red-400 bg-red-400' : 'border-white/50'
                                    }`}>
                                        {responses.driver_wellbeing === 'distressed_unfit' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">🚨 Driver distressed and unfit to continue</span>
                                        <p className="text-sm text-gray-300 mt-1">Driver appears unable to proceed safely</p>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => updateResponse('driver_wellbeing', 'injured')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.driver_wellbeing === 'injured'
                                        ? 'border-red-400 bg-red-400/20 text-red-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.driver_wellbeing === 'injured' ? 'border-red-400 bg-red-400' : 'border-white/50'
                                    }`}>
                                        {responses.driver_wellbeing === 'injured' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">🩹 Driver is injured</span>
                                        <p className="text-sm text-gray-300 mt-1">Driver has visible injuries or reports being hurt</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>
                    
                    <div className="bg-blue-500/20 backdrop-blur-sm rounded-lg p-6 border border-blue-400/30">
                        <h3 className="font-semibold text-blue-200 mb-3">Ask About Injuries on the Bus</h3>
                        <p className="text-blue-300/80 text-sm mb-4">"Is anyone on the bus injured?" If injuries are reported, confirm: "Have you offered to assist them or seek medical help?" Follow up: "What response did you get from the injured person?"</p>
                        <div className="space-y-3">
                            <button
                                onClick={() => updateResponse('passenger_injuries', 'no_passengers')}
                                className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                                    responses.passenger_injuries === 'no_passengers'
                                        ? 'border-blue-400 bg-blue-400/20 text-blue-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-blue-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                        responses.passenger_injuries === 'no_passengers' ? 'border-blue-400 bg-blue-400' : 'border-white/50'
                                    }`}>
                                        {responses.passenger_injuries === 'no_passengers' && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">👥 No passengers on board</span>
                                        <p className="text-sm text-gray-300 mt-1">Bus was operating out of service</p>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => updateResponse('passenger_injuries', 'all_unharmed')}
                                className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                                    responses.passenger_injuries === 'all_unharmed'
                                        ? 'border-blue-400 bg-blue-400/20 text-blue-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-blue-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                        responses.passenger_injuries === 'all_unharmed' ? 'border-blue-400 bg-blue-400' : 'border-white/50'
                                    }`}>
                                        {responses.passenger_injuries === 'all_unharmed' && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">✅ All passengers unharmed</span>
                                        <p className="text-sm text-gray-300 mt-1">No injuries reported by passengers</p>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => updateResponse('passenger_injuries', 'minor_injuries')}
                                className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                                    responses.passenger_injuries === 'minor_injuries'
                                        ? 'border-blue-400 bg-blue-400/20 text-blue-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-blue-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                        responses.passenger_injuries === 'minor_injuries' ? 'border-blue-400 bg-blue-400' : 'border-white/50'
                                    }`}>
                                        {responses.passenger_injuries === 'minor_injuries' && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">🩹 Minor passenger injuries</span>
                                        <p className="text-sm text-gray-300 mt-1">Passengers report minor cuts, bruises, or discomfort</p>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => updateResponse('passenger_injuries', 'serious_injuries')}
                                className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                                    responses.passenger_injuries === 'serious_injuries'
                                        ? 'border-blue-400 bg-blue-400/20 text-blue-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-blue-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                        responses.passenger_injuries === 'serious_injuries' ? 'border-blue-400 bg-blue-400' : 'border-white/50'
                                    }`}>
                                        {responses.passenger_injuries === 'serious_injuries' && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">🚨 Serious passenger injuries</span>
                                        <p className="text-sm text-gray-300 mt-1">Passengers require immediate medical attention</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>
                        
                    <div className="bg-yellow-500/20 backdrop-blur-sm rounded-lg p-6 border border-yellow-400/30">
                        <h3 className="font-semibold text-yellow-200 mb-3">Confirm Police Involvement</h3>
                        <p className="text-yellow-300/80 text-sm mb-4">"Have the police been notified about the incident?" If not, advise: "It's important to notify the police as soon as possible if someone is injured. I can help guide you through this if needed."</p>
                        <div className="space-y-3">
                            <button
                                onClick={() => updateResponse('police_notified', 'already_notified')}
                                className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                                    responses.police_notified === 'already_notified'
                                        ? 'border-yellow-400 bg-yellow-400/20 text-yellow-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-yellow-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                        responses.police_notified === 'already_notified' ? 'border-yellow-400 bg-yellow-400' : 'border-white/50'
                                    }`}>
                                        {responses.police_notified === 'already_notified' && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">✅ Police already notified</span>
                                        <p className="text-sm text-gray-300 mt-1">Emergency services have been contacted</p>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => updateResponse('police_notified', 'not_notified')}
                                className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                                    responses.police_notified === 'not_notified'
                                        ? 'border-yellow-400 bg-yellow-400/20 text-yellow-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-yellow-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                        responses.police_notified === 'not_notified' ? 'border-yellow-400 bg-yellow-400' : 'border-white/50'
                                    }`}>
                                        {responses.police_notified === 'not_notified' && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">⚠️ Police not yet notified</span>
                                        <p className="text-sm text-gray-300 mt-1">Emergency services need to be contacted</p>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => updateResponse('police_notified', 'not_required')}
                                className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                                    responses.police_notified === 'not_required'
                                        ? 'border-yellow-400 bg-yellow-400/20 text-yellow-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-yellow-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                        responses.police_notified === 'not_required' ? 'border-yellow-400 bg-yellow-400' : 'border-white/50'
                                    }`}>
                                        {responses.police_notified === 'not_required' && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">ℹ️ Police notification not required</span>
                                        <p className="text-sm text-gray-300 mt-1">Minor incident, no injuries, no third party involvement</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>
                    
                    {/* Critical Safety Warnings */}
                    {(responses.driver_wellbeing === 'distressed_unfit' || responses.driver_wellbeing === 'injured' ||
                      responses.passenger_injuries === 'serious_injuries') && (
                        <div className="bg-red-500/30 backdrop-blur-sm rounded-lg p-6 border border-red-400/50">
                            <div className="flex items-start space-x-4">
                                <AlertTriangle className="w-8 h-8 text-red-400 mt-1" />
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-red-200 mb-3">🚨 IMMEDIATE MEDICAL ATTENTION REQUIRED</h3>
                                    <div className="text-red-300/90 space-y-2">
                                        <p className="font-semibold">Critical situation detected - Emergency response protocol activated</p>
                                        <div className="bg-white/10 backdrop-blur-sm rounded p-4 mt-4">
                                            <h4 className="font-semibold text-red-200 mb-2">Mandatory Emergency Actions:</h4>
                                            <ul className="list-disc list-inside space-y-1 text-red-300/90 text-sm">
                                                <li>Call emergency services immediately (999)</li>
                                                <li>Arrange supervisor attendance to scene</li>
                                                <li>Do not move injured persons unless in immediate danger</li>
                                                <li>Provide first aid within competence level</li>
                                                <li>Secure scene and await professional medical help</li>
                                                <li>Document everything for incident reporting</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    <div className="flex justify-between">
                        <button
                            onClick={onPrevious}
                            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
                        >
                            Previous Step
                        </button>
                        <button
                            onClick={onNext}
                            disabled={!responses.driver_wellbeing || !responses.passenger_injuries || !responses.police_notified}
                            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Continue to Date & Time
                        </button>
                    </div>
                </div>
            );

        case 3:
            return (
                <div className="space-y-6">
                    <div className="text-center">
                        <div className="mx-auto w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                            <Calendar className="w-8 h-8 text-red-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">📅 Date & Time of Incident</h2>
                        <p className="text-gray-300">Record when the incident occurred.</p>
                    </div>
                    
                    {/* Date/Time Auto-populated Notice */}
                    {responses.incident_date && responses.incident_time && (
                        <div className="bg-green-500/20 backdrop-blur-sm rounded-lg p-4 border border-green-400/30">
                            <div className="flex items-center space-x-3">
                                <CheckCircle className="w-5 h-5 text-green-400" />
                                <div>
                                    <p className="text-green-200 font-medium">Date & Time Automatically Set</p>
                                    <p className="text-green-300/70 text-sm">We've pre-filled the current date and time. Please adjust if the incident occurred earlier.</p>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {/* Date/Time Information */}
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                        <h3 className="text-lg font-semibold text-white mb-4">When did the incident occur?</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Incident Date</label>
                                <input
                                    type="date"
                                    value={responses.incident_date || getCurrentDateTime().date}
                                    onChange={(e) => updateResponse('incident_date', e.target.value)}
                                    className="w-full px-4 py-2 bg-white/10 border border-white/30 rounded-lg text-white focus:border-blue-400 focus:outline-none"
                                />
                                <p className="text-xs text-gray-400 mt-1">Auto-filled with current date</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Incident Time</label>
                                <div className="space-y-2">
                                    <input
                                        type="time"
                                        value={responses.incident_time || getCurrentDateTime().time}
                                        onChange={(e) => updateResponse('incident_time', e.target.value)}
                                        disabled={!responses.time_known}
                                        className={`w-full px-4 py-2 bg-white/10 border border-white/30 rounded-lg text-white focus:border-blue-400 focus:outline-none ${
                                            !responses.time_known ? 'opacity-50' : ''
                                        }`}
                                    />
                                    <label className="flex items-center space-x-2 text-sm text-gray-300">
                                        <input
                                            type="checkbox"
                                            checked={responses.time_known !== false}
                                            onChange={(e) => updateResponse('time_known', e.target.checked)}
                                            className="w-4 h-4 rounded border-white/30 bg-white/10 text-blue-400 focus:ring-blue-400"
                                        />
                                        <span>Exact time known</span>
                                    </label>
                                    <p className="text-xs text-gray-400">Auto-filled with current time</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Route Information */}
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                        <h3 className="text-lg font-semibold text-white mb-4">Route Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Route Type</label>
                                <select
                                    value={responses.route_type || ''}
                                    onChange={(e) => updateResponse('route_type', e.target.value)}
                                    className="w-full px-4 py-2 bg-white/10 border border-white/30 rounded-lg text-white focus:border-blue-400 focus:outline-none"
                                >
                                    <option value="">Select route type...</option>
                                    <option value="service">Service Route</option>
                                    <option value="school">School Service</option>
                                    <option value="special">Special Service</option>
                                    <option value="out_of_service">Out of Service</option>
                                    <option value="depot_movement">Depot Movement</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Route Number</label>
                                <input
                                    type="text"
                                    value={responses.route_number || ''}
                                    onChange={(e) => updateResponse('route_number', e.target.value)}
                                    placeholder="e.g., X10, 21, 307"
                                    className="w-full px-4 py-2 bg-white/10 border border-white/30 rounded-lg text-white placeholder-white/50 focus:border-blue-400 focus:outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Tracerit External Report Button */}
                    <div className="bg-purple-500/20 backdrop-blur-sm rounded-lg p-6 border border-purple-400/30">
                        <h3 className="text-lg font-semibold text-purple-200 mb-4">📋 External Incident Reporting</h3>
                        <p className="text-purple-300/80 text-sm mb-4">
                            For detailed incident reporting and tracking, please complete the Tracerit incident form.
                        </p>
                        <button
                            onClick={() => window.open('https://secure.tracerit.com/gne/pages/incident.aspx?is_partial=True&mode=add&hm_id=hm_16&id=132&from=131', '_blank')}
                            className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            <FileText className="w-5 h-5" />
                            Open Tracerit Incident Report Form
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                        </button>
                        <p className="text-purple-300/60 text-xs mt-2">
                            This will open in a new window. Remember to complete within 24 hours.
                        </p>
                    </div>

                    <div className="flex justify-between">
                        <button
                            onClick={onPrevious}
                            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
                        >
                            Previous Step
                        </button>
                        <button
                            onClick={onNext}
                            disabled={!responses.incident_date}
                            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Continue to Location Details
                        </button>
                    </div>
                </div>
            );

        case 4:
            return (
                <div className="space-y-6">
                    <div className="text-center">
                        <div className="mx-auto w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                            <MapPin className="w-8 h-8 text-red-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">📍 Location & Vehicle Information</h2>
                        <p className="text-gray-300">Record the incident location and vehicle details.</p>
                    </div>
                    
                    {/* Location Auto-populated Notice */}
                    {(locationData.coordinates || responses.location_captured) && (
                        <div className="bg-green-500/20 backdrop-blur-sm rounded-lg p-4 border border-green-400/30">
                            <div className="flex items-center space-x-3">
                                <CheckCircle className="w-5 h-5 text-green-400" />
                                <div>
                                    <p className="text-green-200 font-medium">Location Automatically Captured</p>
                                    <p className="text-green-300/70 text-sm">We've detected the breakdown location from the incident report. Please verify and adjust if needed.</p>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {/* Location Description */}
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                        <h3 className="text-lg font-semibold text-white mb-4">Incident Location</h3>
                        {locationData.isLoading && (
                            <div className="bg-blue-500/20 rounded-lg p-3 mb-4 flex items-center space-x-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-400 border-t-transparent"></div>
                                <p className="text-blue-300 text-sm">Retrieving location details from breakdown report...</p>
                            </div>
                        )}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Precise Location/Landmark</label>
                                <input
                                    type="text"
                                    value={responses.precise_location || ''}
                                    onChange={(e) => updateResponse('precise_location', e.target.value)}
                                    placeholder="e.g., Outside Central Station, Junction of High Street and Market Street"
                                    className="w-full px-4 py-2 bg-white/10 border border-white/30 rounded-lg text-white placeholder-white/50 focus:border-blue-400 focus:outline-none"
                                />
                                {locationData.address && !responses.precise_location && (
                                    <p className="text-xs text-gray-400 mt-1">Suggested: {locationData.address}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Road Name</label>
                                <input
                                    type="text"
                                    value={responses.road_name || ''}
                                    onChange={(e) => updateResponse('road_name', e.target.value)}
                                    placeholder="e.g., A1 Newcastle Western Bypass"
                                    className="w-full px-4 py-2 bg-white/10 border border-white/30 rounded-lg text-white placeholder-white/50 focus:border-blue-400 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Locality/Area</label>
                                <input
                                    type="text"
                                    value={responses.locality || ''}
                                    onChange={(e) => updateResponse('locality', e.target.value)}
                                    placeholder="e.g., Newcastle City Centre, Team Valley"
                                    className="w-full px-4 py-2 bg-white/10 border border-white/30 rounded-lg text-white placeholder-white/50 focus:border-blue-400 focus:outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Map Integration */}
                    <div className="bg-blue-500/20 backdrop-blur-sm rounded-lg p-6 border border-blue-400/30">
                        <h3 className="text-lg font-semibold text-blue-200 mb-4">🗺️ Location Map</h3>
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                            {((responses.latitude && responses.longitude) || locationData.coordinates) ? (
                                <div>
                                    <div className="bg-blue-900/50 rounded-lg p-4 mb-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="text-blue-200 font-medium">📍 Incident Location Coordinates</p>
                                            <button
                                                onClick={() => {
                                                    // Refresh location from breakdown data
                                                    const lat = responses.latitude || locationData.coordinates?.lat;
                                                    const lng = responses.longitude || locationData.coordinates?.lng;
                                                    if (lat && lng) {
                                                        reverseGeocode(lat, lng);
                                                    }
                                                }}
                                                className="text-blue-300 hover:text-blue-200 text-sm underline"
                                            >
                                                Refresh address
                                            </button>
                                        </div>
                                        <p className="text-blue-300 font-mono text-sm">
                                            Lat: {(responses.latitude || locationData.coordinates?.lat)?.toFixed(6)}, 
                                            Lng: {(responses.longitude || locationData.coordinates?.lng)?.toFixed(6)}
                                        </p>
                                        <p className="text-blue-300/60 text-xs mt-1">Coordinates from breakdown incident report</p>
                                    </div>
                                    
                                    {/* Simple map visualization placeholder */}
                                    <div className="h-48 bg-gray-800/50 rounded-lg flex items-center justify-center relative overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-blue-700/20"></div>
                                        <div className="text-center z-10">
                                            <MapPin className="w-12 h-12 text-blue-400 mx-auto mb-2" />
                                            <p className="text-blue-300 text-sm">Incident location marked on map</p>
                                            <a 
                                                href={`https://www.openstreetmap.org/?mlat=${responses.latitude || locationData.coordinates?.lat}&mlon=${responses.longitude || locationData.coordinates?.lng}#map=17/${responses.latitude || locationData.coordinates?.lat}/${responses.longitude || locationData.coordinates?.lng}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-400 hover:text-blue-300 text-sm underline mt-2 inline-block"
                                            >
                                                View on OpenStreetMap →
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-48 flex items-center justify-center">
                                    <div className="text-center">
                                        <MapPin className="w-12 h-12 text-blue-300 mx-auto mb-3" />
                                        <p className="text-blue-300/80 text-sm mb-2">No location data available from breakdown report</p>
                                        <p className="text-blue-300/60 text-xs">Please enter the location details manually above</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Vehicle Information */}
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                        <h3 className="text-lg font-semibold text-white mb-4">Vehicle Information</h3>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Vehicle Type</label>
                                    <select
                                        value={responses.vehicle_type || ''}
                                        onChange={(e) => updateResponse('vehicle_type', e.target.value)}
                                        className="w-full px-4 py-2 bg-white/10 border border-white/30 rounded-lg text-white focus:border-blue-400 focus:outline-none"
                                    >
                                        <option value="">Select vehicle type...</option>
                                        <option value="single_decker">Single Decker Bus</option>
                                        <option value="double_decker">Double Decker Bus</option>
                                        <option value="coach">Coach</option>
                                        <option value="minibus">Minibus</option>
                                        <option value="service_vehicle">Service Vehicle</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Fleet Number</label>
                                    <input
                                        type="text"
                                        value={responses.fleet_number || ''}
                                        onChange={(e) => updateResponse('fleet_number', e.target.value)}
                                        placeholder="e.g., 6301, 5410"
                                        className="w-full px-4 py-2 bg-white/10 border border-white/30 rounded-lg text-white placeholder-white/50 focus:border-blue-400 focus:outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Employee Information */}
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                        <h3 className="text-lg font-semibold text-white mb-4">Employee Information</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Employee Type</label>
                                <select
                                    value={responses.employee_type || ''}
                                    onChange={(e) => updateResponse('employee_type', e.target.value)}
                                    className="w-full px-4 py-2 bg-white/10 border border-white/30 rounded-lg text-white focus:border-blue-400 focus:outline-none"
                                >
                                    <option value="">Select employee type...</option>
                                    <option value="driver">Driver</option>
                                    <option value="conductor">Conductor</option>
                                    <option value="engineer">Engineer</option>
                                    <option value="supervisor">Supervisor</option>
                                    <option value="other">Other Staff</option>
                                </select>
                            </div>
                            <div>
                                <label className="flex items-center space-x-2 text-sm text-gray-300">
                                    <input
                                        type="checkbox"
                                        checked={responses.employee_injury || false}
                                        onChange={(e) => updateResponse('employee_injury', e.target.checked)}
                                        className="w-4 h-4 rounded border-white/30 bg-white/10 text-red-400 focus:ring-red-400"
                                    />
                                    <span>Employee injury occurred</span>
                                </label>
                            </div>
                            {responses.employee_injury && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Injury Details</label>
                                    <textarea
                                        value={responses.injury_details || ''}
                                        onChange={(e) => updateResponse('injury_details', e.target.value)}
                                        placeholder="Describe the nature and extent of injuries..."
                                        rows="3"
                                        className="w-full px-4 py-2 bg-white/10 border border-white/30 rounded-lg text-white placeholder-white/50 focus:border-blue-400 focus:outline-none"
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-between">
                        <button
                            onClick={onPrevious}
                            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
                        >
                            Previous Step
                        </button>
                        <button
                            onClick={onNext}
                            disabled={!responses.precise_location || !responses.vehicle_type || !responses.employee_type}
                            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Continue to Vehicle Assessment
                        </button>
                    </div>
                </div>
            );

        case 5:
            return (
                <div className="space-y-6">
                    <div className="text-center">
                        <div className="mx-auto w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                            <Tool className="w-8 h-8 text-red-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">🚗 Vehicle Safety & Damage Assessment</h2>
                        <p className="text-gray-300">Comprehensive evaluation of vehicle condition and roadworthiness following incident.</p>
                    </div>
                    
                    <div className="bg-red-500/20 backdrop-blur-sm rounded-lg p-6 border border-red-400/30">
                        <h3 className="text-lg font-semibold text-red-200 mb-4">🔍 EVALUATE THE BUS DAMAGE</h3>
                        <p className="text-red-300/80 text-sm leading-relaxed mb-4">
                            "Can you describe any damage to the bus? Are there any sharp edges, loose parts, or damaged lights?"
                        </p>
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                            <h4 className="font-semibold text-red-200 mb-2">If damage is reported:</h4>
                            <p className="text-red-300/90 text-sm mb-2">Advise the driver to input it into Tranzaura and consult a qualified engineering colleague.</p>
                            <p className="text-red-300/90 text-sm">They'll decide whether the bus can:
                            • Continue in service
                            • Return to the depot out of service
                            • Remain where it is whilst an engineer attends</p>
                        </div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                        <h3 className="text-lg font-semibold text-white mb-4">Vehicle Damage Assessment</h3>
                        <p className="text-gray-300 text-sm mb-4">What is the extent of damage to the vehicle following the incident?</p>
                        <div className="space-y-3">
                            <button
                                onClick={() => updateResponse('vehicle_damage', 'no_damage')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.vehicle_damage === 'no_damage'
                                        ? 'border-green-400 bg-green-400/20 text-green-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-green-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.vehicle_damage === 'no_damage' ? 'border-green-400 bg-green-400' : 'border-white/50'
                                    }`}>
                                        {responses.vehicle_damage === 'no_damage' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">✅ No visible damage</span>
                                        <p className="text-sm text-gray-300 mt-1">Vehicle appears unharmed by the incident</p>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => updateResponse('vehicle_damage', 'minor_cosmetic_safe')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.vehicle_damage === 'minor_cosmetic_safe'
                                        ? 'border-green-400 bg-green-400/20 text-green-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-green-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.vehicle_damage === 'minor_cosmetic_safe' ? 'border-green-400 bg-green-400' : 'border-white/50'
                                    }`}>
                                        {responses.vehicle_damage === 'minor_cosmetic_safe' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">✅ Minor cosmetic damage (no hazards)</span>
                                        <p className="text-sm text-gray-300 mt-1">Scratches, paint damage - no sharp edges or loose parts</p>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => updateResponse('vehicle_damage', 'minor_cosmetic_hazards')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.vehicle_damage === 'minor_cosmetic_hazards'
                                        ? 'border-yellow-400 bg-yellow-400/20 text-yellow-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-yellow-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.vehicle_damage === 'minor_cosmetic_hazards' ? 'border-yellow-400 bg-yellow-400' : 'border-white/50'
                                    }`}>
                                        {responses.vehicle_damage === 'minor_cosmetic_hazards' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">⚠️ Minor damage with hazards</span>
                                        <p className="text-sm text-gray-300 mt-1">Sharp edges, loose panels, or potential hazards present</p>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => updateResponse('vehicle_damage', 'significant_damage')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.vehicle_damage === 'significant_damage'
                                        ? 'border-red-400 bg-red-400/20 text-red-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.vehicle_damage === 'significant_damage' ? 'border-red-400 bg-red-400' : 'border-white/50'
                                    }`}>
                                        {responses.vehicle_damage === 'significant_damage' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">🚨 Significant structural damage</span>
                                        <p className="text-sm text-gray-300 mt-1">Major body damage, broken windows, or structural issues</p>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => updateResponse('vehicle_damage', 'safety_critical')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.vehicle_damage === 'safety_critical'
                                        ? 'border-red-400 bg-red-400/20 text-red-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.vehicle_damage === 'safety_critical' ? 'border-red-400 bg-red-400' : 'border-white/50'
                                    }`}>
                                        {responses.vehicle_damage === 'safety_critical' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">🚨 Safety-critical damage</span>
                                        <p className="text-sm text-gray-300 mt-1">Damage to brakes, steering, lights, or other safety systems</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>
                        
                    <div className="bg-blue-500/20 backdrop-blur-sm rounded-lg p-6 border border-blue-400/30">
                        <h3 className="font-semibold text-blue-200 mb-3">Vehicle Operational Status</h3>
                        <p className="text-blue-300/80 text-sm mb-4">Is the vehicle currently safe to operate on public roads?</p>
                        <div className="space-y-3">
                            <button
                                onClick={() => updateResponse('operational_status', 'fully_operational')}
                                className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                                    responses.operational_status === 'fully_operational'
                                        ? 'border-blue-400 bg-blue-400/20 text-blue-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-blue-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                        responses.operational_status === 'fully_operational' ? 'border-blue-400 bg-blue-400' : 'border-white/50'
                                    }`}>
                                        {responses.operational_status === 'fully_operational' && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">✅ Fully operational</span>
                                        <p className="text-sm text-gray-300 mt-1">All systems functioning normally, safe to continue</p>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => updateResponse('operational_status', 'limited_operation')}
                                className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                                    responses.operational_status === 'limited_operation'
                                        ? 'border-blue-400 bg-blue-400/20 text-blue-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-blue-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                        responses.operational_status === 'limited_operation' ? 'border-blue-400 bg-blue-400' : 'border-white/50'
                                    }`}>
                                        {responses.operational_status === 'limited_operation' && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">⚠️ Limited operation possible</span>
                                        <p className="text-sm text-gray-300 mt-1">Can continue to depot but requires immediate attention</p>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => updateResponse('operational_status', 'unsafe_to_operate')}
                                className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                                    responses.operational_status === 'unsafe_to_operate'
                                        ? 'border-blue-400 bg-blue-400/20 text-blue-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-blue-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                        responses.operational_status === 'unsafe_to_operate' ? 'border-blue-400 bg-blue-400' : 'border-white/50'
                                    }`}>
                                        {responses.operational_status === 'unsafe_to_operate' && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">🚨 Unsafe to operate</span>
                                        <p className="text-sm text-gray-300 mt-1">Vehicle must remain stationary pending engineering assessment</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>
                        
                    <div className="bg-purple-500/20 backdrop-blur-sm rounded-lg p-6 border border-purple-400/30">
                        <h3 className="font-semibold text-purple-200 mb-3">Tranzaura System Status</h3>
                        <p className="text-purple-300/80 text-sm mb-4">Has the incident and any defects been recorded in the Tranzaura system?</p>
                        <div className="space-y-3">
                            <button
                                onClick={() => updateResponse('tranzaura_recorded', 'already_recorded')}
                                className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                                    responses.tranzaura_recorded === 'already_recorded'
                                        ? 'border-purple-400 bg-purple-400/20 text-purple-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-purple-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                        responses.tranzaura_recorded === 'already_recorded' ? 'border-purple-400 bg-purple-400' : 'border-white/50'
                                    }`}>
                                        {responses.tranzaura_recorded === 'already_recorded' && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">✅ Already recorded in Tranzaura</span>
                                        <p className="text-sm text-gray-300 mt-1">All defects and incidents properly documented</p>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => updateResponse('tranzaura_recorded', 'needs_recording')}
                                className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                                    responses.tranzaura_recorded === 'needs_recording'
                                        ? 'border-purple-400 bg-purple-400/20 text-purple-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-purple-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                        responses.tranzaura_recorded === 'needs_recording' ? 'border-purple-400 bg-purple-400' : 'border-white/50'
                                    }`}>
                                        {responses.tranzaura_recorded === 'needs_recording' && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">⚠️ Needs recording in Tranzaura</span>
                                        <p className="text-sm text-gray-300 mt-1">Reminder to driver to record all defects</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>
                    
                    {/* Critical Engineering Warnings */}
                    {(responses.vehicle_damage === 'significant_damage' || responses.vehicle_damage === 'safety_critical' ||
                      responses.operational_status === 'unsafe_to_operate') && (
                        <div className="bg-red-500/30 backdrop-blur-sm rounded-lg p-6 border border-red-400/50">
                            <div className="flex items-start space-x-4">
                                <AlertTriangle className="w-8 h-8 text-red-400 mt-1" />
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-red-200 mb-3">🚨 VEHICLE MUST NOT CONTINUE</h3>
                                    <div className="text-red-300/90 space-y-2">
                                        <p className="font-semibold">Safety-critical damage detected - Immediate engineering required</p>
                                        <div className="bg-white/10 backdrop-blur-sm rounded p-4 mt-4">
                                            <h4 className="font-semibold text-red-200 mb-2">Required Actions:</h4>
                                            <ul className="list-disc list-inside space-y-1 text-red-300/90 text-sm">
                                                <li>Stop vehicle immediately in safe location</li>
                                                <li>Turn off engine and apply parking brake</li>
                                                <li>Remove all passengers safely</li>
                                                <li>Contact engineering for immediate attendance</li>
                                                <li>Arrange replacement vehicle for passengers</li>
                                                <li>Do not attempt to move vehicle</li>
                                                <li>Mark vehicle as PG9 risk - potential prohibition</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    <div className="flex justify-between">
                        <button
                            onClick={onPrevious}
                            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
                        >
                            Previous Step
                        </button>
                        <button
                            onClick={onNext}
                            disabled={!responses.vehicle_damage || !responses.operational_status || !responses.tranzaura_recorded}
                            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Continue to Environmental Assessment
                        </button>
                    </div>
                </div>
            );

        case 6:
            return (
                <div className="space-y-6">
                    <div className="text-center">
                        <div className="mx-auto w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mb-4">
                            <AlertTriangle className="w-8 h-8 text-orange-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">🔥 Environmental & Fire Assessment</h2>
                        <p className="text-gray-300">Evaluate environmental impact and fire safety concerns.</p>
                    </div>
                    
                    {/* Fire Involvement */}
                    <div className="bg-orange-500/20 backdrop-blur-sm rounded-lg p-6 border border-orange-400/30">
                        <h3 className="text-lg font-semibold text-orange-200 mb-4">🔥 Fire Involvement</h3>
                        <p className="text-orange-300/80 text-sm mb-4">Was there any fire involvement in this incident?</p>
                        <div className="space-y-3">
                            <button
                                onClick={() => updateResponse('fire_involvement', 'no_fire')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.fire_involvement === 'no_fire'
                                        ? 'border-green-400 bg-green-400/20 text-green-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-green-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.fire_involvement === 'no_fire' ? 'border-green-400 bg-green-400' : 'border-white/50'
                                    }`}>
                                        {responses.fire_involvement === 'no_fire' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">✅ No fire involvement</span>
                                        <p className="text-sm text-gray-300 mt-1">No fire or smoke reported</p>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => updateResponse('fire_involvement', 'smoke_only')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.fire_involvement === 'smoke_only'
                                        ? 'border-yellow-400 bg-yellow-400/20 text-yellow-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-yellow-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.fire_involvement === 'smoke_only' ? 'border-yellow-400 bg-yellow-400' : 'border-white/50'
                                    }`}>
                                        {responses.fire_involvement === 'smoke_only' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">💨 Smoke only (no flames)</span>
                                        <p className="text-sm text-gray-300 mt-1">Smoke detected but no visible flames</p>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => updateResponse('fire_involvement', 'small_fire_extinguished')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.fire_involvement === 'small_fire_extinguished'
                                        ? 'border-orange-400 bg-orange-400/20 text-orange-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-orange-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.fire_involvement === 'small_fire_extinguished' ? 'border-orange-400 bg-orange-400' : 'border-white/50'
                                    }`}>
                                        {responses.fire_involvement === 'small_fire_extinguished' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">🧯 Small fire - extinguished</span>
                                        <p className="text-sm text-gray-300 mt-1">Minor fire that has been put out</p>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => updateResponse('fire_involvement', 'active_fire')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.fire_involvement === 'active_fire'
                                        ? 'border-red-400 bg-red-400/20 text-red-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.fire_involvement === 'active_fire' ? 'border-red-400 bg-red-400' : 'border-white/50'
                                    }`}>
                                        {responses.fire_involvement === 'active_fire' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">🚒 Active fire - fire service required</span>
                                        <p className="text-sm text-gray-300 mt-1">Fire in progress requiring emergency response</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Environmental Damage */}
                    <div className="bg-green-500/20 backdrop-blur-sm rounded-lg p-6 border border-green-400/30">
                        <h3 className="text-lg font-semibold text-green-200 mb-4">🌿 Environmental Impact</h3>
                        <p className="text-green-300/80 text-sm mb-4">Is there any environmental damage or nuisance?</p>
                        <div className="space-y-3">
                            <button
                                onClick={() => updateResponse('environmental_damage', 'none')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.environmental_damage === 'none'
                                        ? 'border-green-400 bg-green-400/20 text-green-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-green-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.environmental_damage === 'none' ? 'border-green-400 bg-green-400' : 'border-white/50'
                                    }`}>
                                        {responses.environmental_damage === 'none' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">✅ No environmental impact</span>
                                        <p className="text-sm text-gray-300 mt-1">No spillages or environmental concerns</p>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => updateResponse('environmental_damage', 'minor_spillage')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.environmental_damage === 'minor_spillage'
                                        ? 'border-yellow-400 bg-yellow-400/20 text-yellow-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-yellow-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.environmental_damage === 'minor_spillage' ? 'border-yellow-400 bg-yellow-400' : 'border-white/50'
                                    }`}>
                                        {responses.environmental_damage === 'minor_spillage' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">💧 Minor fluid spillage</span>
                                        <p className="text-sm text-gray-300 mt-1">Small oil, fuel, or coolant leak</p>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => updateResponse('environmental_damage', 'major_spillage')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.environmental_damage === 'major_spillage'
                                        ? 'border-red-400 bg-red-400/20 text-red-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.environmental_damage === 'major_spillage' ? 'border-red-400 bg-red-400' : 'border-white/50'
                                    }`}>
                                        {responses.environmental_damage === 'major_spillage' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">🔴 Major spillage</span>
                                        <p className="text-sm text-gray-300 mt-1">Significant fuel or oil spill requiring cleanup</p>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => updateResponse('environmental_damage', 'water_course_contamination')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.environmental_damage === 'water_course_contamination'
                                        ? 'border-red-400 bg-red-400/20 text-red-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.environmental_damage === 'water_course_contamination' ? 'border-red-400 bg-red-400' : 'border-white/50'
                                    }`}>
                                        {responses.environmental_damage === 'water_course_contamination' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">🌊 Water course contamination risk</span>
                                        <p className="text-sm text-gray-300 mt-1">Spillage near drains, rivers, or water sources</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Critical Environmental Warnings */}
                    {(responses.fire_involvement === 'active_fire' || responses.environmental_damage === 'major_spillage' || 
                      responses.environmental_damage === 'water_course_contamination') && (
                        <div className="bg-red-500/30 backdrop-blur-sm rounded-lg p-6 border border-red-400/50">
                            <div className="flex items-start space-x-4">
                                <AlertTriangle className="w-8 h-8 text-red-400 mt-1" />
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-red-200 mb-3">🚨 EMERGENCY ENVIRONMENTAL RESPONSE</h3>
                                    <div className="text-red-300/90 space-y-2">
                                        <p className="font-semibold">Environmental emergency detected - Immediate action required</p>
                                        <div className="bg-white/10 backdrop-blur-sm rounded p-4 mt-4">
                                            <h4 className="font-semibold text-red-200 mb-2">Mandatory Actions:</h4>
                                            <ul className="list-disc list-inside space-y-1 text-red-300/90 text-sm">
                                                {responses.fire_involvement === 'active_fire' && (
                                                    <>
                                                        <li>Call fire service immediately (999)</li>
                                                        <li>Evacuate all passengers and personnel</li>
                                                        <li>Maintain safe distance from vehicle</li>
                                                    </>
                                                )}
                                                {(responses.environmental_damage === 'major_spillage' || 
                                                  responses.environmental_damage === 'water_course_contamination') && (
                                                    <>
                                                        <li>Contact environmental agency</li>
                                                        <li>Deploy spill kit if available and safe</li>
                                                        <li>Prevent spillage reaching drains</li>
                                                        <li>Document extent of contamination</li>
                                                    </>
                                                )}
                                                <li>Notify depot management immediately</li>
                                                <li>Keep public away from affected area</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-between">
                        <button
                            onClick={onPrevious}
                            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
                        >
                            Previous Step
                        </button>
                        <button
                            onClick={onNext}
                            disabled={!responses.fire_involvement || !responses.environmental_damage}
                            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Continue to Follow-up Actions
                        </button>
                    </div>
                </div>
            );

        case 7:
            return (
                <div className="space-y-6">
                    <div className="text-center">
                        <div className="mx-auto w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                            <FileText className="w-8 h-8 text-red-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">📋 Follow-up Actions & Completion</h2>
                        <p className="text-gray-300">Final steps and documentation requirements for the incident.</p>
                    </div>
                    
                    <div className="bg-red-500/20 backdrop-blur-sm rounded-lg p-6 border border-red-400/30">
                        <h3 className="text-lg font-semibold text-red-200 mb-4">🎯 GUIDE THE DRIVER THROUGH FOLLOW-UP ACTIONS</h3>
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                            <h4 className="font-semibold text-red-200 mb-2">Remind the driver to:</h4>
                            <ul className="list-disc list-inside space-y-1 text-red-300/90 text-sm">
                                <li>Complete all necessary reports including a TracerIt report within 24 hours</li>
                                <li>Record any defects immediately on the Tranzaura System</li>
                                <li>Provide reassurance and support</li>
                                <li>Escalate to senior managers if required</li>
                                <li>Report all personal injuries</li>
                                <li>If collision involved third party and driver not present, leave a bump card</li>
                            </ul>
                        </div>
                    </div>

                    {/* Action Checklist */}
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                        <h3 className="text-lg font-semibold text-white mb-4">✅ Action Checklist</h3>
                        <div className="space-y-3">
                            <label className="flex items-center space-x-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={responses.tracerit_report || false}
                                    onChange={(e) => updateResponse('tracerit_report', e.target.checked)}
                                    className="w-5 h-5 rounded border-white/30 bg-white/10 text-green-400 focus:ring-green-400"
                                />
                                <span className="text-white">TracerIt report to be completed within 24 hours</span>
                            </label>
                            <label className="flex items-center space-x-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={responses.bump_card_left || false}
                                    onChange={(e) => updateResponse('bump_card_left', e.target.checked)}
                                    className="w-5 h-5 rounded border-white/30 bg-white/10 text-green-400 focus:ring-green-400"
                                />
                                <span className="text-white">Bump card left (if third party not present)</span>
                            </label>
                            <label className="flex items-center space-x-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={responses.senior_management_notified || false}
                                    onChange={(e) => updateResponse('senior_management_notified', e.target.checked)}
                                    className="w-5 h-5 rounded border-white/30 bg-white/10 text-green-400 focus:ring-green-400"
                                />
                                <span className="text-white">Senior management notified (if required)</span>
                            </label>
                            <label className="flex items-center space-x-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={responses.injuries_reported || false}
                                    onChange={(e) => updateResponse('injuries_reported', e.target.checked)}
                                    className="w-5 h-5 rounded border-white/30 bg-white/10 text-green-400 focus:ring-green-400"
                                />
                                <span className="text-white">All personal injuries reported</span>
                            </label>
                            <label className="flex items-center space-x-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={responses.driver_reassured || false}
                                    onChange={(e) => updateResponse('driver_reassured', e.target.checked)}
                                    className="w-5 h-5 rounded border-white/30 bg-white/10 text-green-400 focus:ring-green-400"
                                />
                                <span className="text-white">Driver reassured and supported</span>
                            </label>
                        </div>
                    </div>

                    {/* Final Decision */}
                    <div className="bg-yellow-500/20 backdrop-blur-sm rounded-lg p-6 border border-yellow-400/30">
                        <h3 className="text-lg font-semibold text-yellow-200 mb-4">🎯 Final Decision & Next Steps</h3>
                        <p className="text-yellow-300/80 text-sm mb-4">Based on the assessment, what is the overall decision for this incident?</p>
                        <div className="space-y-3">
                            <button
                                onClick={() => updateResponse('final_decision', 'continue_service')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.final_decision === 'continue_service'
                                        ? 'border-green-400 bg-green-400/20 text-green-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-green-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.final_decision === 'continue_service' ? 'border-green-400 bg-green-400' : 'border-white/50'
                                    }`}>
                                        {responses.final_decision === 'continue_service' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">✅ CONTINUE - Vehicle can remain in service</span>
                                        <p className="text-sm text-gray-300 mt-1">Minor incident, no safety concerns, documentation complete</p>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => updateResponse('final_decision', 'changeover_required')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.final_decision === 'changeover_required'
                                        ? 'border-yellow-400 bg-yellow-400/20 text-yellow-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-yellow-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.final_decision === 'changeover_required' ? 'border-yellow-400 bg-yellow-400' : 'border-white/50'
                                    }`}>
                                        {responses.final_decision === 'changeover_required' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">⚠️ AMBER - Changeover at convenient point</span>
                                        <p className="text-sm text-gray-300 mt-1">Vehicle needs attention but can continue temporarily</p>
                                    </div>
                                </div>
                            </button>
                            <button
                                onClick={() => updateResponse('final_decision', 'stop_immediately')}
                                className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                    responses.final_decision === 'stop_immediately'
                                        ? 'border-red-400 bg-red-400/20 text-red-200'
                                        : 'border-white/30 bg-white/10 text-white hover:border-red-400/50'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        responses.final_decision === 'stop_immediately' ? 'border-red-400 bg-red-400' : 'border-white/50'
                                    }`}>
                                        {responses.final_decision === 'stop_immediately' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                    </div>
                                    <div>
                                        <span className="font-medium">🚨 STOP - Vehicle must not continue</span>
                                        <p className="text-sm text-gray-300 mt-1">Serious safety concerns, engineering attendance required</p>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Additional Notes */}
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
                        <h3 className="text-lg font-semibold text-white mb-4">📝 Additional Notes</h3>
                        <textarea
                            value={responses.additional_notes || ''}
                            onChange={(e) => updateResponse('additional_notes', e.target.value)}
                            placeholder="Any additional information about the incident, actions taken, or follow-up required..."
                            rows="4"
                            className="w-full px-4 py-2 bg-white/10 border border-white/30 rounded-lg text-white placeholder-white/50 focus:border-blue-400 focus:outline-none"
                        />
                    </div>

                    {/* Tracerit External Report Button */}
                    <div className="bg-purple-500/20 backdrop-blur-sm rounded-lg p-6 border border-purple-400/30">
                        <h3 className="text-lg font-semibold text-purple-200 mb-4">📋 External Incident Reporting</h3>
                        <p className="text-purple-300/80 text-sm mb-4">
                            For detailed incident reporting and tracking, please complete the Tracerit incident form.
                        </p>
                        <button
                            onClick={() => window.open('https://secure.tracerit.com/gne/pages/incident.aspx?is_partial=True&mode=add&hm_id=hm_16&id=132&from=131', '_blank')}
                            className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            <FileText className="w-5 h-5" />
                            Open Tracerit Incident Report Form
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                        </button>
                        <p className="text-purple-300/60 text-xs mt-2">
                            This will open in a new window. Remember to complete within 24 hours.
                        </p>
                    </div>

                    {/* Incident Summary */}
                    <div className="bg-blue-500/20 backdrop-blur-sm rounded-lg p-6 border border-blue-400/30">
                        <h3 className="text-lg font-semibold text-blue-200 mb-4">📊 Incident Summary</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-blue-300/80">Incident Number:</span>
                                <p className="text-blue-200 font-semibold">{responses.incident_number}</p>
                            </div>
                            <div>
                                <span className="text-blue-300/80">Date/Time:</span>
                                <p className="text-blue-200 font-semibold">{responses.incident_date} {responses.incident_time}</p>
                            </div>
                            <div>
                                <span className="text-blue-300/80">Location:</span>
                                <p className="text-blue-200 font-semibold">{responses.precise_location || 'Not specified'}</p>
                            </div>
                            <div>
                                <span className="text-blue-300/80">Vehicle:</span>
                                <p className="text-blue-200 font-semibold">{responses.fleet_number || 'Not specified'}</p>
                            </div>
                            <div>
                                <span className="text-blue-300/80">Category:</span>
                                <p className="text-blue-200 font-semibold">{responses.incident_category?.replace(/_/g, ' ') || 'Not specified'}</p>
                            </div>
                            <div>
                                <span className="text-blue-300/80">Decision:</span>
                                <p className={`font-semibold ${
                                    responses.final_decision === 'continue_service' ? 'text-green-200' :
                                    responses.final_decision === 'changeover_required' ? 'text-yellow-200' :
                                    'text-red-200'
                                }`}>
                                    {responses.final_decision?.replace(/_/g, ' ').toUpperCase() || 'PENDING'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-between">
                        <button
                            onClick={onPrevious}
                            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
                        >
                            Previous Step
                        </button>
                        <button
                            onClick={() => {
                                // Complete the assessment
                                onComplete(
                                    responses.final_decision === 'stop_immediately' ? 'STOP' :
                                    responses.final_decision === 'changeover_required' ? 'AMBER' : 'CONTINUE',
                                    responses.additional_notes || ''
                                );
                            }}
                            disabled={!responses.final_decision}
                            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Complete Incident Report
                        </button>
                    </div>
                </div>
            );

        default:
            return (
                <div className="space-y-6">
                    <div className="text-center">
                        <div className="mx-auto w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                            <AlertTriangle className="w-8 h-8 text-red-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Invalid Step</h2>
                        <p className="text-gray-300">Something went wrong. Please restart the assessment.</p>
                    </div>
                    <div className="flex justify-center">
                        <button
                            onClick={() => window.location.reload()}
                            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors"
                        >
                            Restart Assessment
                        </button>
                    </div>
                </div>
            );
        }
    };

    return renderStep();
};

export default RoadTrafficIncidentsWizard;
