import React, { useState } from 'react';
import RoadTrafficIncidentsWizard from './RoadTrafficIncidentsWizard.jsx';
import RoadTrafficIncidentsWizardSimple from './RoadTrafficIncidentsWizardSimple.jsx';

// Wrapper component to debug the updateResponse issue
const RoadTrafficIncidentsWizardWrapper = (props) => {
    // Create a local updateResponse function to test
    const [localResponses, setLocalResponses] = useState(props.responses || {});
    const [useSimpleVersion, setUseSimpleVersion] = useState(false);
    
    const handleUpdateResponse = (key, value) => {
        console.log('Wrapper - updateResponse called:', { key, value });
        
        // Update local state
        setLocalResponses(prev => ({ ...prev, [key]: value }));
        
        // Call parent's updateResponse if it exists
        if (props.updateResponse) {
            props.updateResponse(key, value);
        }
    };
    
    // Override the updateResponse prop with our debug version
    const wrappedProps = {
        ...props,
        responses: { ...props.responses, ...localResponses },
        updateResponse: handleUpdateResponse
    };
    
    return (
        <div>
            <div className="bg-green-500 text-white p-2 mb-4 rounded flex justify-between items-center">
                <span>Debug Wrapper Active - Check console for button clicks</span>
                <button
                    type="button"
                    onClick={() => setUseSimpleVersion(!useSimpleVersion)}
                    className="px-3 py-1 bg-white text-green-500 rounded hover:bg-gray-100"
                >
                    Use {useSimpleVersion ? 'Full' : 'Simple'} Version
                </button>
            </div>
            {useSimpleVersion ? (
                <RoadTrafficIncidentsWizardSimple {...wrappedProps} />
            ) : (
                <RoadTrafficIncidentsWizard {...wrappedProps} />
            )}
        </div>
    );
};

export default RoadTrafficIncidentsWizardWrapper;
