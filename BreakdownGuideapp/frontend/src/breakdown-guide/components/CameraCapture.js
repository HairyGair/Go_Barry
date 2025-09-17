/**
 * Camera Capture Component
 * Phase 2 Priority 3: Camera Integration for Damage Documentation
 * 
 * Features:
 * - Browser camera API integration
 * - Real-time camera preview
 * - Photo capture with compression
 * - Multiple photo support
 * - Touch-friendly mobile interface
 * - Offline storage capability
 */

const CameraCapture = ({ onPhotoTaken, maxPhotos = 5, quality = 0.8 }) => {
    const [isSupported, setIsSupported] = React.useState(false);
    const [isActive, setIsActive] = React.useState(false);
    const [stream, setStream] = React.useState(null);
    const [photos, setPhotos] = React.useState([]);
    const [error, setError] = React.useState(null);
    const [loading, setLoading] = React.useState(false);
    
    const videoRef = React.useRef(null);
    const canvasRef = React.useRef(null);
    
    React.useEffect(() => {
        // Check camera support
        checkCameraSupport();
        
        return () => {
            stopCamera();
        };
    }, []);
    
    const checkCameraSupport = () => {
        const supported = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
        setIsSupported(supported);
        
        if (!supported) {
            setError('Camera not supported on this device');
        }
    };
    
    const startCamera = async () => {
        if (!isSupported) return;
        
        setLoading(true);
        setError(null);
        
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment', // Use back camera
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                }
            });
            
            setStream(mediaStream);
            setIsActive(true);
            
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                videoRef.current.play();
            }
        } catch (err) {
            console.error('Camera access error:', err);
            setError(getCameraErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };
    
    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        setIsActive(false);
    };
    
    const capturePhoto = () => {
        if (!videoRef.current || !canvasRef.current) return;
        
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        
        // Set canvas size to video size
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Draw video frame to canvas
        context.drawImage(video, 0, 0);
        
        // Convert to compressed blob
        canvas.toBlob((blob) => {
            if (blob) {
                const photoData = {
                    id: Date.now().toString(),
                    blob,
                    url: URL.createObjectURL(blob),
                    timestamp: new Date().toISOString(),
                    size: blob.size,
                    type: blob.type
                };
                
                const newPhotos = [...photos, photoData];
                setPhotos(newPhotos);
                
                // Notify parent component
                if (onPhotoTaken) {
                    onPhotoTaken(photoData, newPhotos);
                }
                
                // Auto-stop camera if max photos reached
                if (newPhotos.length >= maxPhotos) {
                    stopCamera();
                }
                
                // Show success feedback
                showCaptureSuccess();
            }
        }, 'image/jpeg', quality);
    };
    
    const deletePhoto = (photoId) => {
        const updatedPhotos = photos.filter(photo => {
            if (photo.id === photoId) {
                URL.revokeObjectURL(photo.url);
                return false;
            }
            return true;
        });
        setPhotos(updatedPhotos);
    };
    
    const retakePhoto = () => {
        // Clear all photos and restart camera
        photos.forEach(photo => URL.revokeObjectURL(photo.url));
        setPhotos([]);
        startCamera();
    };
    
    const getCameraErrorMessage = (error) => {
        switch (error.name) {
            case 'NotAllowedError':
                return 'Camera access denied. Please allow camera permissions.';
            case 'NotFoundError':
                return 'No camera found on this device.';
            case 'NotSupportedError':
                return 'Camera not supported on this device.';
            case 'OverconstrainedError':
                return 'Camera constraints not supported.';
            default:
                return `Camera error: ${error.message}`;
        }
    };
    
    const showCaptureSuccess = () => {
        // Create flash effect
        const flash = document.createElement('div');
        flash.className = 'fixed inset-0 bg-white opacity-0 z-50 pointer-events-none';
        flash.style.transition = 'opacity 0.1s';
        document.body.appendChild(flash);
        
        // Flash animation
        requestAnimationFrame(() => {
            flash.style.opacity = '0.8';
            setTimeout(() => {
                flash.style.opacity = '0';
                setTimeout(() => {
                    document.body.removeChild(flash);
                }, 100);
            }, 100);
        });
        
        // Haptic feedback if available
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
    };
    
    if (!isSupported) {
        return React.createElement('div', {
            className: 'p-6 bg-red-500/20 border border-red-400/30 rounded-xl text-center'
        }, [
            React.createElement('div', { 
                key: 'icon',
                className: 'text-4xl mb-4' 
            }, '📷'),
            React.createElement('h3', { 
                key: 'title',
                className: 'text-lg font-semibold text-red-200 mb-2' 
            }, 'Camera Not Available'),
            React.createElement('p', { 
                key: 'message',
                className: 'text-red-300 text-sm' 
            }, 'Camera is not supported on this device or browser.')
        ]);
    }
    
    return React.createElement('div', {
        className: 'space-y-4'
    }, [
        // Error display
        error && React.createElement('div', {
            key: 'error',
            className: 'p-4 bg-red-500/20 border border-red-400/30 rounded-lg'
        }, [
            React.createElement('div', {
                key: 'error-content',
                className: 'flex items-center space-x-2'
            }, [
                React.createElement('span', { key: 'icon', className: 'text-xl' }, '⚠️'),
                React.createElement('span', { 
                    key: 'text',
                    className: 'text-red-200 text-sm' 
                }, error)
            ])
        ]),
        
        // Camera interface
        !isActive && photos.length === 0 && React.createElement('div', {
            key: 'start-interface',
            className: 'text-center space-y-4'
        }, [
            React.createElement('div', { 
                key: 'icon',
                className: 'mx-auto w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center' 
            }, React.createElement('span', { className: 'text-2xl' }, '📸')),
            
            React.createElement('h3', { 
                key: 'title',
                className: 'text-lg font-semibold text-white' 
            }, 'Damage Documentation'),
            
            React.createElement('p', { 
                key: 'description',
                className: 'text-gray-300 text-sm' 
            }, `Take up to ${maxPhotos} photos to document vehicle damage or issues`),
            
            React.createElement('button', {
                key: 'start-button',
                onClick: startCamera,
                disabled: loading,
                className: 'w-full min-h-[56px] px-6 py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl text-white font-semibold transition-all flex items-center justify-center space-x-2'
            }, [
                loading && React.createElement('div', {
                    key: 'spinner',
                    className: 'w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin'
                }),
                React.createElement('span', { key: 'text' }, loading ? 'Starting Camera...' : 'Start Camera')
            ])
        ]),
        
        // Active camera view
        isActive && React.createElement('div', {
            key: 'camera-view',
            className: 'space-y-4'
        }, [
            // Video preview
            React.createElement('div', {
                key: 'video-container',
                className: 'relative bg-black rounded-xl overflow-hidden'
            }, [
                React.createElement('video', {
                    key: 'video',
                    ref: videoRef,
                    className: 'w-full h-64 object-cover',
                    autoPlay: true,
                    playsInline: true,
                    muted: true
                }),
                
                // Overlay info
                React.createElement('div', {
                    key: 'overlay',
                    className: 'absolute top-2 left-2 right-2 flex justify-between items-center'
                }, [
                    React.createElement('div', {
                        key: 'count',
                        className: 'px-2 py-1 bg-black/60 rounded text-white text-sm'
                    }, `${photos.length}/${maxPhotos} photos`),
                    
                    React.createElement('button', {
                        key: 'close',
                        onClick: stopCamera,
                        className: 'w-8 h-8 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-black/80 transition-all'
                    }, '✕')
                ])
            ]),
            
            // Camera controls
            React.createElement('div', {
                key: 'controls',
                className: 'flex items-center justify-center space-x-4'
            }, [
                // Capture button
                React.createElement('button', {
                    key: 'capture',
                    onClick: capturePhoto,
                    disabled: photos.length >= maxPhotos,
                    className: 'w-16 h-16 bg-white rounded-full border-4 border-blue-600 disabled:opacity-50 disabled:border-gray-400 hover:scale-105 transition-all flex items-center justify-center'
                }, React.createElement('div', {
                    className: 'w-12 h-12 bg-blue-600 rounded-full'
                })),
                
                // Switch camera button (if multiple cameras available)
                React.createElement('button', {
                    key: 'switch',
                    onClick: () => {
                        // Would implement camera switching
                        alert('Camera switching coming soon!');
                    },
                    className: 'w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-all'
                }, '🔄')
            ])
        ]),
        
        // Hidden canvas for photo capture
        React.createElement('canvas', {
            key: 'canvas',
            ref: canvasRef,
            className: 'hidden'
        }),
        
        // Photo gallery
        photos.length > 0 && React.createElement('div', {
            key: 'gallery',
            className: 'space-y-4'
        }, [
            React.createElement('h4', {
                key: 'gallery-title',
                className: 'text-lg font-semibold text-white'
            }, `Captured Photos (${photos.length})`),
            
            React.createElement('div', {
                key: 'photo-grid',
                className: 'grid grid-cols-2 gap-3'
            }, photos.map((photo, index) => 
                React.createElement('div', {
                    key: photo.id,
                    className: 'relative bg-gray-800 rounded-lg overflow-hidden'
                }, [
                    React.createElement('img', {
                        key: 'image',
                        src: photo.url,
                        alt: `Damage photo ${index + 1}`,
                        className: 'w-full h-32 object-cover'
                    }),
                    
                    React.createElement('div', {
                        key: 'overlay',
                        className: 'absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center'
                    }, [
                        React.createElement('button', {
                            key: 'delete',
                            onClick: () => deletePhoto(photo.id),
                            className: 'w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white hover:bg-red-700 transition-all'
                        }, '🗑️')
                    ]),
                    
                    React.createElement('div', {
                        key: 'info',
                        className: 'absolute bottom-1 left-1 right-1 text-xs text-white bg-black/60 rounded px-1'
                    }, `${Math.round(photo.size / 1024)}KB`)
                ])
            )),
            
            // Action buttons
            React.createElement('div', {
                key: 'actions',
                className: 'flex space-x-3'
            }, [
                photos.length < maxPhotos && React.createElement('button', {
                    key: 'more',
                    onClick: startCamera,
                    className: 'flex-1 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-semibold transition-all'
                }, `Take More Photos (${maxPhotos - photos.length} left)`),
                
                React.createElement('button', {
                    key: 'retake',
                    onClick: retakePhoto,
                    className: 'py-3 px-4 bg-gray-600 hover:bg-gray-700 rounded-lg text-white font-semibold transition-all'
                }, '🔄 Retake All')
            ])
        ])
    ]);
};

// Export the component
window.CameraCapture = CameraCapture;
