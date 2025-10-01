/**
 * Camera-Enhanced Assessment Wizard
 * Phase 2 Priority 3: Breakdown Assessment with Photo Documentation
 * 
 * Features:
 * - Integrated camera capture
 * - Photo attachment to assessments
 * - Offline photo storage and sync
 * - Enhanced damage documentation
 * - Photo gallery management
 */

const CameraEnhancedAssessmentWizard = ({ currentStep, responses, updateResponse, onNext, onPrevious, onComplete }) => {
    const { MobileTouchButton, MobileInput, MobileNavigation, MobileWizardHeader, MobileAlertCard, useSwipeGesture } = window.MobileUI;
    const { AlertTriangle, Shield, Camera, FileText } = window.Icons;
    
    const [photos, setPhotos] = React.useState([]);
    const [showCamera, setShowCamera] = React.useState(false);
    const [assessmentId, setAssessmentId] = React.useState(null);
    
    // Generate assessment ID on mount
    React.useEffect(() => {
        if (!assessmentId) {
            setAssessmentId(`assessment_${Date.now()}`);
        }
    }, []);
    
    // Swipe navigation
    const swipeHandlers = useSwipeGesture(
        () => onNext(),
        () => onPrevious()
    );
    
    const handlePhotoTaken = async (photoData, allPhotos) => {
        try {
            // Save photo to storage with assessment ID
            if (window.PhotoStorage) {
                await window.PhotoStorage.savePhoto(photoData, assessmentId);
            }
            
            setPhotos(allPhotos);
            
            // Update responses to include photo data
            updateResponse('photos', allPhotos.map(p => ({
                id: p.id,
                timestamp: p.timestamp,
                size: p.size
            })));
            
            console.log('📷 Photo attached to assessment:', assessmentId);
            
        } catch (error) {
            console.error('❌ Failed to save photo:', error);
            alert('Failed to save photo. Please try again.');
        }
    };
    
    const deletePhoto = async (photoId) => {
        try {
            // Delete from storage
            if (window.PhotoStorage) {
                await window.PhotoStorage.deletePhoto(photoId);
            }
            
            // Update local state
            const updatedPhotos = photos.filter(p => p.id !== photoId);
            setPhotos(updatedPhotos);
            
            // Update responses
            updateResponse('photos', updatedPhotos.map(p => ({
                id: p.id,
                timestamp: p.timestamp,
                size: p.size
            })));
            
        } catch (error) {
            console.error('❌ Failed to delete photo:', error);
        }
    };
    
    const renderStep = () => {
        switch (currentStep) {
            case 1:
                return (
                    <div className="space-y-6 pb-32" {...swipeHandlers}>
                        <MobileWizardHeader
                            icon={<Camera className="w-8 h-8" />}
                            title="📋 Enhanced Assessment"
                            description="Document issues with photos"
                            variant="default"
                        />
                        
                        {/* Issue Type Selection */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-white">What type of issue are you assessing?</h3>
                            
                            <div className="space-y-3">
                                <MobileTouchButton
                                    onClick={() => updateResponse('issue_type', 'visible_damage')}
                                    selected={responses.issue_type === 'visible_damage'}
                                    variant="warning"
                                    icon={<span className="text-xl">🔍</span>}
                                >
                                    <div>
                                        <div className="font-semibold">Visible Damage</div>
                                        <div className="text-sm opacity-80 mt-1">Dents, scratches, broken parts</div>
                                    </div>
                                </MobileTouchButton>

                                <MobileTouchButton
                                    onClick={() => updateResponse('issue_type', 'mechanical_fault')}
                                    selected={responses.issue_type === 'mechanical_fault'}
                                    variant="danger"
                                    icon={<span className="text-xl">🔧</span>}
                                >
                                    <div>
                                        <div className="font-semibold">Mechanical Fault</div>
                                        <div className="text-sm opacity-80 mt-1">Engine, transmission, or component issues</div>
                                    </div>
                                </MobileTouchButton>

                                <MobileTouchButton
                                    onClick={() => updateResponse('issue_type', 'electrical_issue')}
                                    selected={responses.issue_type === 'electrical_issue'}
                                    variant="warning"
                                    icon={<span className="text-xl">⚡</span>}
                                >
                                    <div>
                                        <div className="font-semibold">Electrical Issue</div>
                                        <div className="text-sm opacity-80 mt-1">Lights, electronics, warning lights</div>
                                    </div>
                                </MobileTouchButton>

                                <MobileTouchButton
                                    onClick={() => updateResponse('issue_type', 'safety_concern')}
                                    selected={responses.issue_type === 'safety_concern'}
                                    variant="danger"
                                    icon={<span className="text-xl">⚠️</span>}
                                >
                                    <div>
                                        <div className="font-semibold">Safety Concern</div>
                                        <div className="text-sm opacity-80 mt-1">Brakes, steering, suspension, doors</div>
                                    </div>
                                </MobileTouchButton>
                            </div>
                        </div>

                        {/* Location Input */}
                        <MobileInput
                            label="📍 Current Location"
                            value={responses.location || ''}
                            onChange={(value) => updateResponse('location', value)}
                            placeholder="e.g., Newcastle Central Station, A1, Team Valley"
                            icon={<span>📍</span>}
                        />

                        {/* Issue Description */}
                        <MobileInput
                            label="📝 Describe the Issue"
                            value={responses.description || ''}
                            onChange={(value) => updateResponse('description', value)}
                            placeholder="Detailed description of what you observed..."
                        />
                    </div>
                );

            case 2:
                return (
                    <div className="space-y-6 pb-32" {...swipeHandlers}>
                        <MobileWizardHeader
                            icon={<Camera className="w-8 h-8" />}
                            title="📸 Photo Documentation"
                            description="Capture photos to document the issue"
                            variant="info"
                        />

                        <MobileAlertCard 
                            type="info" 
                            title="📷 Visual Documentation"
                            icon={<Camera className="w-6 h-6" />}
                        >
                            <div className="space-y-2">
                                <p>Take clear photos of the issue to help with:</p>
                                <ul className="space-y-1 text-sm">
                                    <li>• Engineering assessment</li>
                                    <li>• Insurance claims</li>
                                    <li>• Maintenance records</li>
                                    <li>• Compliance documentation</li>
                                </ul>
                            </div>
                        </MobileAlertCard>
                        
                        {/* Camera Component */}
                        {React.createElement(window.CameraCapture, {
                            onPhotoTaken: handlePhotoTaken,
                            maxPhotos: 5,
                            quality: 0.8
                        })}
                        
                        {/* Photo Tips */}
                        <div className="bg-blue-500/10 backdrop-blur-sm rounded-lg p-4 border border-blue-400/30">
                            <h4 className="font-semibold text-blue-200 mb-2">📸 Photo Tips</h4>
                            <ul className="text-sm text-blue-300/90 space-y-1">
                                <li>• Get close-up shots of damage details</li>
                                <li>• Include wide shots for context</li>
                                <li>• Ensure good lighting</li>
                                <li>• Keep camera steady</li>
                                <li>• Photos work offline and sync later</li>
                            </ul>
                        </div>
                    </div>
                );

            case 3:
                return (
                    <div className="space-y-6 pb-32" {...swipeHandlers}>
                        <MobileWizardHeader
                            icon={<Shield className="w-8 h-8" />}
                            title="⚖️ Safety Assessment"
                            description="Evaluate safety and operational impact"
                            variant="warning"
                        />

                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-white">Safety Impact Assessment</h3>
                            
                            <div className="space-y-3">
                                <MobileTouchButton
                                    onClick={() => updateResponse('safety_critical', !responses.safety_critical)}
                                    selected={responses.safety_critical}
                                    variant="danger"
                                    icon={<span className="text-xl">🚨</span>}
                                >
                                    <div>
                                        <div className="font-semibold">Safety Critical</div>
                                        <div className="text-sm opacity-80 mt-1">Immediate danger to passengers or public</div>
                                    </div>
                                </MobileTouchButton>

                                <MobileTouchButton
                                    onClick={() => updateResponse('affects_operation', !responses.affects_operation)}
                                    selected={responses.affects_operation}
                                    variant="warning"
                                    icon={<span className="text-xl">⚠️</span>}
                                >
                                    <div>
                                        <div className="font-semibold">Affects Operation</div>
                                        <div className="text-sm opacity-80 mt-1">Impacts vehicle performance or comfort</div>
                                    </div>
                                </MobileTouchButton>

                                <MobileTouchButton
                                    onClick={() => updateResponse('minor_issue', !responses.minor_issue)}
                                    selected={responses.minor_issue}
                                    variant="success"
                                    icon={<span className="text-xl">✅</span>}
                                >
                                    <div>
                                        <div className="font-semibold">Minor Issue</div>
                                        <div className="text-sm opacity-80 mt-1">Cosmetic or low-priority concern</div>
                                    </div>
                                </MobileTouchButton>
                            </div>
                        </div>

                        {/* Driver Input */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-white">Driver Feedback</h3>
                            
                            <MobileTouchButton
                                onClick={() => updateResponse('driver_concern', !responses.driver_concern)}
                                selected={responses.driver_concern}
                                variant="warning"
                                icon={<span className="text-xl">👨‍💼</span>}
                            >
                                <div>
                                    <div className="font-semibold">Driver Expressed Concern</div>
                                    <div className="text-sm opacity-80 mt-1">Driver feels unsafe or uncomfortable</div>
                                </div>
                            </MobileTouchButton>
                        </div>
                    </div>
                );

            case 4:
                const decision = responses.safety_critical ? 'STOP' : 
                               (responses.affects_operation || responses.driver_concern) ? 'AMBER' : 'CONTINUE';
                
                return (
                    <div className="space-y-6 pb-32" {...swipeHandlers}>
                        <MobileWizardHeader
                            icon={decision === 'STOP' ? <AlertTriangle className="w-8 h-8" /> : 
                                  decision === 'AMBER' ? <AlertTriangle className="w-8 h-8" /> : 
                                  <Shield className="w-8 h-8" />}
                            title={decision === 'STOP' ? "🛑 STOP REQUIRED" : 
                                   decision === 'AMBER' ? "🟡 PROCEED WITH CAUTION" : 
                                   "🟢 CONTINUE IN SERVICE"}
                            description="Assessment complete with photo documentation"
                            variant={decision === 'STOP' ? "danger" : decision === 'AMBER' ? "warning" : "success"}
                            emergency={decision === 'STOP'}
                        />

                        {/* Decision Summary */}
                        <MobileAlertCard 
                            type={decision === 'STOP' ? 'danger' : decision === 'AMBER' ? 'warning' : 'success'}
                            title={decision === 'STOP' ? 'IMMEDIATE ACTION REQUIRED' : 
                                   decision === 'AMBER' ? 'PROCEED WITH CAUTION' : 
                                   'CONTINUE NORMAL SERVICE'}
                            icon={decision === 'STOP' ? <AlertTriangle className="w-6 h-6" /> : 
                                  decision === 'AMBER' ? <AlertTriangle className="w-6 h-6" /> : 
                                  <Shield className="w-6 h-6" />}
                        >
                            <div className="space-y-3">
                                <p className="font-semibold">
                                    {decision === 'STOP' ? 'Safety critical issue identified. Vehicle must stop immediately.' :
                                     decision === 'AMBER' ? 'Issue affects operation. Proceed to planned changeover point.' :
                                     'Minor issue identified. Vehicle can continue normal service.'}
                                </p>
                                
                                {photos.length > 0 && (
                                    <div className="bg-white/10 rounded-lg p-3">
                                        <p className="font-semibold mb-2">📸 Photo Documentation:</p>
                                        <p className="text-sm">{photos.length} photos captured and will be attached to this assessment.</p>
                                    </div>
                                )}
                            </div>
                        </MobileAlertCard>

                        {/* Photo Summary */}
                        {photos.length > 0 && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-white">📷 Captured Photos</h3>
                                
                                {React.createElement(window.PhotoGallery, {
                                    photos: photos,
                                    onDeletePhoto: deletePhoto,
                                    onViewPhoto: (photo) => {
                                        // Open photo in new window for viewing
                                        const win = window.open();
                                        win.document.write(`
                                            <html>
                                                <head><title>Photo View</title></head>
                                                <body style="margin:0;background:#000;display:flex;align-items:center;justify-content:center;min-height:100vh;">
                                                    <img src="${photo.url}" style="max-width:100%;max-height:100%;object-fit:contain;" alt="Assessment Photo" />
                                                </body>
                                            </html>
                                        `);
                                    }
                                })}
                            </div>
                        )}

                        {/* Final Actions */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-white">Confirm Actions</h3>
                            
                            <MobileTouchButton
                                onClick={() => updateResponse('documented_in_system', !responses.documented_in_system)}
                                selected={responses.documented_in_system}
                                variant="warning"
                                icon={<span className="text-xl">📋</span>}
                            >
                                <div>
                                    <div className="font-semibold">Documented in system</div>
                                    <div className="text-sm opacity-80 mt-1">Assessment and photos logged</div>
                                </div>
                            </MobileTouchButton>

                            <MobileTouchButton
                                onClick={() => updateResponse('driver_informed', !responses.driver_informed)}
                                selected={responses.driver_informed}
                                variant="warning"
                                icon={<span className="text-xl">📢</span>}
                            >
                                <div>
                                    <div className="font-semibold">Driver informed of decision</div>
                                    <div className="text-sm opacity-80 mt-1">Clear instructions provided</div>
                                </div>
                            </MobileTouchButton>

                            {decision === 'STOP' && (
                                <MobileTouchButton
                                    onClick={() => updateResponse('engineering_contacted', !responses.engineering_contacted)}
                                    selected={responses.engineering_contacted}
                                    variant="danger"
                                    icon={<span className="text-xl">🔧</span>}
                                >
                                    <div>
                                        <div className="font-semibold">Engineering contacted</div>
                                        <div className="text-sm opacity-80 mt-1">Immediate assistance requested</div>
                                    </div>
                                </MobileTouchButton>
                            )}
                        </div>

                        {/* Additional Notes */}
                        <MobileInput
                            label="📝 Additional Notes"
                            value={responses.additional_notes || ''}
                            onChange={(value) => updateResponse('additional_notes', value)}
                            placeholder="Any additional observations or actions taken..."
                        />
                    </div>
                );

            default:
                return (
                    <div className="text-center space-y-4">
                        <div className="text-red-400">Unknown step: {currentStep}</div>
                    </div>
                );
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
            <div className="px-4 pt-6">
                {renderStep()}
            </div>
            
            <MobileNavigation
                currentStep={currentStep}
                totalSteps={4}
                onNext={() => {
                    if (currentStep === 4) {
                        const decision = responses.safety_critical ? 'STOP' : 
                                       (responses.affects_operation || responses.driver_concern) ? 'AMBER' : 'CONTINUE';
                        
                        const assessmentData = {
                            assessment_type: 'camera_enhanced_assessment',
                            assessment_id: assessmentId,
                            issue_type: responses.issue_type,
                            location: responses.location,
                            description: responses.description,
                            decision: decision,
                            safety_assessment: {
                                safety_critical: responses.safety_critical,
                                affects_operation: responses.affects_operation,
                                minor_issue: responses.minor_issue,
                                driver_concern: responses.driver_concern
                            },
                            photos: responses.photos || [],
                            photo_count: photos.length,
                            actions_taken: {
                                documented_in_system: responses.documented_in_system,
                                driver_informed: responses.driver_informed,
                                engineering_contacted: responses.engineering_contacted
                            },
                            additional_notes: responses.additional_notes,
                            timestamp: new Date().toISOString(),
                            offline_completed: !navigator.onLine
                        };
                        
                        // Use offline-enhanced completion
                        if (window.OfflineEnhancedWizard) {
                            window.OfflineEnhancedWizard.handleComplete(assessmentData, onComplete);
                        } else {
                            onComplete(assessmentData);
                        }
                    } else {
                        onNext();
                    }
                }}
                onPrevious={onPrevious}
                onHome={() => window.location.href = '/'}
                nextDisabled={
                    currentStep === 1 && (!responses.issue_type || !responses.description)
                }
                nextLabel={currentStep === 4 ? "Complete Assessment" : "Continue"}
            />
        </div>
    );
};

// Export the component
window.CameraEnhancedAssessmentWizard = CameraEnhancedAssessmentWizard;
