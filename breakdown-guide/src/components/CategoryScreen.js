import React from 'react';
import { ArrowLeft } from 'lucide-react';
import CategoryCard from './CategoryCard';
import { getCategoriesBySeverity } from '../utils/categories';

const CategoryScreen = ({ categories, onBack, onCategorySelect }) => {
    const criticalIssues = getCategoriesBySeverity('critical');
    const warningIssues = getCategoriesBySeverity('warning');
    const normalIssues = getCategoriesBySeverity('normal');

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <button
                                onClick={onBack}
                                className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div className="flex items-center">
                                <span className="text-2xl font-bold text-blue-900">Go</span>
                                <span className="text-2xl font-bold text-red-600">NorthEast</span>
                            </div>
                            <span className="ml-4 text-gray-500">Select Issue Category</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="space-y-8">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                            <div className="w-3 h-3 bg-red-600 rounded-full mr-2"></div>
                            Critical Issues (Immediate Stop Required)
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {criticalIssues.map(category => (
                                <CategoryCard
                                    key={category.id}
                                    category={category}
                                    onClick={() => onCategorySelect(category.id)}
                                />
                            ))}
                        </div>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                            <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                            High Priority Issues (Changeover Required)
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {warningIssues.map(category => (
                                <CategoryCard
                                    key={category.id}
                                    category={category}
                                    onClick={() => onCategorySelect(category.id)}
                                />
                            ))}
                        </div>
                    </div>

                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                            Common Issues (Service Impact)
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {normalIssues.map(category => (
                                <CategoryCard
                                    key={category.id}
                                    category={category}
                                    onClick={() => onCategorySelect(category.id)}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CategoryScreen;