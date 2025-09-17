// Incident Information Collection Component
// Collects incident category, auto-fills date/time, and route information

import React, { useState, useEffect } from 'react';
import * as Icons from './icons.jsx';

const IncidentInfoStep = ({ responses, updateResponse, onNext, onPrevious }) => {
    const { FileText, MapPin, Calendar, Clock, Route, Hash, AlertTriangle, Shield } = Icons;
    
    // Initialize date/time when component mounts (when wizard begins)
    useEffect(() => {
        console.log('IncidentInfoStep useEffect running');
        console.log('Current responses:', responses);
        
        // Only set if not already set (preserves values if user navigates back)
        if (!responses.incidentDate || !responses.incidentTime) {
            const now = new Date();
            
            // Format date as YYYY-MM-DD for input field
            const date = now.toISOString().split('T')[0];
            
            // Format time as HH:MM for input field
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const time = `${hours}:${minutes}`;
            
            console.log('Auto-filling date/time:', { date, time });
            
            // Update responses with current date/time
            updateResponse('incidentDate', date);
            updateResponse('incidentTime', time);
            updateResponse('exactTimeKnown', true);
        }
    }, [responses.incidentDate, responses.incidentTime, updateResponse]); // Proper dependencies
    
    const incidentCategories = [
        { 
            id: 'collision_moving', 
            icon: '🚗', 
            label: 'Collision - Moving Vehicle',
            selectedClasses: 'border-red-400 bg-red-400/20 text-white cursor-pointer transition-all',
            normalClasses: 'border-gray-600 bg-gray-800/50 text-gray-300 hover:border-gray-500 hover:bg-gray-700/50 transition-all cursor-pointer'
        },
        { 
            id: 'collision_stationary', 
            icon: '🏢', 
            label: 'Collision - Stationary Object',
            selectedClasses: 'border-orange-400 bg-orange-400/20 text-white cursor-pointer transition-all',
            normalClasses: 'border-gray-600 bg-gray-800/50 text-gray-300 hover:border-gray-500 hover:bg-gray-700/50 transition-all cursor-pointer'
        },
        { 
            id: 'pedestrian', 
            icon: '🚶', 
            label: 'Pedestrian Incident',
            selectedClasses: 'border-yellow-400 bg-yellow-400/20 text-white cursor-pointer transition-all',
            normalClasses: 'border-gray-600 bg-gray-800/50 text-gray-300 hover:border-gray-500 hover:bg-gray-700/50 transition-all cursor-pointer'
        },
        { 
            id: 'passenger', 
            icon: '👥', 
            label: 'Passenger Incident',
            selectedClasses: 'border-blue-400 bg-blue-400/20 text-white cursor-pointer transition-all',
            normalClasses: 'border-gray-600 bg-gray-800/50 text-gray-300 hover:border-gray-500 hover:bg-gray-700/50 transition-all cursor-pointer'
        },
        { 
            id: 'mechanical', 
            icon: '⚙️', 
            label: 'Mechanical Failure',
            selectedClasses: 'border-purple-400 bg-purple-400/20 text-white cursor-pointer transition-all',
            normalClasses: 'border-gray-600 bg-gray-800/50 text-gray-300 hover:border-gray-500 hover:bg-gray-700/50 transition-all cursor-pointer'
        },
        { 
            id: 'environmental', 
            icon: '🌿', 
            label: 'Environmental',
            selectedClasses: 'border-green-400 bg-green-400/20 text-white cursor-pointer transition-all',
            normalClasses: 'border-gray-600 bg-gray-800/50 text-gray-300 hover:border-gray-500 hover:bg-gray-700/50 transition-all cursor-pointer'
        },
        { 
            id: 'vandalism', 
            icon: '🛡️', 
            label: 'Vandalism',
            selectedClasses: 'border-pink-400 bg-pink-400/20 text-white cursor-pointer transition-all',
            normalClasses: 'border-gray-600 bg-gray-800/50 text-gray-300 hover:border-gray-500 hover:bg-gray-700/50 transition-all cursor-pointer'
        },
        { 
            id: 'other', 
            icon: '📦', 
            label: 'Other',
            selectedClasses: 'border-gray-400 bg-gray-400/20 text-white cursor-pointer transition-all',
            normalClasses: 'border-gray-600 bg-gray-800/50 text-gray-300 hover:border-gray-500 hover:bg-gray-700/50 transition-all cursor-pointer'
        }
    ];
    
    const routeTypes = [
        'Standard Service',
        'Express Service',
        'School Service',
        'Private Hire',
        'Not in Service',
        'Other'
    ];
    
    const isValid = () => {
        return responses.incidentCategory && 
               responses.incidentDate && 
               responses.incidentTime &&
               responses.routeType &&
               responses.routeNumber;
    };
    
    // Format date for display (dd/mm/yyyy)
    const formatDateForDisplay = (dateString) => {
        if (!dateString) return '';
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
    };
    
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-4">Incident Information</h2>
            
            {/* Incident Category */}
            <div>
                <h3 className="text-lg font-semibold text-white mb-3">Incident Category</h3>
                <p className="text-gray-300 text-sm mb-4">Select the most appropriate category:</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {incidentCategories.map(category => (
                        <button
                            key={category.id}
                            type="button"
                            onClick={() => {
                                console.log('Category clicked:', category.id);
                                updateResponse('incidentCategory', category.id);
                            }}
                            className={`p-4 rounded-lg border-2 transition-all text-left ${
                                responses.incidentCategory === category.id
                                    ? category.selectedClasses
                                    : category.normalClasses
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">{category.icon}</span>
                                <span className="font-medium">{category.label}</span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
            
            {/* Date & Time of Incident */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-600">
                <h3 className="text-lg font-semibold text-white mb-4">Date & Time of Incident</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            <Calendar className="inline w-4 h-4 mr-1" />
                            Incident Date
                        </label>
                        <input
                            type="date"
                            value={responses.incidentDate || new Date().toISOString().split('T')[0]}
                            onChange={(e) => updateResponse('incidentDate', e.target.value)}
                            className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <p className="text-xs text-gray-400 mt-1">
                            Displaying as: {formatDateForDisplay(responses.incidentDate || new Date().toISOString().split('T')[0])}
                        </p>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            <Clock className="inline w-4 h-4 mr-1" />
                            Incident Time
                        </label>
                        <input
                            type="time"
                            value={responses.incidentTime || `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`}
                            onChange={(e) => updateResponse('incidentTime', e.target.value)}
                            className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>
                
                <div className="mt-4">
                    <label className="flex items-center space-x-2 text-gray-300">
                        <input
                            type="checkbox"
                            checked={responses.exactTimeKnown || false}
                            onChange={(e) => updateResponse('exactTimeKnown', e.target.checked)}
                            className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
                        />
                        <span className="text-sm">Exact time known</span>
                    </label>
                </div>
                
                <div className="mt-3 p-3 bg-blue-500/20 rounded-lg border border-blue-400/30">
                    <p className="text-blue-200 text-sm">
                        ℹ️ Date and time have been automatically set to the current moment when this assessment began. 
                        Adjust if the incident occurred at a different time.
                    </p>
                </div>
            </div>
            
            {/* Route Information */}
            <div>
                <h3 className="text-lg font-semibold text-white mb-4">Route Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            <Route className="inline w-4 h-4 mr-1" />
                            Route Type
                        </label>
                        <select
                            value={responses.routeType || ''}
                            onChange={(e) => updateResponse('routeType', e.target.value)}
                            className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">Select route type...</option>
                            {routeTypes.map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            <Hash className="inline w-4 h-4 mr-1" />
                            Route Number
                        </label>
                        <input
                            type="text"
                            value={responses.routeNumber || ''}
                            onChange={(e) => updateResponse('routeNumber', e.target.value)}
                            className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="e.g., X10, 21, 307"
                        />
                    </div>
                </div>
            </div>
            
            {/* Tracerit External Report Button */}
            <div className="bg-purple-500/20 backdrop-blur-sm rounded-lg p-6 border border-purple-400/30">
                <h3 className="text-lg font-semibold text-purple-200 mb-3">📋 External Incident Reporting</h3>
                <p className="text-purple-300/80 text-sm mb-4">
                    For detailed incident reporting and tracking, complete the Tracerit form.
                </p>
                <button
                    onClick={() => window.open('https://secure.tracerit.com/gne/pages/incident.aspx?is_partial=True&mode=add&hm_id=hm_16&id=132&from=131', '_blank')}
                    className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                    <FileText className="w-5 h-5" />
                    Open Tracerit Incident Report
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                </button>
                <p className="text-purple-300/60 text-xs mt-2">
                    Opens in a new window. Complete within 24 hours.
                </p>
            </div>
            
            {/* Navigation buttons */}
            <div className="flex gap-4 pt-4">
                <button
                    onClick={onPrevious}
                    className="flex-1 py-3 px-6 rounded-lg font-semibold bg-gray-700 hover:bg-gray-600 text-white transition-all duration-200"
                >
                    Previous Step
                </button>
                
                <button
                    onClick={onNext}
                    disabled={!isValid()}
                    className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all duration-200 ${
                        isValid()
                            ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg'
                            : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    }`}
                >
                    Continue to Location Details
                </button>
            </div>
        </div>
    );
};

export default IncidentInfoStep;
