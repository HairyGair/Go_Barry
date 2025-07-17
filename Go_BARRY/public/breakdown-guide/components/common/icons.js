// Common icon components for the breakdown guide
const AlertTriangle = ({ className = "w-4 h-4", ...props }) => (
    React.createElement('svg', {
        className,
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
        ...props
    }, React.createElement('path', {
        strokeLinecap: "round",
        strokeLinejoin: "round",
        strokeWidth: 2,
        d: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 18.5c-.77.833.192 2.5 1.732 2.5z"
    }))
);

const ArrowLeft = ({ className = "w-4 h-4", ...props }) => (
    React.createElement('svg', {
        className,
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
        ...props
    }, React.createElement('path', {
        strokeLinecap: "round",
        strokeLinejoin: "round",
        strokeWidth: 2,
        d: "M10 19l-7-7m0 0l7-7m-7 7h18"
    }))
);

const ArrowRight = ({ className = "w-4 h-4", ...props }) => (
    React.createElement('svg', {
        className,
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
        ...props
    }, React.createElement('path', {
        strokeLinecap: "round",
        strokeLinejoin: "round",
        strokeWidth: 2,
        d: "M14 5l7 7m0 0l-7 7m7-7H3"
    }))
);

const Home = ({ className = "w-4 h-4", ...props }) => (
    React.createElement('svg', {
        className,
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
        ...props
    }, React.createElement('path', {
        strokeLinecap: "round",
        strokeLinejoin: "round",
        strokeWidth: 2,
        d: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
    }))
);

const CheckCircle = ({ className = "w-4 h-4", ...props }) => (
    React.createElement('svg', {
        className,
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
        ...props
    }, React.createElement('path', {
        strokeLinecap: "round",
        strokeLinejoin: "round",
        strokeWidth: 2,
        d: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
    }))
);

const XCircle = ({ className = "w-4 h-4", ...props }) => (
    React.createElement('svg', {
        className,
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
        ...props
    }, React.createElement('path', {
        strokeLinecap: "round",
        strokeLinejoin: "round",
        strokeWidth: 2,
        d: "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
    }))
);

const FileText = ({ className = "w-4 h-4", ...props }) => (
    React.createElement('svg', {
        className,
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
        ...props
    }, React.createElement('path', {
        strokeLinecap: "round",
        strokeLinejoin: "round",
        strokeWidth: 2,
        d: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
    }))
);

const Shield = ({ className = "w-4 h-4", ...props }) => (
    React.createElement('svg', {
        className,
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
        ...props
    }, React.createElement('path', {
        strokeLinecap: "round",
        strokeLinejoin: "round",
        strokeWidth: 2,
        d: "M20.618 5.984A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
    }))
);

const AlertCircle = ({ className = "w-4 h-4", ...props }) => (
    React.createElement('svg', {
        className,
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
        ...props
    }, React.createElement('path', {
        strokeLinecap: "round",
        strokeLinejoin: "round",
        strokeWidth: 2,
        d: "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    }))
);

const Phone = ({ className = "w-4 h-4", ...props }) => (
    React.createElement('svg', {
        className,
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
        ...props
    }, React.createElement('path', {
        strokeLinecap: "round",
        strokeLinejoin: "round",
        strokeWidth: 2,
        d: "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
    }))
);

const Door = ({ className = "w-4 h-4", ...props }) => (
    React.createElement('svg', {
        className,
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
        ...props
    }, React.createElement('rect', {
        x: "4",
        y: "4",
        width: "16",
        height: "16",
        rx: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        strokeWidth: 2
    }), React.createElement('circle', {
        cx: "16",
        cy: "12",
        r: "1",
        fill: "currentColor"
    }))
);

const Tool = ({ className = "w-4 h-4", ...props }) => (
    React.createElement('svg', {
        className,
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
        ...props
    }, React.createElement('path', {
        strokeLinecap: "round",
        strokeLinejoin: "round",
        strokeWidth: 2,
        d: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
    }), React.createElement('path', {
        strokeLinecap: "round",
        strokeLinejoin: "round",
        strokeWidth: 2,
        d: "M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    }))
);

const Wind = ({ className = "w-4 h-4", ...props }) => (
    React.createElement('svg', {
        className,
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
        ...props
    }, React.createElement('path', {
        strokeLinecap: "round",
        strokeLinejoin: "round",
        strokeWidth: 2,
        d: "M9.59 4.59A2 2 0 1110.414 6L8 8.414M9.59 19.41A2 2 0 1110.414 18L8 15.586M21.41 14.59A2 2 0 1120 13.414L17.586 16M14.59 21.41A2 2 0 1113.414 20L16 17.586M4.59 9.41A2 2 0 116 10.414L8.414 8M19.41 4.59A2 2 0 1118 6.414L15.586 9"
    }))
);

const Package = ({ className = "w-4 h-4", ...props }) => (
    React.createElement('svg', {
        className,
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
        ...props
    }, React.createElement('path', {
        strokeLinecap: "round",
        strokeLinejoin: "round",
        strokeWidth: 2,
        d: "M16 16l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
    }))
);

const Gauge = ({ className = "w-4 h-4", ...props }) => (
    React.createElement('svg', {
        className,
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
        ...props
    }, React.createElement('path', {
        strokeLinecap: "round",
        strokeLinejoin: "round",
        strokeWidth: 2,
        d: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
    }))
);

const Power = ({ className = "w-4 h-4", ...props }) => (
    React.createElement('svg', {
        className,
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
        ...props
    }, React.createElement('path', {
        strokeLinecap: "round",
        strokeLinejoin: "round",
        strokeWidth: 2,
        d: "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
    }))
);

const Search = ({ className = "w-4 h-4", ...props }) => (
    React.createElement('svg', {
        className,
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
        ...props
    }, React.createElement('path', {
        strokeLinecap: "round",
        strokeLinejoin: "round",
        strokeWidth: 2,
        d: "m21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    }))
);

const Wrench = ({ className = "w-4 h-4", ...props }) => (
    React.createElement('svg', {
        className,
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
        ...props
    }, React.createElement('path', {
        strokeLinecap: "round",
        strokeLinejoin: "round",
        strokeWidth: 2,
        d: "M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 011-1h1a2 2 0 100-4H7a1 1 0 01-1-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"
    }))
);

const Info = ({ className = "w-4 h-4", ...props }) => (
    React.createElement('svg', {
        className,
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
        ...props
    }, React.createElement('path', {
        strokeLinecap: "round",
        strokeLinejoin: "round",
        strokeWidth: 2,
        d: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    }))
);

const Lightbulb = ({ className = "w-4 h-4", ...props }) => (
    React.createElement('svg', {
        className,
        fill: "none",
        stroke: "currentColor",
        viewBox: "0 0 24 24",
        ...props
    }, React.createElement('path', {
        strokeLinecap: "round",
        strokeLinejoin: "round",
        strokeWidth: 2,
        d: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
    }))
);

// Export icons to global scope for use in other components
window.Icons = {
    AlertTriangle,
    ArrowLeft,
    ArrowRight,
    Home,
    CheckCircle,
    XCircle,
    FileText,
    Shield,
    AlertCircle,
    Phone,
    Door,
    Tool,
    Wind,
    Package,
    Gauge,
    Power,
    Search,
    Wrench,
    Info,
    Lightbulb
};
