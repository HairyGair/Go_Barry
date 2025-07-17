import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { CATEGORIES, getCategoriesBySeverity } from '../utils/categories';
import CategoryCard from './CategoryCard';

const HomeScreen = ({ onStartDiagnosis, onCategorySelect }) => {
    const criticalIssues = getCategoriesBySeverity('critical');
    const warningIssues = getCategoriesBySeverity('warning');
    const normalIssues = getCategoriesBySeverity('normal');
    const implementedCount = CATEGORIES.filter(c => c.implemented).length;

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <div className="flex items-center">
                                <span className="text-2xl font-bold text-blue-900">Go</span>
                                <span className="text-2xl font-bold text-red-600">NorthEast</span>
                            </div>
                            <span className="ml-4 text-gray-500">Breakdown Guide</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="space-y-8">
                    <div className="text-center">
                        <h1 className="text-3xl font-bold text-gray-900 mb-4">SDC Guide to Engineering Issues</h1>
                        <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-4">
                            Digital wizard for Go North East supervisors to diagnose bus engineering issues systematically, ensuring safety compliance and consistent decision-making.
                        </p>
                        <div className="inline-flex items-center px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                            <span className="text-blue-800 font-medium">
                                {implementedCount} of {CATEGORIES.length} categories implemented • {((implementedCount/CATEGORIES.length)*100).toFixed(1)}% complete
                            </span>
                        </div>
                    </div>

                    <div className="bg-red-50 border-l-4 border-red-600 p-6">
                        <div className="flex items-start">
                            <AlertTriangle className="w-6 h-6 text-red-600 mt-1 mr-3" />
                            <div>
                                <h3 className="text-lg font-semibold text-red-800 mb-2">Safety Declaration</h3>
                                <p className="text-red-700 mb-2">
                                    <strong>Safety is Non-Negotiable.</strong> The safety of everyone—staff, passengers, and the public—is our highest priority.
                                </p>
                                <p className="text-red-700">Any action that compromises safety is unacceptable. When in doubt, seek advice from a competent engineer.</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <button onClick={() => onCategorySelect('brakes')} className="bg-red-600 text-white p-4 rounded-lg hover:bg-red-700 transition-colors">
                            <div className="text-2xl mb-2">🚨</div>
                            <div className="font-semibold">Emergency Stop</div>
                            <div className="text-sm opacity-90">Critical brake issues</div>
                        </button>
                        <button onClick={onStartDiagnosis} className="bg-blue-600 text-white p-4 rounded-lg hover:bg-blue-700 transition-colors">
                            <div className="text-2xl mb-2">📋</div>
                            <div className="font-semibold">All Categories</div>
                            <div className="text-sm opacity-90">Browse all issues</div>
                        </button>
                        <button className="bg-green-600 text-white p-4 rounded-lg hover:bg-green-700 transition-colors">
                            <div className="text-2xl mb-2">🔍</div>
                            <div className="font-semibold">Search Issues</div>
                            <div className="text-sm opacity-90">Find specific problems</div>
                        </button>
                        <button className="bg-purple-600 text-white p-4 rounded-lg hover:bg-purple-700 transition-colors">
                            <div className="text-2xl mb-2">📊</div>
                            <div className="font-semibold">Recent Logs</div>
                            <div className="text-sm opacity-90">View diagnosis history</div>
                        </button>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                            <div className="w-3 h-3 bg-red-600 rounded-full mr-2"></div>
                            Critical Issues (Immediate Stop Required) - {criticalIssues.length} Categories
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {criticalIssues.map(category => (
                                <CategoryCard key={category.id} category={category} onClick={() => onCategorySelect(category.id)} />
                            ))}
                        </div>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                            <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                            High Priority Issues (Changeover Required) - {warningIssues.length} Categories
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {warningIssues.map(category => (
                                <CategoryCard key={category.id} category={category} onClick={() => onCategorySelect(category.id)} />
                            ))}
                        </div>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                            Common Issues (Service Impact) - {normalIssues.length} Categories
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {normalIssues.map(category => (
                                <CategoryCard key={category.id} category={category} onClick={() => onCategorySelect(category.id)} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HomeScreen;