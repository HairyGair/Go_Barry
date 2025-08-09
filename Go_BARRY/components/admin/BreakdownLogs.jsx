// Go_BARRY/components/admin/BreakdownLogs.jsx
// Admin component for viewing and managing breakdown logs

const BreakdownLogs = () => {
    const [logs, setLogs] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);
    const [filters, setFilters] = React.useState({
        supervisorId: '',
        vehicleReg: '',
        breakdownType: '',
        startDate: '',
        endDate: ''
    });
    const [pagination, setPagination] = React.useState({
        limit: 50,
        offset: 0,
        total: null
    });

    // Get API base URL
    const API_BASE_URL = window.location.hostname === 'localhost' 
        ? 'http://localhost:3001' 
        : 'https://go-barry.onrender.com';

    // Fetch breakdown logs
    const fetchLogs = React.useCallback(async () => {
        setLoading(true);
        setError(null);
        
        try {
            // Build query string
            const queryParams = new URLSearchParams({
                limit: pagination.limit,
                offset: pagination.offset,
                ...Object.entries(filters).reduce((acc, [key, value]) => {
                    if (value) acc[key] = value;
                    return acc;
                }, {})
            });
            
            const response = await fetch(`${API_BASE_URL}/api/admin-breakdowns?${queryParams}`);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch breakdown logs');
            }
            
            setLogs(data.logs);
            setPagination(prev => ({ ...prev, total: data.pagination.total }));
            
        } catch (err) {
            setError(err.message);
            console.error('Error fetching breakdown logs:', err);
        } finally {
            setLoading(false);
        }
    }, [filters, pagination.limit, pagination.offset, API_BASE_URL]);

    // Initial load and refresh on breakdown logged
    React.useEffect(() => {
        fetchLogs();
        
        // Listen for new breakdowns
        const handleBreakdownLogged = () => {
            fetchLogs();
        };
        
        window.addEventListener('breakdownLogged', handleBreakdownLogged);
        return () => window.removeEventListener('breakdownLogged', handleBreakdownLogged);
    }, [fetchLogs]);

    // Format timestamp for display
    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Handle filter changes
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        setPagination(prev => ({ ...prev, offset: 0 })); // Reset to first page
    };

    // Handle pagination
    const handlePageChange = (newOffset) => {
        setPagination(prev => ({ ...prev, offset: newOffset }));
    };

    // Get unique breakdown types for filter dropdown
    const breakdownTypes = React.useMemo(() => {
        const types = new Set(logs.map(log => log.breakdown_type));
        return Array.from(types).sort();
    }, [logs]);

    // Export to CSV
    const exportToCSV = () => {
        const csvContent = [
            ['Timestamp', 'Supervisor ID', 'Vehicle Reg', 'Fleet No', 'Breakdown Type'],
            ...logs.map(log => [
                formatTimestamp(log.timestamp),
                log.supervisor_id,
                log.vehicle_reg,
                log.fleet_no,
                log.breakdown_type
            ])
        ].map(row => row.join(',')).join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `breakdown_logs_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    };

    // Get color classes for breakdown type
    const getBreakdownTypeColor = (type) => {
        const colors = {
            'Steering': 'bg-red-100 text-red-800',
            'Brakes': 'bg-red-100 text-red-800',
            'Loose Wheel Nuts': 'bg-red-100 text-red-800',
            'Battery': 'bg-yellow-100 text-yellow-800',
            'ABS Light': 'bg-yellow-100 text-yellow-800',
            'Oil Warning Light': 'bg-red-100 text-red-800',
            'Doors': 'bg-orange-100 text-orange-800',
            'Overheating': 'bg-purple-100 text-purple-800',
            'Low Water': 'bg-blue-100 text-blue-800',
            'Wipers/Screenwash': 'bg-green-100 text-green-800',
            'Non-Starter': 'bg-orange-100 text-orange-800',
            'Excessive Smoke': 'bg-gray-100 text-gray-800',
            'Fuel Problem': 'bg-purple-100 text-purple-800',
            'Suspension': 'bg-indigo-100 text-indigo-800',
            'Exterior Lights': 'bg-yellow-100 text-yellow-800',
            'Interior Lights': 'bg-gray-100 text-gray-800',
            'Wing Mirrors': 'bg-blue-100 text-blue-800',
            'Broken Windows': 'bg-red-100 text-red-800',
            'Puncture': 'bg-orange-100 text-orange-800',
            'Road Traffic Incident': 'bg-red-100 text-red-800'
        };
        return colors[type] || 'bg-gray-100 text-gray-800';
    };

    return (
        <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Breakdown Logs</h2>
                
                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-4">
                    <input
                        type="text"
                        name="supervisorId"
                        placeholder="Supervisor ID"
                        value={filters.supervisorId}
                        onChange={handleFilterChange}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    
                    <input
                        type="text"
                        name="vehicleReg"
                        placeholder="Vehicle Reg"
                        value={filters.vehicleReg}
                        onChange={handleFilterChange}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    
                    <select
                        name="breakdownType"
                        value={filters.breakdownType}
                        onChange={handleFilterChange}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">All Types</option>
                        {breakdownTypes.map(type => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </select>
                    
                    <input
                        type="date"
                        name="startDate"
                        value={filters.startDate}
                        onChange={handleFilterChange}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    
                    <input
                        type="date"
                        name="endDate"
                        value={filters.endDate}
                        onChange={handleFilterChange}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                
                <div className="flex justify-between items-center">
                    <button
                        onClick={fetchLogs}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
                    >
                        Apply Filters
                    </button>
                    
                    <button
                        onClick={exportToCSV}
                        disabled={logs.length === 0}
                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md transition-colors disabled:bg-gray-300"
                    >
                        Export to CSV
                    </button>
                </div>
            </div>

            {/* Loading state */}
            {loading && (
                <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
            )}

            {/* Error state */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                    <p>Error: {error}</p>
                </div>
            )}

            {/* Logs table */}
            {!loading && !error && (
                <>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Timestamp
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Supervisor
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Vehicle
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Fleet No
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Type
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {logs.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                                            No breakdown logs found
                                        </td>
                                    </tr>
                                ) : (
                                    logs.map(log => (
                                        <tr key={log.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {formatTimestamp(log.timestamp)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {log.supervisor_id}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {log.vehicle_reg}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {log.fleet_no}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getBreakdownTypeColor(log.breakdown_type)}`}>
                                                    {log.breakdown_type}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {pagination.total > pagination.limit && (
                        <div className="mt-4 flex justify-center items-center space-x-2">
                            <button
                                onClick={() => handlePageChange(Math.max(0, pagination.offset - pagination.limit))}
                                disabled={pagination.offset === 0}
                                className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>
                            
                            <span className="text-sm text-gray-700">
                                Page {Math.floor(pagination.offset / pagination.limit) + 1} of {Math.ceil(pagination.total / pagination.limit)}
                            </span>
                            
                            <button
                                onClick={() => handlePageChange(pagination.offset + pagination.limit)}
                                disabled={pagination.offset + pagination.limit >= pagination.total}
                                className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

// Export for use in admin dashboard
window.BreakdownLogs = BreakdownLogs;
