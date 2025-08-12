import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, Loader2Icon, PlayIcon } from 'lucide-react';
import StatusBadge from '../components/common/StatusBadge';
import { useTheme } from '../context/ThemeContext';
import { useUiPath } from '../context/UiPathContext';
import { ProcessInstanceGetResponse } from '@uipath/uipath-typescript';
import { useprocessInstance } from '../context/ProcessInstancesContext';

interface InstanceWithCurrentStep extends ProcessInstanceGetResponse {
  currentStep: string | null;
}

const processInstance: React.FC = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { processId } = useParams<{ processId: string }>();
  const { processes, sdk } = useUiPath();
  const { instances, loading, error } = useprocessInstance(processId || '');

  // Get process details
  const process = processes.find(p => p.processKey === processId);

  const formatDate = (dateString: string | null) => {
    return dateString ? new Date(dateString).toLocaleString() : 'Unknown';
  };

  // Navigate to a specific instance
  const navigateToInstance = (instance: InstanceWithCurrentStep) => {
    if (!instance.instanceId || !instance.folderKey) return;
    const url = `/process/${instance.instanceId}/${instance.folderKey}`;
    window.open(url, '_blank');
  };

  // Go back to dashboard
  const goBack = () => {
    navigate('/dashboard');
  };

  // Handle running the process
  const handleRunProcess = async () => {
    try {
      if (!processId) {
        alert('Process ID not found');
        return;
      }
      
      console.log("Starting process with releaseKey:", processId, "folderKey:", instances[0]?.folderKey);
      await sdk.process.startProcess({releaseKey: processId}, instances[0]?.folderKey);
      alert('Process started successfully!');
      // Refresh the page to show the new instance
      window.location.reload();
    } catch (error) {
      console.error('Error starting process:', error);
      alert('Failed to start process. Please try again.');
    }
  };

  if (!process) {
    return (
      <div className="pt-16 md:ml-64 min-h-screen">
        <div className="p-4">
          <div className="flex items-center mb-6">
            <button
              onClick={goBack}
              className="mr-4 p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </button>
            <div className="flex items-center">
              <Loader2Icon className="w-6 h-6 animate-spin text-blue-500" />
              <span className="ml-2">Loading process...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="pt-16 md:ml-64 min-h-screen">
      <div className="p-4">
        <div className="flex items-center mb-6">
          <button
            onClick={goBack}
            className="mr-4 p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold">{process.name} Instances</h1>
              <button
                onClick={handleRunProcess}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <PlayIcon className="w-4 h-4" />
                Run
              </button>
            </div>
            <div className="flex items-center mt-1">
              <StatusBadge status={process.status} />
            </div>
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex justify-center items-center py-8">
            <Loader2Icon className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="text-red-500 bg-red-100 p-4 rounded-lg mb-4">
            Error loading instances: {error}
          </div>
        )}

        {/* No instances state */}
        {!loading && !error && instances.length === 0 && (
          <div
            className={`p-8 text-center rounded-lg ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-white'
            } shadow`}
          >
            <p className="text-lg">No instances found for this process.</p>
          </div>
        )}

        {/* Instances table */}
        {!loading && !error && instances.length > 0 && (
          <div
            className={`rounded-lg ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-white'
            } shadow overflow-hidden`}
          >
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className={theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}>
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
                      Current Step
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                    >
                      Started At
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {instances.map((instance) => (
                    <tr
                      key={instance.instanceId}
                      className={`cursor-pointer ${
                        theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => navigateToInstance(instance)}
                    >
                      <td className="px-6 py-4 max-w-[220px]">
                        {instance.instanceDisplayName || 'Unnamed Instance'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={instance.latestRunStatus} />
                      </td>
                      <td className="px-6 py-4 max-w-[300px]">
                        <div className="text-sm">
                          {instance.historyLoading ? (
                            <div className="flex items-center">
                              <Loader2Icon className="w-4 h-4 animate-spin mr-2" />
                              <span className="text-gray-500">Loading current step...</span>
                            </div>
                          ) : instance.historyError ? (
                            <div className="flex items-center">
                              <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                              <span className="text-red-500">Error loading step info</span>
                            </div>
                          ) : (
                            <div className="flex items-start">
                              <div className={`w-2 h-2 rounded-full mr-2 mt-1.5 ${
                                instance.currentStep?.includes('Currently at:') ? 'bg-blue-500 animate-pulse' :
                                instance.currentStep?.includes('Last completed:') ? 'bg-green-500' :
                                'bg-gray-400'
                              }`}></div>
                              <span className="text-gray-900 dark:text-gray-100 leading-relaxed">
                                {instance.currentStep || 'No step information'}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {formatDate(instance.startedTime)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default processInstance;