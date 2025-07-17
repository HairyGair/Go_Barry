export const CATEGORIES = [
    // Critical Issues (6)
    { id: 'brakes', name: 'Brakes', severity: 'critical', icon: '🛑', description: 'Brake pedal issues, unusual noises, system leaks, grabbing, shuddering', implemented: true },
    { id: 'steering', name: 'Steering', severity: 'critical', icon: '🎯', description: '75mm play limit, control difficulties, unusual noises, pulling to one side', implemented: true },
    { id: 'oil-warning-light', name: 'Oil Warning Light', severity: 'critical', icon: '⚠️', description: 'Immediate stop, leak inspection, fire risk assessment', implemented: true },
    { id: 'loose-wheel-nuts', name: 'Loose Wheel Nuts', severity: 'critical', icon: '⚫', description: 'Zero tolerance - immediate stop and multiple management notifications', implemented: true },
    { id: 'abs-light', name: 'ABS Light', severity: 'critical', icon: '🔴', description: 'Red and amber ABS warning lights - reset procedures and 10mph checks', implemented: true },
    { id: 'road-traffic-incidents', name: 'Road Traffic Incidents', severity: 'critical', icon: '🚗', description: 'Driver wellbeing, injuries, police involvement, damage assessment', implemented: true },
    
    // High Priority Issues (13)
    { id: 'overheating', name: 'Overheating', severity: 'warning', icon: '🌡️', description: 'Temperature thresholds, water buzzer, leak inspection, heat mitigation', implemented: true },
    { id: 'low-water', name: 'Low Water', severity: 'warning', icon: '💧', description: 'Leak inspection, buzzer status, top-up authorization, SDC log verification', implemented: true },
    { id: 'battery-light', name: 'Battery Light', severity: 'warning', icon: '🔋', description: 'Belt inspection and master switch procedures', implemented: true },
    { id: 'doors', name: 'Doors Not Working', severity: 'warning', icon: '🚪', description: 'Button checks, obstructions, air system, safety classifications', implemented: true },
    { id: 'broken-windows', name: 'Broken Windows', severity: 'warning', icon: '🪟', description: 'Driver vision impairment, passenger safety, sharp edges assessment', implemented: true },
    { id: 'excessive-smoke', name: 'Excessive Smoke', severity: 'warning', icon: '💨', description: 'Fume entry, exhaust detachment, vision obscurement', implemented: true },
    { id: 'gearbox-temperature', name: 'Gearbox Temperature', severity: 'warning', icon: '⚙️', description: 'Reset procedures, coolant leaks, terrain assessment', implemented: true },
    { id: 'exterior-lights', name: 'Exterior Lights', severity: 'warning', icon: '💡', description: 'Headlights, indicators, brake lights - hours of darkness requirements', implemented: true },
    { id: 'cutting-out-fuel', name: 'Cutting Out/Fuel', severity: 'warning', icon: '⛽', description: 'Fuel leak inspection, ignition checks, persistent problems', implemented: true },
    { id: 'buzzers', name: 'Buzzers Sounding', severity: 'warning', icon: '🔊', description: 'Various buzzer identification and warning light correlation', implemented: true },
    { id: 'puncture', name: 'Puncture', severity: 'warning', icon: '🛞', description: 'Position identification (inner/outer, front/rear, side), engineering advice', implemented: true },
    { id: 'suspension', name: 'Suspension', severity: 'warning', icon: '🏗️', description: 'Warning lights, vehicle lean, air pressure, ride quality assessment', implemented: true },
    { id: 'repeat-defects', name: 'Repeat Defects', severity: 'warning', icon: '🔄', description: 'Same-day and multi-day escalation to Engineering Delivery Director', implemented: true },
    
    // Common Issues (11)
    { id: 'wipers-screenwash', name: 'Wipers/Screenwash', severity: 'normal', icon: '🌧️', description: 'Vision impairment, weather conditions, route considerations (A19, A1M)', implemented: true },
    { id: 'non-starter', name: 'Non-Starter', severity: 'normal', icon: '🔑', description: 'Systematic troubleshooting, rear start procedures, diagnostic questions', implemented: true },
    { id: 'gear-selection', name: 'Gear Selection Issues', severity: 'normal', icon: '⚙️', description: 'System reset, ramp position, suspension light, footbrake procedures', implemented: true },
    { id: 'interior-lights', name: 'Interior Lights', severity: 'normal', icon: '🔦', description: '50% illumination rule, step light functionality', implemented: true },
    { id: 'demisters-heaters', name: 'Demisters/Heaters', severity: 'normal', icon: '🌡️', description: 'Vision impairment, saloon temperature thresholds', implemented: false },
    { id: 'ramp-stuck', name: 'Ramp Issues', severity: 'normal', icon: '♿', description: 'Reset procedures, manual retraction training verification', implemented: false },
    { id: 'speedo-not-working', name: 'Speedometer Not Working', severity: 'normal', icon: '📊', description: 'Tachograph checks, reasonable changeover timeframes', implemented: false },
    { id: 'wing-mirrors', name: 'Wing Mirror Damage', severity: 'normal', icon: '🪟', description: 'Glass vs arm damage, nearside vs offside risk assessment', implemented: false },
    { id: 'interior-exterior-damage', name: 'Interior/Exterior Damage', severity: 'normal', icon: '🔨', description: 'Floor security, seat safety, panel damage, registration plates', implemented: false },
    { id: 'warning-lights', name: 'Warning Lights (General)', severity: 'normal', icon: '⚠️', description: 'Color-based decisions (red vs amber), photo upload requirements', implemented: false },
    { id: 'safety-declaration', name: 'Safety Declaration', severity: 'normal', icon: '📋', description: 'Safety is non-negotiable principles and guidance', implemented: false }
];

export const getCategoryById = (id) => {
    return CATEGORIES.find(cat => cat.id === id);
};

export const getCategoriesBySeverity = (severity) => {
    return CATEGORIES.filter(cat => cat.severity === severity);
};

export const getImplementedCategories = () => {
    return CATEGORIES.filter(cat => cat.implemented);
};