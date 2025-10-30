// Common Breakdown Information Component with Fleet Database Integration
// Collects essential data for all breakdown assessments with auto-lookup

import React, { useState } from 'react';
import * as Icons from './icons.jsx';
import DepotContactBadge from '../../../components/DepotContactBadge';

const BreakdownInfoStep = ({ responses, updateResponse, onNext }) => {
    const { FileText, MapPin, User, Truck, Building, Search, CheckCircle } = Icons;
    const [isLookingUp, setIsLookingUp] = useState(false);
    const [vehicleInfo, setVehicleInfo] = useState(null);
    const [lookupError, setLookupError] = useState(null);
    
    const depots = ['Washington', 'Consett', 'Hexham', 'Riverside', 'Gateshead Riverside', 'Percy Main', 'Deptford', 'Chester-le-Street', 'Stanley'];
    
    // Fleet database lookup function
    const lookupFleetNumber = async (fleetNumber) => {
        if (!fleetNumber || fleetNumber.length < 3) {
            setVehicleInfo(null);
            return;
        }
        
        setIsLookingUp(true);
        setLookupError(null);
        
        try {
            // Use the correct backend URL
            const backendUrl = import.meta.env.VITE_API_URL || 'https://breakdowns.gobarry.co.uk/api';
            const response = await fetch(`${backendUrl}/api/fleet/${fleetNumber}`);
            
            if (response.ok) {
                const data = await response.json();
                setVehicleInfo(data);
                
                // Auto-fill depot if found
                if (data.depot) {
                    updateResponse('depot', data.depot);
                }
            } else {
                setLookupError('Vehicle not found in database');
                setVehicleInfo(null);
            }
        } catch (error) {
            console.error('Fleet lookup error:', error);
            setLookupError('Unable to connect to fleet database');
        } finally {
            setIsLookingUp(false);
        }
    };
    
    const handleFleetNumberChange = (value) => {
        updateResponse('fleetNumber', value);
        lookupFleetNumber(value);
    };
    
    const isValid = () => {
        return responses.fleetNumber && 
               responses.driverName && 
               responses.depot && 
               responses.location;
    };
    
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-4">Breakdown Information</h2>
            
            <div className="bg-blue-500/20 backdrop-blur-sm rounded-lg p-4 border border-blue-400/30">
                <p className="text-blue-200 text-sm">
                    Please collect the following essential information. Fleet details will auto-populate from the database.
                </p>
            </div>
            
            <div className="space-y-4">
                {/* Fleet Number with Lookup */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        <Truck className="inline w-4 h-4 mr-1" />
                        Fleet Number
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            value={responses.fleetNumber || ''}
                            onChange={(e) => handleFleetNumberChange(e.target.value)}
                            className="w-full bg-gray-800/50 backdrop-blur-sm border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                            placeholder="e.g., 6337"
                        />
                        {isLookingUp && (
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                <div className="animate-spin h-4 w-4 border-2 border-blue-500 rounded-full border-t-transparent"></div>
                            </div>
                        )}
                        {vehicleInfo && (
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                <CheckCircle className="h-4 w-4 text-green-400" />
                            </div>
                        )}
                    </div>
                    {vehicleInfo && (
                        <div className="mt-2 p-3 bg-green-900/20 backdrop-blur-sm rounded-lg border border-green-600/30">
                            <p className="text-sm text-green-300">
                                ✓ {vehicleInfo.vehicleType} - {vehicleInfo.regNo}
                            </p>
                        </div>
                    )}
                    {lookupError && (
                        <p className="mt-1 text-sm text-red-400">{lookupError}</p>
                    )}
                </div>
                
                {/* Driver Name */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        <User className="inline w-4 h-4 mr-1" />
                        Driver Name
                    </label>
                    <input
                        type="text"
                        value={responses.driverName || ''}
                        onChange={(e) => updateResponse('driverName', e.target.value)}
                        className="w-full bg-gray-800/50 backdrop-blur-sm border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter driver name"
                    />
                </div>
                
                {/* Depot */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        <Building className="inline w-4 h-4 mr-1" />
                        Depot
                    </label>
                    <select
                        value={responses.depot || ''}
                        onChange={(e) => updateResponse('depot', e.target.value)}
                        className="w-full bg-gray-800/50 backdrop-blur-sm border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="">Select Depot</option>
                        {depots.map(depot => (
                            <option key={depot} value={depot}>{depot}</option>
                        ))}
                    </select>
                    {(responses.depot || responses.fleetNumber) && (
                        <div className="mt-3">
                            <DepotContactBadge
                                fleetNumber={responses.fleetNumber}
                                depot={responses.depot}
                                size="medium"
                                showDepotName={true}
                                variant="dropdown"
                            />
                        </div>
                    )}
                </div>
                
                {/* Location */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        <MapPin className="inline w-4 h-4 mr-1" />
                        Current Location
                    </label>
                    <input
                        type="text"
                        value={responses.location || ''}
                        onChange={(e) => updateResponse('location', e.target.value)}
                        className="w-full bg-gray-800/50 backdrop-blur-sm border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., Newcastle City Centre, Stand A"
                    />
                </div>
                
                {/* Optional: Additional Notes */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        <FileText className="inline w-4 h-4 mr-1" />
                        Additional Notes (Optional)
                    </label>
                    <textarea
                        value={responses.notes || ''}
                        onChange={(e) => updateResponse('notes', e.target.value)}
                        className="w-full bg-gray-800/50 backdrop-blur-sm border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows="3"
                        placeholder="Any additional information..."
                    />
                </div>
            </div>
            
            <button
                onClick={onNext}
                disabled={!isValid()}
                className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                    isValid()
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg'
                        : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                }`}
            >
                Continue to Assessment
                <FileText className="w-5 h-5" />
            </button>
        </div>
    );
};

export default BreakdownInfoStep;
