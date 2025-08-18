import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchIcon, BarChart2Icon, ChevronRightIcon, Loader2Icon, ChevronLeftIcon, TrendingUpIcon, CheckCircleIcon, XCircleIcon, CalendarIcon } from 'lucide-react';
import StatusBadge from '../components/common/StatusBadge';
import { useTheme } from '../context/ThemeContext';
import { useUiPath } from '../context/UiPathContext';

const Dashboard: React.FC = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const { 
    processes, 
    loading, 
    error, 
    hasMoreResults, 
    currentPage, 
    loadNextPage, 
    loadPreviousPage,
    maestroSummary,
    summaryLoading,
    summaryError,
    fetchMaestroSummary
  } = useUiPath();

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

        {/* Maestro Process Summary */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Maestro Process 요약</h2>
            <button
              onClick={fetchMaestroSummary}
              disabled={summaryLoading}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {summaryLoading ? '새로고침 중...' : '새로고침'}
            </button>
          </div>
          
          {/* Summary Loading State */}
          {summaryLoading && (
            <div className="flex justify-center items-center py-8">
              <Loader2Icon className="w-6 h-6 animate-spin text-blue-500 mr-2" />
              <span className="text-gray-600 dark:text-gray-400">요약 데이터를 불러오는 중...</span>
            </div>
          )}
          
          {/* Summary Error State */}
          {summaryError && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
              <p className="text-red-800 dark:text-red-200">요약 데이터 로드 실패: {summaryError}</p>
            </div>
          )}
          
          {/* Summary Cards */}
          {maestroSummary && !summaryLoading && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className={`p-6 rounded-lg border ${
              theme === 'dark' 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-200'
            }`}>
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <TrendingUpIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">총 실행 건수</p>
                  <p className="text-2xl font-bold">{maestroSummary.totalInstances.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className={`p-6 rounded-lg border ${
              theme === 'dark' 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-200'
            }`}>
              <div className="flex items-center">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <CheckCircleIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">성공률</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{maestroSummary.successRate}%</p>
                </div>
              </div>
            </div>

            <div className={`p-6 rounded-lg border ${
              theme === 'dark' 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-200'
            }`}>
              <div className="flex items-center">
                <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                  <XCircleIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">실패율</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">{maestroSummary.failureRate}%</p>
                </div>
              </div>
            </div>
          </div>
          )}

          {/* Daily Execution Table */}
          {maestroSummary && !summaryLoading && (
          <div className={`rounded-lg border ${
            theme === 'dark' 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200'
          }`}>
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <CalendarIcon className="w-5 h-5 text-gray-500 dark:text-gray-400 mr-2" />
                <h3 className="text-lg font-medium">주별 실행 현황</h3>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className={theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      주간
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      총 실행 건수
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      성공
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      실패
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      실행중
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      대기중
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      성공률
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {maestroSummary.weeklyExecutions.map((week) => (
                    <tr key={week.weekStart} className={theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {week.weekLabel}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {week.count.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 dark:text-green-400">
                        {week.successful.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 dark:text-red-400">
                        {week.failed.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 dark:text-blue-400">
                        {week.running.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600 dark:text-yellow-400">
                        {week.pending.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center">
                          <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-2 mr-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full" 
                              style={{ width: `${week.count > 0 ? (week.successful / week.count) * 100 : 0}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-medium">
                            {week.count > 0 ? ((week.successful / week.count) * 100).toFixed(1) : '0.0'}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          )}
        </div>

        {/* Process List Section */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">프로세스 목록</h2>
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