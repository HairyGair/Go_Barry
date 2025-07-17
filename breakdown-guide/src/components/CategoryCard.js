import React from 'react';

const CategoryCard = ({ category, onClick }) => {
    const severityColors = {
        critical: 'border-red-500 bg-red-50 hover:bg-red-100',
        warning: 'border-yellow-500 bg-yellow-50 hover:bg-yellow-100',
        normal: 'border-green-500 bg-green-50 hover:bg-green-100'
    };

    const isImplemented = category.implemented;

    return (
        <button
            onClick={() => isImplemented ? onClick() : null}
            disabled={!isImplemented}
            className={`p-4 border-2 rounded-lg text-left transition-colors relative ${
                severityColors[category.severity] || severityColors.normal
            } ${!isImplemented ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
        >
            <div className="absolute top-2 right-2">
                {isImplemented ? (
                    <div className="w-3 h-3 bg-green-500 rounded-full" title="Implemented"></div>
                ) : (
                    <div className="w-3 h-3 bg-gray-400 rounded-full" title="Coming Soon"></div>
                )}
            </div>
            
            <div className="flex items-start justify-between mb-2">
                <div className="text-2xl">{category.icon}</div>
                <div className={`text-xs px-2 py-1 rounded-full font-medium ${
                    category.severity === 'critical' ? 'bg-red-200 text-red-800' :
                    category.severity === 'warning' ? 'bg-yellow-200 text-yellow-800' :
                    'bg-green-200 text-green-800'
                }`}>
                    {category.severity.toUpperCase()}
                </div>
            </div>
            <div className="font-semibold text-gray-900 mb-1 pr-6">{category.name}</div>
            <div className="text-sm text-gray-600 mb-2">{category.description}</div>
            
            <div className="text-xs font-medium">
                {isImplemented ? (
                    <span className="text-green-600">Click to diagnose →</span>
                ) : (
                    <span className="text-gray-500">Coming soon</span>
                )}
            </div>
        </button>
    );
};

export default CategoryCard;