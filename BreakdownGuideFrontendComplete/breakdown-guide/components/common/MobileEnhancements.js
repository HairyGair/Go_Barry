/**
 * Mobile UI Enhancement Components
 * Phase 2: Mobile-First Optimization for Breakdown Guide
 * 
 * Provides touch-friendly components and mobile-specific UI patterns
 * for field supervisors using mobile devices
 */

// Mobile-optimized button component with large touch targets
const MobileTouchButton = ({ 
    onClick, 
    selected = false, 
    variant = 'default', 
    children, 
    className = '',
    disabled = false,
    icon = null
}) => {
    const baseClasses = "w-full min-h-[56px] p-4 rounded-xl border-2 transition-all duration-200 text-left flex items-center space-x-4 font-medium";
    
    const variants = {
        default: selected 
            ? 'border-blue-400 bg-blue-400/20 text-blue-200 shadow-lg shadow-blue-400/20' 
            : 'border-white/30 bg-white/10 text-white hover:border-blue-400/50 active:scale-98',
        danger: selected 
            ? 'border-red-400 bg-red-400/20 text-red-200 shadow-lg shadow-red-400/20' 
            : 'border-white/30 bg-white/10 text-white hover:border-red-400/50 active:scale-98',
        success: selected 
            ? 'border-green-400 bg-green-400/20 text-green-200 shadow-lg shadow-green-400/20' 
            : 'border-white/30 bg-white/10 text-white hover:border-green-400/50 active:scale-98',
        warning: selected 
            ? 'border-amber-400 bg-amber-400/20 text-amber-200 shadow-lg shadow-amber-400/20' 
            : 'border-white/30 bg-white/10 text-white hover:border-amber-400/50 active:scale-98'
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`${baseClasses} ${variants[variant]} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
            {/* Selection indicator */}
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                selected 
                    ? `border-${variant === 'default' ? 'blue' : variant === 'danger' ? 'red' : variant === 'success' ? 'green' : 'amber'}-400 bg-${variant === 'default' ? 'blue' : variant === 'danger' ? 'red' : variant === 'success' ? 'green' : 'amber'}-400` 
                    : 'border-white/50'
            }`}>
                {selected && <div className="w-3 h-3 bg-white rounded-full"></div>}
            </div>
            
            {/* Icon */}
            {icon && (
                <div className="w-6 h-6 flex-shrink-0">
                    {icon}
                </div>
            )}
            
            {/* Content */}
            <div className="flex-1 min-w-0">
                {children}
            </div>
        </button>
    );
};

// Mobile-optimized input field
const MobileInput = ({ 
    label, 
    value, 
    onChange, 
    placeholder, 
    type = 'text',
    icon = null,
    error = null,
    className = ''
}) => {
    return (
        <div className={`space-y-2 ${className}`}>
            {label && (
                <label className="block text-sm font-semibold text-blue-200">
                    {icon && <span className="inline-block w-4 h-4 mr-2">{icon}</span>}
                    {label}
                </label>
            )}
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full min-h-[48px] px-4 py-3 bg-white/10 border border-white/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all text-base"
            />
            {error && (
                <p className="text-red-300 text-sm">{error}</p>
            )}
        </div>
    );
};

// Mobile navigation with large touch targets
const MobileNavigation = ({ 
    currentStep, 
    totalSteps, 
    onNext, 
    onPrevious, 
    onHome,
    nextDisabled = false,
    nextLabel = "Next",
    showProgress = true
}) => {
    return (
        <div className="sticky bottom-0 left-0 right-0 bg-black/80 backdrop-blur-sm border-t border-white/20 p-4 space-y-4">
            {/* Progress indicator */}
            {showProgress && (
                <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-300">Step {currentStep} of {totalSteps}</span>
                    <div className="flex-1 bg-white/20 rounded-full h-2">
                        <div 
                            className="bg-blue-400 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                        ></div>
                    </div>
                </div>
            )}
            
            {/* Navigation buttons */}
            <div className="flex space-x-3">
                {/* Home button */}
                <button
                    onClick={onHome}
                    className="min-h-[48px] px-4 bg-gray-600/20 border border-gray-400/30 rounded-xl text-gray-300 hover:bg-gray-600/30 transition-all flex items-center justify-center"
                >
                    <span className="w-5 h-5">{window.Icons.Home}</span>
                </button>
                
                {/* Previous button */}
                <button
                    onClick={onPrevious}
                    disabled={currentStep <= 1}
                    className="min-h-[48px] px-6 bg-gray-600/20 border border-gray-400/30 rounded-xl text-gray-300 hover:bg-gray-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                    <span className="w-4 h-4">{window.Icons.ArrowLeft}</span>
                    <span>Back</span>
                </button>
                
                {/* Next button */}
                <button
                    onClick={onNext}
                    disabled={nextDisabled}
                    className="flex-1 min-h-[48px] px-6 bg-blue-600 border border-blue-500 rounded-xl text-white hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 font-semibold"
                >
                    <span>{nextLabel}</span>
                    <span className="w-4 h-4">{window.Icons.ArrowRight}</span>
                </button>
            </div>
        </div>
    );
};

// Mobile-optimized wizard header
const MobileWizardHeader = ({ 
    icon, 
    title, 
    description, 
    variant = 'default',
    emergency = false 
}) => {
    const colors = {
        default: 'bg-blue-500/20 border-blue-400/30 text-blue-200',
        danger: 'bg-red-500/20 border-red-400/30 text-red-200',
        warning: 'bg-amber-500/20 border-amber-400/30 text-amber-200',
        success: 'bg-green-500/20 border-green-400/30 text-green-200'
    };

    return (
        <div className="text-center space-y-4 mb-6">
            {/* Icon */}
            <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center ${colors[variant]} ${emergency ? 'animate-pulse' : ''}`}>
                <div className="w-8 h-8">
                    {icon}
                </div>
            </div>
            
            {/* Title */}
            <div>
                <h2 className="text-xl md:text-2xl font-bold text-white mb-2">{title}</h2>
                <p className="text-gray-300 text-sm md:text-base">{description}</p>
            </div>
        </div>
    );
};

// Mobile-optimized alert/warning card
const MobileAlertCard = ({ 
    type = 'warning', 
    title, 
    children,
    icon = null,
    className = ''
}) => {
    const styles = {
        warning: 'bg-amber-500/20 border-amber-400/30',
        danger: 'bg-red-500/20 border-red-400/30',
        info: 'bg-blue-500/20 border-blue-400/30',
        success: 'bg-green-500/20 border-green-400/30'
    };

    const textColors = {
        warning: 'text-amber-200',
        danger: 'text-red-200',
        info: 'text-blue-200',
        success: 'text-green-200'
    };

    return (
        <div className={`backdrop-blur-sm rounded-xl p-4 md:p-6 border ${styles[type]} ${className}`}>
            <div className="flex items-start space-x-3">
                {icon && (
                    <div className={`w-6 h-6 flex-shrink-0 ${textColors[type]}`}>
                        {icon}
                    </div>
                )}
                <div className="flex-1 min-w-0">
                    {title && (
                        <h3 className={`text-lg font-semibold ${textColors[type]} mb-2`}>
                            {title}
                        </h3>
                    )}
                    <div className={`text-sm ${textColors[type]}/90 leading-relaxed`}>
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Swipe gesture handler
const useSwipeGesture = (onSwipeLeft, onSwipeRight, threshold = 50) => {
    const [touchStart, setTouchStart] = React.useState(null);
    const [touchEnd, setTouchEnd] = React.useState(null);

    const onTouchStart = (e) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > threshold;
        const isRightSwipe = distance < -threshold;

        if (isLeftSwipe && onSwipeLeft) onSwipeLeft();
        if (isRightSwipe && onSwipeRight) onSwipeRight();
    };

    return {
        onTouchStart,
        onTouchMove,
        onTouchEnd
    };
};

// Export all components
window.MobileUI = {
    MobileTouchButton,
    MobileInput,
    MobileNavigation,
    MobileWizardHeader,
    MobileAlertCard,
    useSwipeGesture
};
