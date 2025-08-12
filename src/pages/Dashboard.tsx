import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchIcon, BarChart2Icon, ChevronRightIcon, Loader2Icon, ChevronLeftIcon } from 'lucide-react';
import StatusBadge from '../components/common/StatusBadge';
import { useTheme } from '../context/ThemeContext';
import { useUiPath } from '../context/UiPathContext';

const Dashboard: React.FC = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const { processes, loading, error, hasMoreResults, currentPage, loadNextPage, loadPreviousPage } = useUiPath();

  // Filter processes based on search term
  const filteredProcesses = processes.filter(process => {
    // Search filter
    if (searchTerm && !process.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    return true;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Navigate to process instances page
  const navigateToprocessInstance = (processKey: string) => {
    navigate(`/process-instances/${processKey}`);
  };

  return (
    <div className="pt-16 md:ml-64 min-h-screen">
      <div className="p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Process Portfolio</h1>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center"
            onClick={() => navigate('/insights')}
          >
            <BarChart2Icon className="w-5 h-5 mr-2" />
            Create Insight Report
          </button>
        </div>

        {/* Search bar */}
        <div className="mb-6">
          <div className="flex items-center mb-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search processes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`pl-10 pr-4 py-2 w-full rounded-lg border ${
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex flex-col justify-center items-center py-12">
            <Loader2Icon className="w-8 h-8 animate-spin text-blue-500 mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading processes...</p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">Connecting to UiPath Cloud</p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 mb-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Failed to load processes
                </h3>
                <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                  <p>{error}</p>
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => window.location.reload()}
                    className="bg-red-100 dark:bg-red-800 px-3 py-2 rounded-md text-sm font-medium text-red-800 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-700"
                  >
                    Retry
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Process list grid */}
        {!loading && !error && (
          <>
            <div className="overflow-x-auto">
              <table
                className={`min-w-full divide-y ${
                  theme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'
                }`}
              >
                <thead className={theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'}>
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                    >
                      Name
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                    >
                      Started At
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody
                  className={`divide-y ${
                    theme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'
                  }`}
                >
                  {filteredProcesses.map((process) => (
                    <tr
                      key={process.id}
                      className={`${
                        theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                      }`}
                    >
                      <td className="px-6 py-4 max-w-[450px]">{process.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={process.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {formatDate(process.startedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          className="flex items-center text-blue-500 hover:text-blue-700"
                          onClick={() => navigateToprocessInstance(process.processKey)}
                        >
                          View Instances
                          <ChevronRightIcon className="w-4 h-4 ml-1" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="mt-4 flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={loadPreviousPage}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                    currentPage === 1
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-blue-500 hover:text-blue-700'
                  }`}
                >
                  Previous
                </button>
                <button
                  onClick={loadNextPage}
                  disabled={!hasMoreResults}
                  className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                    !hasMoreResults
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-blue-500 hover:text-blue-700'
                  }`}
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Page <span className="font-medium">{currentPage}</span>
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={loadPreviousPage}
                      disabled={currentPage === 1}
                      className={`relative inline-flex items-center px-2 py-2 rounded-l-md border ${
                        theme === 'dark'
                          ? 'border-gray-700 bg-gray-800'
                          : 'border-gray-300 bg-white'
                      } text-sm font-medium ${
                        currentPage === 1
                          ? 'text-gray-400 cursor-not-allowed'
                          : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <ChevronLeftIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={loadNextPage}
                      disabled={!hasMoreResults}
                      className={`relative inline-flex items-center px-2 py-2 rounded-r-md border ${
                        theme === 'dark'
                          ? 'border-gray-700 bg-gray-800'
                          : 'border-gray-300 bg-white'
                      } text-sm font-medium ${
                        !hasMoreResults
                          ? 'text-gray-400 cursor-not-allowed'
                          : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <ChevronRightIcon className="h-5 w-5" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;