// Script to replace all instances of text Go BARRY with logo
// This will be a series of edit commands

const replacements = [
    // Road Traffic Incidents Wizard
    {
        oldText: `                                    <div className="flex items-center">
                                        <span className="text-3xl font-black text-white">Go</span>
                                        <span className="text-3xl font-black text-red-500">BARRY</span>
                                    </div>`,
        newText: `                                    <div className="flex items-center">
                                        <img src="../gobarry-logo.png" alt="Go BARRY" className="h-10 w-auto" />
                                    </div>`
    },
    // TracerIt Helper Wizard
    {
        oldText: `                                    <div className="flex items-center">
                                        <span className="text-3xl font-black text-white">Go</span>
                                        <span className="text-3xl font-black text-red-500">BARRY</span>
                                    </div>`,
        newText: `                                    <div className="flex items-center">
                                        <img src="../gobarry-logo.png" alt="Go BARRY" className="h-10 w-auto" />
                                    </div>`
    },
    // Repeat Defects Wizard
    {
        oldText: `                                    <div className="flex items-center">
                                        <span className="text-3xl font-black text-white">Go</span>
                                        <span className="text-3xl font-black text-red-500">BARRY</span>
                                    </div>`,
        newText: `                                    <div className="flex items-center">
                                        <img src="../gobarry-logo.png" alt="Go BARRY" className="h-10 w-auto" />
                                    </div>`
    },
    // Interior Lights Wizard
    {
        oldText: `                                    <div className="flex items-center">
                                        <span className="text-3xl font-black text-white">Go</span>
                                        <span className="text-3xl font-black text-red-500">BARRY</span>
                                    </div>`,
        newText: `                                    <div className="flex items-center">
                                        <img src="../gobarry-logo.png" alt="Go BARRY" className="h-10 w-auto" />
                                    </div>`
    },
    // Exterior Lights Wizard
    {
        oldText: `                                    <div className="flex items-center">
                                        <span className="text-3xl font-black text-white">Go</span>
                                        <span className="text-3xl font-black text-red-500">BARRY</span>
                                    </div>`,
        newText: `                                    <div className="flex items-center">
                                        <img src="../gobarry-logo.png" alt="Go BARRY" className="h-10 w-auto" />
                                    </div>`
    },
    // Wheelchair Ramp Wizard
    {
        oldText: `                                    <div className="flex items-center">
                                        <span className="text-3xl font-black text-white">Go</span>
                                        <span className="text-3xl font-black text-red-500">BARRY</span>
                                    </div>`,
        newText: `                                    <div className="flex items-center">
                                        <img src="../gobarry-logo.png" alt="Go BARRY" className="h-10 w-auto" />
                                    </div>`
    },
    // Destination Display Wizard
    {
        oldText: `                                    <div className="flex items-center">
                                        <span className="text-3xl font-black text-white">Go</span>
                                        <span className="text-3xl font-black text-red-500">BARRY</span>
                                    </div>`,
        newText: `                                    <div className="flex items-center">
                                        <img src="../gobarry-logo.png" alt="Go BARRY" className="h-10 w-auto" />
                                    </div>`
    },
    // Battery Wizard
    {
        oldText: `                                    <div className="flex items-center">
                                        <span className="text-3xl font-black text-white">Go</span>
                                        <span className="text-3xl font-black text-red-500">BARRY</span>
                                    </div>`,
        newText: `                                    <div className="flex items-center">
                                        <img src="../gobarry-logo.png" alt="Go BARRY" className="h-10 w-auto" />
                                    </div>`
    },
    // Cooling System Wizard
    {
        oldText: `                                    <div className="flex items-center">
                                        <span className="text-3xl font-black text-white">Go</span>
                                        <span className="text-3xl font-black text-red-500">BARRY</span>
                                    </div>`,
        newText: `                                    <div className="flex items-center">
                                        <img src="../gobarry-logo.png" alt="Go BARRY" className="h-10 w-auto" />
                                    </div>`
    },
    // Demisters Heaters Wizard
    {
        oldText: `                                    <div className="flex items-center">
                                        <span className="text-3xl font-black text-white">Go</span>
                                        <span className="text-3xl font-black text-red-500">BARRY</span>
                                    </div>`,
        newText: `                                    <div className="flex items-center">
                                        <img src="../gobarry-logo.png" alt="Go BARRY" className="h-10 w-auto" />
                                    </div>`
    },
    // Doors Wizard
    {
        oldText: `                                    <div className="flex items-center">
                                        <span className="text-3xl font-black text-white">Go</span>
                                        <span className="text-3xl font-black text-red-500">BARRY</span>
                                    </div>`,
        newText: `                                    <div className="flex items-center">
                                        <img src="../gobarry-logo.png" alt="Go BARRY" className="h-10 w-auto" />
                                    </div>`
    },
    // Non Starter Wizard
    {
        oldText: `                                    <div className="flex items-center">
                                        <span className="text-3xl font-black text-white">Go</span>
                                        <span className="text-3xl font-black text-red-500">BARRY</span>
                                    </div>`,
        newText: `                                    <div className="flex items-center">
                                        <img src="../gobarry-logo.png" alt="Go BARRY" className="h-10 w-auto" />
                                    </div>`
    },
    // Gear Selection Wizard
    {
        oldText: `                                    <div className="flex items-center">
                                        <span className="text-3xl font-black text-white">Go</span>
                                        <span className="text-3xl font-black text-red-500">BARRY</span>
                                    </div>`,
        newText: `                                    <div className="flex items-center">
                                        <img src="../gobarry-logo.png" alt="Go BARRY" className="h-10 w-auto" />
                                    </div>`
    },
    // Loose Wheel Nuts Wizard
    {
        oldText: `                                    <div className="flex items-center">
                                        <span className="text-3xl font-black text-white">Go</span>
                                        <span className="text-3xl font-black text-red-500">BARRY</span>
                                    </div>`,
        newText: `                                    <div className="flex items-center">
                                        <img src="../gobarry-logo.png" alt="Go BARRY" className="h-10 w-auto" />
                                    </div>`
    },
    // Puncture Wizard
    {
        oldText: `                                    <div className="flex items-center">
                                        <span className="text-3xl font-black text-white">Go</span>
                                        <span className="text-3xl font-black text-red-500">BARRY</span>
                                    </div>`,
        newText: `                                    <div className="flex items-center">
                                        <img src="../gobarry-logo.png" alt="Go BARRY" className="h-10 w-auto" />
                                    </div>`
    },
    // Gearbox Wizard
    {
        oldText: `                                    <div className="flex items-center">
                                        <span className="text-3xl font-black text-white">Go</span>
                                        <span className="text-3xl font-black text-red-500">BARRY</span>
                                    </div>`,
        newText: `                                    <div className="flex items-center">
                                        <img src="../gobarry-logo.png" alt="Go BARRY" className="h-10 w-auto" />
                                    </div>`
    },
    // Buzzers Wizard
    {
        oldText: `                                    <div className="flex items-center">
                                        <span className="text-3xl font-black text-white">Go</span>
                                        <span className="text-3xl font-black text-red-500">BARRY</span>
                                    </div>`,
        newText: `                                    <div className="flex items-center">
                                        <img src="../gobarry-logo.png" alt="Go BARRY" className="h-10 w-auto" />
                                    </div>`
    },
    // Warning Lights Wizard
    {
        oldText: `                                    <div className="flex items-center">
                                        <span className="text-3xl font-black text-white">Go</span>
                                        <span className="text-3xl font-black text-red-500">BARRY</span>
                                    </div>`,
        newText: `                                    <div className="flex items-center">
                                        <img src="../gobarry-logo.png" alt="Go BARRY" className="h-10 w-auto" />
                                    </div>`
    },
    // Excessive Smoke Wizard
    {
        oldText: `                                    <div className="flex items-center">
                                        <span className="text-3xl font-black text-white">Go</span>
                                        <span className="text-3xl font-black text-red-500">BARRY</span>
                                    </div>`,
        newText: `                                    <div className="flex items-center">
                                        <img src="../gobarry-logo.png" alt="Go BARRY" className="h-10 w-auto" />
                                    </div>`
    },
    // Suspension Wizard
    {
        oldText: `                                    <div className="flex items-center">
                                        <span className="text-3xl font-black text-white">Go</span>
                                        <span className="text-3xl font-black text-red-500">BARRY</span>
                                    </div>`,
        newText: `                                    <div className="flex items-center">
                                        <img src="../gobarry-logo.png" alt="Go BARRY" className="h-10 w-auto" />
                                    </div>`
    },
    // Wipers/Screenwash Wizard
    {
        oldText: `                                    <div className="flex items-center">
                                        <span className="text-3xl font-black text-white">Go</span>
                                        <span className="text-3xl font-black text-red-500">BARRY</span>
                                    </div>`,
        newText: `                                    <div className="flex items-center">
                                        <img src="../gobarry-logo.png" alt="Go BARRY" className="h-10 w-auto" />
                                    </div>`
    },
    // Low Water Wizard
    {
        oldText: `                                    <div className="flex items-center">
                                        <span className="text-3xl font-black text-white">Go</span>
                                        <span className="text-3xl font-black text-red-500">BARRY</span>
                                    </div>`,
        newText: `                                    <div className="flex items-center">
                                        <img src="../gobarry-logo.png" alt="Go BARRY" className="h-10 w-auto" />
                                    </div>`
    },
    // Broken Windows Wizard
    {
        oldText: `                                    <div className="flex items-center">
                                        <span className="text-3xl font-black text-white">Go</span>
                                        <span className="text-3xl font-black text-red-500">BARRY</span>
                                    </div>`,
        newText: `                                    <div className="flex items-center">
                                        <img src="../gobarry-logo.png" alt="Go BARRY" className="h-10 w-auto" />
                                    </div>`
    },
    // Wing Mirrors Wizard
    {
        oldText: `                                    <div className="flex items-center">
                                        <span className="text-3xl font-black text-white">Go</span>
                                        <span className="text-3xl font-black text-red-500">BARRY</span>
                                    </div>`,
        newText: `                                    <div className="flex items-center">
                                        <img src="../gobarry-logo.png" alt="Go BARRY" className="h-10 w-auto" />
                                    </div>`
    },
    // Cutting Out/Fuel Wizard
    {
        oldText: `                                    <div className="flex items-center">
                                        <span className="text-3xl font-black text-white">Go</span>
                                        <span className="text-3xl font-black text-red-500">BARRY</span>
                                    </div>`,
        newText: `                                    <div className="flex items-center">
                                        <img src="../gobarry-logo.png" alt="Go BARRY" className="h-10 w-auto" />
                                    </div>`
    },
    // Speedometer Wizard
    {
        oldText: `                                    <div className="flex items-center">
                                        <span className="text-3xl font-black text-white">Go</span>
                                        <span className="text-3xl font-black text-red-500">BARRY</span>
                                    </div>`,
        newText: `                                    <div className="flex items-center">
                                        <img src="../gobarry-logo.png" alt="Go BARRY" className="h-10 w-auto" />
                                    </div>`
    }
];

export default replacements;
