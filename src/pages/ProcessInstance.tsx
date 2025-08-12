import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PauseIcon, PlayIcon, CheckIcon, XIcon, MessageSquareIcon, UserIcon, ChevronDownIcon, ChevronRightIcon, ZoomInIcon, ZoomOutIcon, UserCheckIcon, MaximizeIcon, Loader2Icon, KanbanIcon, NetworkIcon, ClockIcon, CheckCircleIcon, AlertCircleIcon, SearchIcon } from 'lucide-react';
import StatusBadge from '../components/common/StatusBadge';
import ConfirmationModal from '../components/common/ConfirmationModal';
import { mockProcessInstance } from '../data/mockProcessInstance';
import { useTheme } from '../context/ThemeContext';
import { useUiPath } from '../context/UiPathContext';
import BpmnJS from 'bpmn-js';
import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-font/css/bpmn.css';
import '../styles/bpmn-custom.css';
import { ProcessInstanceExecutionHistoryResponse } from '@uipath/uipath-typescript';

interface ProcessInstanceDetails {
  instanceId: string | null;
  folderKey: string | null;
  instanceRuns: { status: string }[] | null;
  instanceDisplayName: string | null;
  latestRunStatus: string | null;
  startedTimeUtc: string | null;
}

interface SDKInstanceRun {
  status: string;
  [key: string]: any;
}

interface SDKProcessInstance {
  instanceId: string | null;
  folderKey: string | null;
  instanceRuns: SDKInstanceRun[] | null;
  instanceDisplayName: string | null;
  latestRunStatus: string | null;
  startedTimeUtc: string | null;
  [key: string]: any;
}

interface StepAttributes {
  spanType?: string;
  status?: string;
  elementId?: string;
  incomingFlowId?: string;
  agentTraceLink?: string;
  orchestratorJobLink?: string;
  actionCenterTaskLink?: string;
  [key: string]: any;
}

interface Stage {
  id: string;
  name: string;
  description?: string;
  processId?: string;
}

interface NestedTask {
  id: string;
  name: string;
  type: string;
  status?: string;
}

interface TaskGroup {
  id: string;
  name: string;
  processKey: string;
  nestedTasks: NestedTask[];
  nestedStages: any[];
}

interface Task {
  id: string;
  name: string;
  stage: string;
  type: string;
  parentTaskGroup?: string;
  status?: 'pending' | 'in_progress' | 'completed';
  assignee?: string;
}

const ProcessInstance: React.FC = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { instanceId, folderKey } = useParams<{ instanceId: string; folderKey: string }>();
  const { sdk, isInitialized } = useUiPath();
  const [showStopModal, setShowStopModal] = useState(false);
  const [expandedStep, setExpandedStep] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [selectedStep, setSelectedStep] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });
  const [lastTouchDistance, setLastTouchDistance] = useState(0);
  const [touchCenter, setTouchCenter] = useState({ x: 0, y: 0 });
  const bpmnContainerRef = useRef<HTMLDivElement>(null);
  const [bpmnXML, setBpmnXML] = useState<string | null>(null);
  const [viewer, setViewer] = useState<any>(null);
  const [instance, setInstance] = useState<ProcessInstanceDetails | null>(null);
  const [executionHistory, setExecutionHistory] = useState<ProcessInstanceExecutionHistoryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [bpmnLoading, setBpmnLoading] = useState(false);
  const [stagesLoading, setStagesLoading] = useState(false);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [containerReady, setContainerReady] = useState(false);
  const [viewMode, setViewMode] = useState<'kanban' | 'process-map'>('process-map');
  const [stages, setStages] = useState<Stage[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoadingByStage, setTasksLoadingByStage] = useState<{ [stageName: string]: boolean }>({});


  // Clean up viewer when switching away from process-map view
  useEffect(() => {
    if (viewMode !== 'process-map' && viewer) {
      console.log('Cleaning up BPMN viewer when switching away from process-map');
      try {
        viewer.destroy();
      } catch (err) {
        console.warn('Error cleaning up viewer:', err);
      }
      setViewer(null);
      setContainerReady(false);
    }
  }, [viewMode, viewer]);

  // console.log("ProcessInstance params:", { instanceId, folderKey });

  // Fetch instance details
  useEffect(() => {
    const fetchInstanceDetails = async () => {
      if (!instanceId || !folderKey) {
        setError('Invalid instance ID or folder key');
        setLoading(false);
        return;
      }

      if (!isInitialized) {
        setLoading(true);
        return;
      }

      try {
        console.log('Fetching instance details...');
        const response = await sdk.maestro.processInstances.getById(instanceId, folderKey) as any;
        console.log('Instance details response:', response);

        // Ensure we have the response data
        if (!response) {
          throw new Error('No response data received');
        }

        // Map the response to our interface, using optional chaining to safely access properties
        const instanceDetails: ProcessInstanceDetails = {
          instanceId: response?.instanceId || null,
          folderKey: response?.folderKey || null,
          instanceRuns: Array.isArray(response?.instanceRuns) ? response.instanceRuns : null,
          instanceDisplayName: response?.instanceDisplayName || response?.packageId || 'Unnamed Process',
          latestRunStatus: response?.latestRunStatus || (response?.instanceRuns?.[0]?.status) || 'unknown',
          startedTimeUtc: response?.startedTimeUtc || response?.instanceRuns?.[0]?.startedTimeUtc || null
        };

        console.log('Processed instance details:', instanceDetails);
        setInstance(instanceDetails);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching instance details:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch instance details');
        setLoading(false);
      }
    };

    fetchInstanceDetails();
  }, [instanceId, folderKey, sdk, isInitialized]);

  // Fetch BPMN XML first (for immediate rendering)
  useEffect(() => {
    const fetchBpmn = async () => {
      if (!instanceId || !folderKey || folderKey === 'null') {
        console.error('Invalid instance or folder key', { instanceId, folderKey });
        setError('Invalid instance or folder key');
        setLoading(false);
        return;
      }

      if (!isInitialized) {
        console.log('SDK not initialized, waiting...');
        return;
      }

      try {
        setBpmnLoading(true);
        console.log('Fetching BPMN for immediate rendering...');
        const response = await sdk.maestro.processInstances.getBpmn(instanceId, folderKey);
        console.log("BPMN fetched for rendering", response ? `${response.substring(0, 200)}...` : 'empty');

        // Set BPMN XML immediately for rendering
        setBpmnXML(response);
        setBpmnLoading(false);

      } catch (err) {
        console.error('Error fetching BPMN:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch BPMN diagram');
        setBpmnLoading(false);

        // Use sample BPMN for testing
        console.log('Using sample BPMN for testing...');
        try {
          const sampleResponse = await fetch('/sample_bpmn.xml');
          const sampleBpmn = await sampleResponse.text();
          setBpmnXML(sampleBpmn);
        } catch (sampleErr) {
          console.error('Failed to load sample BPMN:', sampleErr);
        }
      }
    };

    fetchBpmn();
  }, [instanceId, folderKey, sdk, isInitialized]);

  // Fetch stages immediately (after BPMN is rendered)
  useEffect(() => {
    const fetchStages = async () => {
      if (!instanceId || !folderKey || folderKey === 'null' || !bpmnXML) {
        return;
      }

      if (!isInitialized) {
        return;
      }

      try {
        setStagesLoading(true);
        console.log('Fetching stages...');

        // Extract stages from BPMN - this is fast and synchronous
        const stagesResponse = sdk.maestro.processes.getStages(bpmnXML);
        console.log('Stages loaded:', stagesResponse);
        setStages(stagesResponse || []);
        setStagesLoading(false);

      } catch (err) {
        console.error('Error fetching stages:', err);
        setStagesLoading(false);
      }
    };

    fetchStages();
  }, [instanceId, folderKey, sdk, isInitialized, bpmnXML]);

  // Fetch tasks for all stages in parallel (after stages are loaded)
  useEffect(() => {
    const fetchAllTasks = async () => {
      if (!instanceId || !folderKey || folderKey === 'null' || !bpmnXML || stages.length === 0) {
        return;
      }

      if (!isInitialized) {
        return;
      }

      try {
        setTasksLoading(true);
        console.log('Fetching tasks for all stages in parallel...');

        // Initialize loading state for all stages
        const loadingState: { [stageName: string]: boolean } = {};
        stages.forEach(stage => {
          loadingState[stage.name] = true;
        });
        setTasksLoadingByStage(loadingState);

        // Create promises for all stage task fetching - parallel execution
        const taskPromises = stages.map(async (stage) => {
          try {
            console.log(`Starting task fetch for stage: ${stage.name}`);
            const taskGroups = await sdk.maestro.processes.getTasks(stage.name, bpmnXML, folderKey, 2080572) as TaskGroup[];
            console.log(`Tasks loaded for stage ${stage.name}:`, taskGroups);

            // Update loading state for this stage
            setTasksLoadingByStage(prev => ({
              ...prev,
              [stage.name]: false
            }));

            // Flatten nested tasks into our Task format
            const stageTasks: Task[] = [];
            taskGroups.forEach(taskGroup => {
              taskGroup.nestedTasks.forEach(nestedTask => {
                const status = mapTaskStatus(nestedTask.status);

                // Try to find assignee from execution history as fallback
                const executionStep = executionHistory.find(step =>
                  step.name === nestedTask.name ||
                  getStepAttributes(step).elementId === nestedTask.id
                );

                const assignee = executionStep?.source || 'System';

                stageTasks.push({
                  id: nestedTask.id,
                  name: nestedTask.name,
                  stage: stage.name,
                  type: nestedTask.type,
                  parentTaskGroup: taskGroup.name,
                  status,
                  assignee
                });
              });
            });

            return stageTasks;
          } catch (err) {
            console.error(`Error fetching tasks for stage ${stage.name}:`, err);
            // Update loading state even on error
            setTasksLoadingByStage(prev => ({
              ...prev,
              [stage.name]: false
            }));
            return [];
          }
        });

        // Wait for all task promises to resolve and update tasks progressively
        const allStageResults = await Promise.allSettled(taskPromises);
        const allTasks: Task[] = [];

        allStageResults.forEach((result) => {
          if (result.status === 'fulfilled') {
            allTasks.push(...result.value);
          }
        });

        // If no tasks were fetched from API, use execution history as fallback
        if (allTasks.length === 0 && executionHistory.length > 0) {
          const mockTasks: Task[] = executionHistory.map((step) => {
            const attrs = getStepAttributes(step);
            const status = getStepStatus(step);
            return {
              id: step.id,
              name: step.name || 'Unnamed Task',
              stage: stages[0]?.name || 'Default Stage',
              type: attrs.spanType || 'task',
              status: status === 'completed' ? 'completed' : status === 'active' ? 'in_progress' : 'pending',
              assignee: attrs.user || step.source || 'System'
            };
          });
          setTasks(mockTasks);
        } else {
          setTasks(allTasks);
        }

        setTasksLoading(false);
        console.log('All tasks loaded:', allTasks);

      } catch (err) {
        console.error('Error fetching tasks:', err);
        setTasksLoading(false);
        // Reset all stage loading states on error
        const resetLoadingState: { [stageName: string]: boolean } = {};
        stages.forEach(stage => {
          resetLoadingState[stage.name] = false;
        });
        setTasksLoadingByStage(resetLoadingState);
      }
    };

    fetchAllTasks();
  }, [instanceId, folderKey, sdk, isInitialized, bpmnXML, stages, executionHistory]);

  // Initialize viewer when container is ready and when switching to process-map view
  useEffect(() => {
    if (!bpmnContainerRef.current || viewMode !== 'process-map' || !containerReady) {
      console.log('BPMN container ref not ready or not in process-map view');
      return;
    }

    // Always destroy existing viewer first to prevent conflicts
    if (viewer) {
      console.log('Destroying existing BPMN viewer before creating new one');
      try {
        viewer.destroy();
      } catch (err) {
        console.warn('Error destroying existing viewer:', err);
      }
      setViewer(null);
    }

    console.log('Initializing BPMN viewer...');
    let newViewer: any = null;

    try {
      // Small delay to ensure DOM is fully ready
      setTimeout(() => {
        if (bpmnContainerRef.current && viewMode === 'process-map') {
          newViewer = new BpmnJS({
            container: bpmnContainerRef.current,
            height: '500px'
          });

          setViewer(newViewer);
          console.log('BPMN viewer initialized');
        }
      }, 100);
    } catch (err) {
      console.error('Error initializing BPMN viewer:', err);
      setError('Failed to initialize BPMN viewer');
    }

    return () => {
      if (newViewer) {
        try {
          newViewer.destroy();
        } catch (err) {
          console.warn('Error destroying viewer in cleanup:', err);
        }
      }
    };
  }, [containerReady, viewMode]); // Re-run when container is ready OR when view mode changes

  // Import XML when both viewer and XML are ready
  useEffect(() => {
    const renderBpmn = async () => {
      if (!viewer || !bpmnXML) {
        console.log('Viewer or BPMN XML not ready', { viewer: !!viewer, bpmnXML: !!bpmnXML });
        return;
      }

      try {
        console.log('Importing BPMN XML...');
        const { warnings } = await viewer.importXML(bpmnXML);
        if (warnings.length) {
          console.warn('BPMN import warnings:', warnings);
        }
        console.log('BPMN imported successfully');

        const canvas = viewer.get('canvas');
        canvas.zoom('fit-viewport');
        console.log('Canvas zoomed to fit viewport');
      } catch (err) {
        console.error('Error rendering BPMN:', err);
        setError(`Failed to render BPMN diagram: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    };

    renderBpmn();
  }, [viewer, bpmnXML]);

  // Apply colors when execution history changes
  useEffect(() => {
    if (viewer && bpmnXML && executionHistory.length > 0) {
      // Add a small delay to ensure BPMN is fully rendered
      const timer = setTimeout(() => {
        console.log('Applying colors with delay...');
        applyExecutionColors();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [viewer, bpmnXML, executionHistory]);

  // Fetch execution history
  useEffect(() => {
    const fetchExecutionHistory = async () => {
      if (!instanceId) {
        return;
      }

      if (!isInitialized) {
        return;
      }

      try {
        const history = await sdk.maestro.processInstances.getExecutionHistory(instanceId);
        console.log('Fetched execution history:', history);

        // If no history, create mock data for testing
        if (!history || history.length === 0) {
          console.log('No execution history found, using mock data for testing');
          const mockHistory: any[] = [
            {
              id: 'Event_start',
              name: 'Start event',
              status: 'Ok',
              startTime: new Date().toISOString(),
              endTime: new Date().toISOString(),
              source: 'System',
              attributes: JSON.stringify({
                status: 'Completed',
                elementId: 'Event_start'
              })
            },
            {
              id: 'Activity_VSBAuk',
              name: 'Notification',
              status: 'Ok',
              startTime: new Date().toISOString(),
              endTime: new Date().toISOString(),
              source: 'System',
              attributes: JSON.stringify({
                status: 'Completed',
                elementId: 'Activity_VSBAuk'
              })
            },
            {
              id: 'Activity_DocAnalysis',
              name: 'Document Analysis',
              status: 'Ok',
              startTime: new Date(Date.now() - 300000).toISOString(),
              endTime: new Date(Date.now() - 240000).toISOString(),
              source: 'System',
              attributes: JSON.stringify({
                status: 'Completed',
                elementId: 'Activity_DocAnalysis'
              })
            },
            {
              id: 'Activity_Dn4R6H',
              name: 'Application Intake',
              status: 'Unset',
              startTime: new Date().toISOString(),
              source: 'System',
              attributes: JSON.stringify({
                status: 'InProgress',
                elementId: 'Activity_Dn4R6H'
              })
            }
          ];
          setExecutionHistory(mockHistory);
        } else {
          setExecutionHistory(history);
        }
      } catch (err) {
        console.error('Error fetching execution history:', err);

        // Use mock data on error for testing
        const mockHistory: any[] = [
          {
            id: 'Event_start',
            name: 'Start event',
            status: 'Ok',
            startTime: new Date().toISOString(),
            endTime: new Date().toISOString(),
            source: 'System',
            attributes: JSON.stringify({
              status: 'Completed',
              elementId: 'Event_start'
            })
          },
          {
            id: 'Activity_VSBAuk',
            name: 'Notification',
            status: 'Ok',
            startTime: new Date().toISOString(),
            endTime: new Date().toISOString(),
            source: 'System',
            attributes: JSON.stringify({
              status: 'Completed',
              elementId: 'Activity_VSBAuk'
            })
          },
          {
            id: 'Activity_DocAnalysis',
            name: 'Document Analysis',
            status: 'Ok',
            startTime: new Date(Date.now() - 300000).toISOString(),
            endTime: new Date(Date.now() - 240000).toISOString(),
            source: 'System',
            attributes: JSON.stringify({
              status: 'Completed',
              elementId: 'Activity_DocAnalysis'
            })
          },
          {
            id: 'Activity_Dn4R6H',
            name: 'Application Intake',
            status: 'Unset',
            startTime: new Date().toISOString(),
            source: 'System',
            attributes: JSON.stringify({
              status: 'InProgress',
              elementId: 'Activity_Dn4R6H'
            })
          }
        ];
        setExecutionHistory(mockHistory);
      }
    };

    fetchExecutionHistory();
  }, [instanceId, sdk, isInitialized]);

  // In a real app, we would fetch the process instance based on the ID
  const processInstance = mockProcessInstance;
  // Find the active human task in the process
  const activeHumanTasks = processInstance.steps.filter(step => step.isHumanTask && step.status === 'active');
  // Generate process map nodes and connections based on the process steps

  const transformInstanceResponse = (response: any): ProcessInstanceDetails => ({
    instanceId: response.instanceId,
    folderKey: response.folderKey,
    instanceRuns: response.instanceRuns?.map((run: any) => ({ status: run.status })) || null,
    instanceDisplayName: response.instanceDisplayName,
    latestRunStatus: response.latestRunStatus,
    startedTimeUtc: response.startedTimeUtc
  });

  const handlePause = async () => {
    if (!instanceId || !folderKey) return;

    try {
      await sdk.maestro.processInstances.pause(instanceId, folderKey);
      // Refetch instance details to get updated status
      const response = await sdk.maestro.processInstances.getById(instanceId, folderKey);
      setInstance(transformInstanceResponse(response as any));
    } catch (err) {
      console.error('Error pausing process:', err);
      setError(err instanceof Error ? err.message : 'Failed to pause process');
    }
  };

  const handleResume = async () => {
    if (!instanceId || !folderKey) return;

    try {
      await sdk.maestro.processInstances.resume(instanceId, folderKey);
      // Refetch instance details to get updated status
      const response = await sdk.maestro.processInstances.getById(instanceId, folderKey);
      setInstance(transformInstanceResponse(response as any));
    } catch (err) {
      console.error('Error resuming process:', err);
      setError(err instanceof Error ? err.message : 'Failed to resume process');
    }
  };

  const handleStop = async () => {
    if (!instanceId || !folderKey) return;

    try {
      // await sdk.processInstance.cancel(instanceId, folderKey);
      await sdk.maestro.processInstances.cancel(instanceId, folderKey);
      // await sdk.maestro.processInstances.cancel(instanceId, folderKey);
      // Refetch instance details to get updated status
      const response = await sdk.maestro.processInstances.getById(instanceId, folderKey);
      setInstance(transformInstanceResponse(response as any));
      setShowStopModal(false);
    } catch (err) {
      console.error('Error stopping process:', err);
      setError(err instanceof Error ? err.message : 'Failed to stop process');
    }
  };

  // Helper function to check if instance is in running state
  const isInstanceRunning = instance?.latestRunStatus?.toLowerCase() === 'running';
  const isInstancePaused = instance?.latestRunStatus?.toLowerCase() === 'paused';

  const toggleStep = (stepId: string) => {
    setExpandedStep(expandedStep === stepId ? null : stepId);
  };
  const addComment = () => {
    if (!commentText.trim()) return;
    console.log('Adding comment:', commentText);
    setCommentText('');
  };
  const getStepStatusIcon = (step: ProcessInstanceExecutionHistoryResponse) => {
    const status = getStepStatus(step);
    switch (status) {
      case 'completed':
        return <CheckIcon className="w-5 h-5 text-green-500 dark:text-green-400" />;
      case 'active':
        return <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />;
      default:
        return null;
    }
  };

  const getStepAttributes = (step: ProcessInstanceExecutionHistoryResponse) => {
    try {
      return typeof step.attributes === 'string' ? JSON.parse(step.attributes) : step.attributes || {};
    } catch {
      return {};
    }
  };

  const getStepStatus = (step: ProcessInstanceExecutionHistoryResponse): 'completed' | 'active' | 'pending' => {
    const attrs = getStepAttributes(step);
    if (attrs.status === 'Completed' || step.status === 'Ok') {
      return 'completed';
    } else if (attrs.status === 'InProgress' || step.status === 'Unset') {
      return 'active';
    }
    return 'pending';
  };

  const getStatusDisplay = (step: ProcessInstanceExecutionHistoryResponse) => {
    const attrs = getStepAttributes(step);
    return attrs.status || (step.status === 'Unset' ? 'In Progress' : step.status);
  };

  // Helper function to map SDK status to UI status
  const mapTaskStatus = (sdkStatus?: string): 'pending' | 'in_progress' | 'completed' => {
    if (!sdkStatus) return 'pending';

    switch (sdkStatus.toLowerCase()) {
      case 'completed':
        return 'completed';
      case 'running':
        return 'in_progress';
      case 'pending':
        return 'pending';
      case 'failed':
        return 'completed'; // Show failed tasks as completed with error state
      case 'unknown':
        return 'pending';
      default:
        return 'pending';
    }
  };




  // Apply colors to BPMN elements based on execution history
  const applyExecutionColors = () => {
    try {
      if (!viewer || executionHistory.length === 0) {
        console.log('Cannot apply colors: viewer or execution history not ready');
        return;
      }

      const canvas = viewer.get('canvas');
      const elementRegistry = viewer.get('elementRegistry');

      console.log('Applying execution colors...');
      console.log('Execution history:', executionHistory);

      // Clear previous markers
      elementRegistry.getAll().forEach((element: any) => {
        try {
          canvas.removeMarker(element, 'status-completed');
          canvas.removeMarker(element, 'status-active');
          canvas.removeMarker(element, 'status-error');
        } catch (e) {
          // Ignore errors when removing non-existent markers
        }
      });

      // Log all BPMN elements
      console.log('All BPMN elements:', elementRegistry.getAll().map((el: any) => ({
        id: el.id,
        type: el.type,
        name: el.businessObject?.name
      })));

      // Create a map of element IDs to their execution status
      const elementStatusMap = new Map<string, 'completed' | 'active' | 'error'>();

      executionHistory.forEach(step => {
        const attrs = getStepAttributes(step);
        // Try to find element ID in various possible locations
        const elementId = attrs.elementId || attrs.activityId || step.id;

        // console.log('Processing step:', { 
        //   stepName: step.name, 
        //   elementId, 
        //   attrs, 
        //   status: step.status,
        //   stepData: step 
        // });

        // Determine status
        let stepStatus: 'completed' | 'active' | 'error' | null = null;
        if (step.status === 'Error' || attrs.status === 'Error') {
          stepStatus = 'error';
        } else if (attrs.status === 'Completed' || step.status === 'Ok') {
          stepStatus = 'completed';
        } else if (attrs.status === 'InProgress' || step.status === 'Unset') {
          stepStatus = 'active';
        }

        // Try to find element by various methods
        if (elementId && stepStatus) {
          elementStatusMap.set(elementId, stepStatus);
        }

        // Also try to match by name
        if (step.name && stepStatus) {
          // Find BPMN element by name
          const allElements = elementRegistry.getAll();
          const matchingElements = allElements.filter((el: any) => {
            const businessObject = el.businessObject;
            return businessObject && businessObject.name === step.name;
          });

          matchingElements.forEach((matchingElement: any) => {
            // console.log(`Matched element by name: ${step.name} -> ${matchingElement.id}`);
            elementStatusMap.set(matchingElement.id, stepStatus!);
          });

          // If no exact match, try partial match
          if (matchingElements.length === 0) {
            const partialMatches = allElements.filter((el: any) => {
              const businessObject = el.businessObject;
              return businessObject && businessObject.name &&
                (businessObject.name.includes(step.name) || step.name?.includes(businessObject.name));
            });

            partialMatches.forEach((matchingElement: any) => {
              console.log(`Partial match by name: ${step.name} -> ${matchingElement.id}`);
              elementStatusMap.set(matchingElement.id, stepStatus!);
            });
          }
        }
      });

      console.log('Element status map:', Array.from(elementStatusMap.entries()));

      // Apply CSS class markers to elements
      elementStatusMap.forEach((status, elementId) => {
        try {
          const element = elementRegistry.get(elementId);
          // console.log(`Looking for element ${elementId}:`, element);

          if (!element) {
            console.warn(`Element with ID ${elementId} not found in BPMN`);
            return;
          }

          // Add status marker which will apply our CSS styles
          canvas.addMarker(element, `status-${status}`);
          // console.log(`Applied ${status} marker to element ${elementId}`);

          // Also directly style the SVG element
          const gfx = elementRegistry.getGraphics(element);
          if (gfx) {
            let fillColor = '';
            let strokeColor = '';

            switch (status) {
              case 'completed':
                fillColor = '#10b98130';
                strokeColor = '#059669';
                break;
              case 'active':
                fillColor = '#3b82f620';
                strokeColor = '#2563eb';
                break;
              case 'error':
                fillColor = '#ef444430';
                strokeColor = '#dc2626';
                break;
            }

            // Find and style the shape elements
            const shapes = gfx.querySelectorAll('rect, circle, polygon, path');
            shapes.forEach((shape: SVGElement) => {
              if (shape.classList && shape.classList.contains('djs-visual')) return; // Skip container elements

              shape.style.fill = fillColor;
              shape.style.stroke = strokeColor;
              shape.style.strokeWidth = '3px';

              if (status === 'active') {
                shape.style.animation = 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite';
              }
            });
          }
        } catch (err) {
          console.error(`Error applying color to element ${elementId}:`, err);
        }
      });
    } catch (err) {
      console.error('Error in applyExecutionColors:', err);
    }
  };


  // Add zoom functions with smooth transitions
  const handleZoomIn = () => {
    if (!viewer) return;
    const canvas = viewer.get('canvas');
    const currentZoom = canvas.zoom();
    const newZoom = Math.min(currentZoom * 1.2, 4); // Max zoom 4x
    canvas.zoom(newZoom);
    setZoomLevel(newZoom);
  };

  const handleZoomOut = () => {
    if (!viewer) return;
    const canvas = viewer.get('canvas');
    const currentZoom = canvas.zoom();
    const newZoom = Math.max(currentZoom * 0.8, 0.1); // Min zoom 0.1x
    canvas.zoom(newZoom);
    setZoomLevel(newZoom);
  };

  const handleResetZoom = () => {
    if (!viewer) return;
    const canvas = viewer.get('canvas');
    canvas.zoom('fit-viewport');
    // Get the actual zoom level after fit-viewport
    setTimeout(() => {
      setZoomLevel(canvas.zoom());
    }, 100);
  };

  // Pan functionality with mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only pan with left mouse button and no modifier keys
    if (e.button !== 0 || e.ctrlKey || e.metaKey) return;

    setIsPanning(true);
    setPanStart({ x: e.clientX, y: e.clientY });
    setLastPanPoint({ x: e.clientX, y: e.clientY });

    // Add panning class for cursor
    if (bpmnContainerRef.current) {
      bpmnContainerRef.current.classList.add('panning');
    }

    e.preventDefault();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning || !viewer) return;

    const canvas = viewer.get('canvas');
    const deltaX = e.clientX - lastPanPoint.x;
    const deltaY = e.clientY - lastPanPoint.y;

    // Get current viewbox
    const viewbox = canvas.viewbox();

    // Update viewbox with pan delta (inverted for natural panning feel)
    canvas.viewbox({
      x: viewbox.x - deltaX / viewbox.scale,
      y: viewbox.y - deltaY / viewbox.scale,
      width: viewbox.width,
      height: viewbox.height,
      scale: viewbox.scale
    });

    setLastPanPoint({ x: e.clientX, y: e.clientY });
    e.preventDefault();
  };

  const handleMouseUp = () => {
    setIsPanning(false);

    // Remove panning class
    if (bpmnContainerRef.current) {
      bpmnContainerRef.current.classList.remove('panning');
    }
  };

  // Wheel zoom functionality
  const handleWheel = (e: React.WheelEvent) => {
    if (!viewer) return;

    const canvas = viewer.get('canvas');
    const zoomStep = 0.1;
    const currentZoom = canvas.zoom();

    let newZoom;
    if (e.deltaY < 0) {
      // Zoom in
      newZoom = Math.min(currentZoom * (1 + zoomStep), 4); // Max zoom 4x
    } else {
      // Zoom out
      newZoom = Math.max(currentZoom * (1 - zoomStep), 0.1); // Min zoom 0.1x
    }

    // Get mouse position relative to container
    const rect = bpmnContainerRef.current?.getBoundingClientRect();
    if (rect) {
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Zoom to mouse position
      canvas.zoom(newZoom, { x: mouseX, y: mouseY });
      setZoomLevel(newZoom);
    }

    e.preventDefault();
  };

  // Touch event handlers for mobile and trackpad support
  const getTouchDistance = (touch1: React.Touch, touch2: React.Touch) => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getTouchCenter = (touch1: React.Touch, touch2: React.Touch) => {
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2
    };
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Two-finger pinch/zoom
      const distance = getTouchDistance(e.touches[0], e.touches[1]);
      const center = getTouchCenter(e.touches[0], e.touches[1]);

      setLastTouchDistance(distance);
      setTouchCenter(center);
      e.preventDefault();
    } else if (e.touches.length === 1) {
      // Single finger pan
      const touch = e.touches[0];
      setIsPanning(true);
      setPanStart({ x: touch.clientX, y: touch.clientY });
      setLastPanPoint({ x: touch.clientX, y: touch.clientY });

      if (bpmnContainerRef.current) {
        bpmnContainerRef.current.classList.add('panning');
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!viewer) return;

    if (e.touches.length === 2) {
      // Two-finger pinch/zoom
      const distance = getTouchDistance(e.touches[0], e.touches[1]);
      const center = getTouchCenter(e.touches[0], e.touches[1]);

      if (lastTouchDistance > 0) {
        const canvas = viewer.get('canvas');
        const currentZoom = canvas.zoom();
        const zoomFactor = distance / lastTouchDistance;
        const newZoom = Math.min(Math.max(currentZoom * zoomFactor, 0.1), 4);

        // Get container bounds for zoom center calculation
        const rect = bpmnContainerRef.current?.getBoundingClientRect();
        if (rect) {
          const zoomCenter = {
            x: center.x - rect.left,
            y: center.y - rect.top
          };

          canvas.zoom(newZoom, zoomCenter);
          setZoomLevel(newZoom);
        }
      }

      setLastTouchDistance(distance);
      setTouchCenter(center);
      e.preventDefault();
    } else if (e.touches.length === 1 && isPanning) {
      // Single finger pan
      const touch = e.touches[0];
      const canvas = viewer.get('canvas');
      const deltaX = touch.clientX - lastPanPoint.x;
      const deltaY = touch.clientY - lastPanPoint.y;

      const viewbox = canvas.viewbox();
      canvas.viewbox({
        x: viewbox.x - deltaX / viewbox.scale,
        y: viewbox.y - deltaY / viewbox.scale,
        width: viewbox.width,
        height: viewbox.height,
        scale: viewbox.scale
      });

      setLastPanPoint({ x: touch.clientX, y: touch.clientY });
      e.preventDefault();
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length === 0) {
      // All touches ended
      setIsPanning(false);
      setLastTouchDistance(0);

      if (bpmnContainerRef.current) {
        bpmnContainerRef.current.classList.remove('panning');
      }
    } else if (e.touches.length === 1) {
      // One finger left, reset pan
      const touch = e.touches[0];
      setLastPanPoint({ x: touch.clientX, y: touch.clientY });
      setLastTouchDistance(0);
    }
  };

  // Global mouse event listeners for pan continuation outside container
  React.useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isPanning || !viewer) return;

      const canvas = viewer.get('canvas');
      const deltaX = e.clientX - lastPanPoint.x;
      const deltaY = e.clientY - lastPanPoint.y;

      const viewbox = canvas.viewbox();
      canvas.viewbox({
        x: viewbox.x - deltaX / viewbox.scale,
        y: viewbox.y - deltaY / viewbox.scale,
        width: viewbox.width,
        height: viewbox.height,
        scale: viewbox.scale
      });

      setLastPanPoint({ x: e.clientX, y: e.clientY });
    };

    const handleGlobalMouseUp = () => {
      setIsPanning(false);
      if (bpmnContainerRef.current) {
        bpmnContainerRef.current.classList.remove('panning');
      }
    };

    if (isPanning) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isPanning, lastPanPoint, viewer]);

  // Get the active human task from execution history
  const lastHistoryEntry = executionHistory.length > 0
    ? executionHistory[executionHistory.length - 1]
    : null;

  // Check conditions and update task link if needed
  useEffect(() => {
    console.log('instance', instance?.instanceDisplayName);
    console.log('lastHistoryEntry full object:', lastHistoryEntry);
    console.log('executionHistory length:', executionHistory.length);

    // Check if we have the required conditions
    const isDevConCase = instance?.instanceDisplayName?.startsWith('DevCon_CaseManagement') ?? false;
    const attributes = lastHistoryEntry?.attributes
      ? (typeof lastHistoryEntry.attributes === 'string'
        ? JSON.parse(lastHistoryEntry.attributes) as StepAttributes
        : lastHistoryEntry.attributes as StepAttributes)
      : null;

    const isApplicationIntake = lastHistoryEntry?.id === '297e494b-15bb-4dc0-b110-7c484b7a90e0' ||
      attributes?.elementId === 'Activity_xE1BKW';

    console.log('Conditions check:', { isDevConCase, isApplicationIntake });

    if (isDevConCase && isApplicationIntake && executionHistory.length > 0 && lastHistoryEntry) {
      console.log('---------------------------Updating task link...');

      // Create a copy of the last history entry with the hardcoded task link
      const updatedAttributes = {
        ...(typeof lastHistoryEntry.attributes === 'string'
          ? JSON.parse(lastHistoryEntry.attributes)
          : lastHistoryEntry.attributes || {}),
        actionCenterTaskLink: 'https://alpha.uipath.com/bc2ddac5-57bc-40e6-93fe-3b319b60ce36/298392f1-e565-4aeb-bf72-3f1e7d0ebc27/actions_/tasks/7009063'
      };

      const updatedLastEntry: ProcessInstanceExecutionHistoryResponse = {
        ...lastHistoryEntry,
        attributes: JSON.stringify(updatedAttributes)
      };

      console.log('Updated entry:', updatedLastEntry);

      // Update the execution history with the modified entry
      setExecutionHistory(prev => [
        ...prev.slice(0, -1),
        updatedLastEntry
      ]);
    }
  }, [instance?.instanceDisplayName, lastHistoryEntry?.id, lastHistoryEntry?.attributes, executionHistory.length, instance]);

  const hasActiveHumanTask = lastHistoryEntry ? getStepAttributes(lastHistoryEntry).actionCenterTaskLink : undefined;

  const handleOpenTask = (taskUrl: string | undefined) => {
    if (!taskUrl) return;
    const processTaskUrl = `/process/tasks?taskUrl=${encodeURIComponent(taskUrl)}`;
    window.open(processTaskUrl, '_blank');
  };


  if (!isInitialized) {
    return (
      <div className="pt-16 md:ml-64 min-h-screen">
        <div className="p-4">
          <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
            <Loader2Icon className="w-8 h-8 animate-spin text-blue-500" />
            <span className="ml-3">Initializing...</span>
          </div>
        </div>
      </div>
    );
  }

  if (loading || !instance) {
    return (
      <div className="pt-16 md:ml-64 min-h-screen">
        <div className="p-4">
          <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
            <Loader2Icon className="w-8 h-8 animate-spin text-blue-500" />
            <span className="ml-3">Loading process details...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pt-16 md:ml-64 min-h-screen">
        <div className="p-4">
          <div className="text-red-500">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-16 md:ml-64 min-h-screen">
      <div className="p-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold">{instance.instanceDisplayName}</h1>
            <div className="flex items-center mt-2">
              <StatusBadge status={instance.latestRunStatus?.toLowerCase()} />
              <span className="ml-3 text-sm text-gray-500 dark:text-gray-400">
                Started: {instance.startedTimeUtc ? new Date(instance.startedTimeUtc).toLocaleString() : 'Not available'}
              </span>
            </div>
          </div>
          <div className="flex space-x-2">
            {/* Go To Active Step button */}
            {/* <button 
              className="px-4 py-2 bg-blue-500 text-white rounded-lg flex items-center" 
              onClick={handleGoToActiveStep}
            >
              <CornerDownRightIcon className="w-5 h-5 mr-2" />
              Go-to
            </button> */}
            {isInstanceRunning && (
              <button
                className="px-4 py-2 bg-yellow-500 text-white rounded-lg flex items-center"
                onClick={handlePause}
              >
                <PauseIcon className="w-5 h-5 mr-2" />
                Pause
              </button>
            )}
            {isInstancePaused && (
              <button
                className="px-4 py-2 bg-green-500 text-white rounded-lg flex items-center"
                onClick={handleResume}
              >
                <PlayIcon className="w-5 h-5 mr-2" />
                Resume
              </button>
            )}
            {isInstanceRunning && (
              <button
                className="px-4 py-2 bg-red-500 text-white rounded-lg flex items-center"
                onClick={() => setShowStopModal(true)}
              >
                <XIcon className="w-5 h-5 mr-2" />
                Stop
              </button>
            )}
          </div>
        </div>
        {/* Human Task indicator if there is an active human task */}
        {hasActiveHumanTask && lastHistoryEntry && (
          <div className={`mb-6 p-4 rounded-lg border-l-4 border-blue-500 ${theme === 'dark' ? 'bg-gray-800' : 'bg-blue-50'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <UserCheckIcon className="w-5 h-5 mr-2 text-blue-500" />
                <div>
                  <h3 className="font-medium">Human task awaiting action</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {lastHistoryEntry.name || 'Unnamed Task'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleOpenTask(getStepAttributes(lastHistoryEntry).actionCenterTaskLink)}
                className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg flex items-center"
              >
                Open Task
              </button>
            </div>
          </div>
        )}

        {/* View Mode Toggle */}
        <div className={`mb-4 p-2 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'} inline-flex`}>
          <button
            onClick={() => setViewMode('kanban')}
            className={`px-4 py-2 rounded-md flex items-center space-x-2 transition-colors ${viewMode === 'kanban'
                ? theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-white text-gray-900 shadow'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
              }`}
          >
            <KanbanIcon className="w-4 h-4" />
            <span>Stages</span>
          </button>
          <button
            onClick={() => setViewMode('process-map')}
            className={`px-4 py-2 rounded-md flex items-center space-x-2 transition-colors ${viewMode === 'process-map'
                ? theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-white text-gray-900 shadow'
                : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
              }`}
          >
            <NetworkIcon className="w-4 h-4" />
            <span>Process Map</span>
          </button>
        </div>

        {viewMode === 'kanban' ? (
          /* Kanban Board View */
          <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow`}>
            {stagesLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2Icon className="w-6 h-6 animate-spin text-blue-500 mr-2" />
                <div className="text-gray-500">Loading stages...</div>
              </div>
            )}
            {!stagesLoading && (
              <>
                {/* Tab Headers */}
                <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
                  <nav className="-mb-px flex space-x-8">
                    <button className="py-2 px-1 border-b-2 border-blue-500 font-medium text-sm text-blue-600 dark:text-blue-400">
                      Stages
                    </button>
                  </nav>
                </div>

                {/* Tasks Loading Indicator */}
                {tasksLoading && (
                  <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex items-center">
                      <Loader2Icon className="w-4 h-4 animate-spin text-blue-500 mr-2" />
                      <span className="text-sm text-blue-700 dark:text-blue-300">Loading tasks for all stages...</span>
                    </div>
                  </div>
                )}

                {/* Search Bar */}
                <div className="mb-6">
                  <div className="relative">
                    <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search tasks"
                      className={`w-full pl-10 pr-4 py-2 rounded-lg border ${theme === 'dark'
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                        } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                    <button className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Kanban Columns */}
                <div className="overflow-x-auto pb-4">
                  <div className="flex space-x-4 min-w-max">
                    {stages.length > 0 ? (
                      stages.map((stage) => {
                        const stageTasks = tasks.filter(task => task.stage === stage.name);
                        const isCompleted = stageTasks.length > 0 && stageTasks.every(t => t.status === 'completed');
                        const isInProgress = stageTasks.some(t => t.status === 'in_progress');
                        const isStageTasksLoading = tasksLoadingByStage[stage.name] || false;

                        return (
                          <div key={stage.id} className="flex-shrink-0 w-80">
                            <div className={`rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'} p-4`}>
                              {/* Stage Header */}
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center space-x-2">
                                  <h3 className="font-semibold text-sm">{stage.name}</h3>
                                  {isStageTasksLoading && (
                                    <Loader2Icon className="w-3 h-3 animate-spin text-blue-500" />
                                  )}
                                  {!isStageTasksLoading && isCompleted && (
                                    <span className="text-xs text-green-600 dark:text-green-400 font-medium">Complete</span>
                                  )}
                                  {!isStageTasksLoading && isInProgress && !isCompleted && (
                                    <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">In progress</span>
                                  )}
                                </div>
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                  {isStageTasksLoading ? 'Loading...' : `${stageTasks.length} ${stageTasks.length === 1 ? 'task' : 'tasks'}`}
                                </span>
                              </div>

                              {/* Stage Summary */}
                              <div className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                                {isStageTasksLoading ? 'Loading tasks...' :
                                  isCompleted ? 'Stage complete' :
                                    isInProgress ? 'Stage in progress' : 'Stage pending'}
                              </div>

                              {/* Tasks */}
                              <div className="space-y-3">
                                {isStageTasksLoading ? (
                                  <div className="text-center py-4">
                                    <Loader2Icon className="w-4 h-4 animate-spin text-blue-500 mx-auto mb-2" />
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Loading tasks...</p>
                                  </div>
                                ) : (
                                  <>
                                    {stageTasks.map((task) => {
                                      const taskTypeIcon = () => {
                                        switch (task.type) {
                                          case 'userTask':
                                            return <UserIcon className="w-3 h-3 text-blue-500" />;
                                          case 'serviceTask':
                                            return <svg className="w-3 h-3 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                                            </svg>;
                                          case 'scriptTask':
                                            return <svg className="w-3 h-3 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                                            </svg>;
                                          default:
                                            return <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                            </svg>;
                                        }
                                      };

                                      return (
                                        <div
                                          key={task.id}
                                          className={`p-3 rounded-lg border ${theme === 'dark'
                                              ? 'bg-gray-800 border-gray-600'
                                              : 'bg-white border-gray-200'
                                            } shadow-sm hover:shadow-md transition-shadow cursor-pointer`}
                                        >
                                          <div className="flex items-start justify-between mb-2">
                                            <h4 className="font-medium text-sm flex items-center">
                                              {task.status === 'completed' && (
                                                <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2" />
                                              )}
                                              {task.status === 'in_progress' && (
                                                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse mr-2" />
                                              )}
                                              {task.status === 'pending' && (
                                                <ClockIcon className="w-4 h-4 text-gray-400 mr-2" />
                                              )}
                                              {task.name}
                                            </h4>
                                            {taskTypeIcon()}
                                          </div>
                                          {task.parentTaskGroup && (
                                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                              {task.parentTaskGroup}
                                            </div>
                                          )}
                                          <div className="flex items-center justify-between text-xs">
                                            <div className="flex items-center space-x-3">
                                              <span className="text-gray-500 dark:text-gray-400">
                                                {task.status === 'completed' ? 'Completed by' : 'Assigned to'}: {task.assignee}
                                              </span>
                                            </div>
                                            {task.status === 'completed' && (
                                              <span className="text-green-600 dark:text-green-400">Complete</span>
                                            )}
                                            {task.status === 'in_progress' && (
                                              <span className="text-blue-600 dark:text-blue-400">In Progress</span>
                                            )}
                                            {task.status === 'pending' && (
                                              <span className="text-gray-500 dark:text-gray-400">Pending</span>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}

                                    {stageTasks.length === 0 && (
                                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                        <p className="text-sm">No tasks in this stage</p>
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      /* Default stages when no stages are available */
                      ['Application', 'Processing', 'Underwriting', 'Contract', 'Fulfillment'].map((stageName, index) => (
                        <div key={index} className="flex-shrink-0 w-80">
                          <div className={`rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'} p-4`}>
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center space-x-2">
                                <h3 className="font-semibold text-sm">{stageName}</h3>
                                {index === 0 && (
                                  <span className="text-xs text-green-600 dark:text-green-400 font-medium">Complete</span>
                                )}
                                {index === 1 && (
                                  <span className="text-xs text-green-600 dark:text-green-400 font-medium">Complete</span>
                                )}
                                {index === 2 && (
                                  <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">In progress</span>
                                )}
                              </div>
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                {index < 3 ? `${index + 1} task` : '0 tasks'}
                              </span>
                            </div>

                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                              Stage {index < 2 ? 'complete' : index === 2 ? 'in progress' : 'pending'}
                            </div>

                            <div className="space-y-3">
                              {index < executionHistory.length && (
                                <div
                                  className={`p-3 rounded-lg border ${theme === 'dark'
                                      ? 'bg-gray-800 border-gray-600'
                                      : 'bg-white border-gray-200'
                                    } shadow-sm hover:shadow-md transition-shadow cursor-pointer`}
                                >
                                  <div className="flex items-start justify-between mb-2">
                                    <h4 className="font-medium text-sm flex items-center">
                                      {getStepStatusIcon(executionHistory[index])}
                                      <span className="ml-2">{executionHistory[index].name}</span>
                                    </h4>
                                  </div>
                                  <div className="flex items-center justify-between text-xs">
                                    {/* <span className="text-gray-500 dark:text-gray-400">
                                  Completed by: {executionHistory[index].source}
                                </span> */}
                                    <span className={`${getStepStatus(executionHistory[index]) === 'completed'
                                        ? 'text-green-600 dark:text-green-400'
                                        : getStepStatus(executionHistory[index]) === 'active'
                                          ? 'text-blue-600 dark:text-blue-400'
                                          : 'text-gray-500 dark:text-gray-400'
                                      }`}>
                                      {getStatusDisplay(executionHistory[index])}
                                    </span>
                                  </div>
                                </div>
                              )}

                              {index >= executionHistory.length && (
                                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                  <p className="text-sm">No tasks in this stage</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          /* Process Map View */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow lg:col-span-2`}>
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center space-x-6">
                  <h2 className="text-lg font-medium">Process Map</h2>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={handleZoomIn}
                    className={`p-2 rounded-lg ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                    title="Zoom In"
                  >
                    <ZoomInIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleZoomOut}
                    className={`p-2 rounded-lg ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                    title="Zoom Out"
                  >
                    <ZoomOutIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleResetZoom}
                    className={`p-2 rounded-lg ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                    title="Reset Zoom"
                  >
                    <MaximizeIcon className="w-5 h-5" />
                  </button>
                  <div className={`px-3 py-1 text-sm rounded-lg ${theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                    {Math.round(zoomLevel * 100)}%
                  </div>
                </div>
              </div>
              <div
                ref={(el) => {
                  if (el && viewMode === 'process-map') {
                    (bpmnContainerRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
                    // Always trigger container ready when switching to process-map
                    setContainerReady(true);
                  } else if (!el) {
                    // Container unmounted, reset ready state
                    (bpmnContainerRef as React.MutableRefObject<HTMLDivElement | null>).current = null;
                    setContainerReady(false);
                  }
                }}
                className={`bpmn-container border rounded-lg ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}
                style={{ height: '500px', minHeight: '500px', width: '100%' }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onWheel={handleWheel}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                {bpmnLoading && (
                  <div className="flex items-center justify-center h-full">
                    <Loader2Icon className="w-6 h-6 animate-spin text-blue-500 mr-2" />
                    <div className="text-gray-500">Loading BPMN diagram...</div>
                  </div>
                )}
                {!bpmnLoading && !viewer && !bpmnXML && (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-gray-500">Initializing BPMN viewer...</div>
                  </div>
                )}
                {error && (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-red-500">{error}</div>
                  </div>
                )}
              </div>
            </div>
            {/* Task Progress Overview */}
            <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow`}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium">Task Progress</h2>
                {hasActiveHumanTask && activeHumanTasks.length > 0 && (
                  <button
                    className="px-3 py-1.5 bg-blue-500 text-white text-sm rounded-lg flex items-center"
                    onClick={() => setSelectedStep(activeHumanTasks[0].id)}
                  >
                    <UserCheckIcon className="w-4 h-4 mr-1.5" />
                    Open Active Task
                  </button>
                )}
              </div>

              {/* Progress Summary */}
              <div className="mb-6">
                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <span>Progress</span>
                  <span>{executionHistory.filter(step => getStepStatus(step) === 'completed').length} of {executionHistory.length} tasks completed</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${executionHistory.length > 0 ? (executionHistory.filter(step => getStepStatus(step) === 'completed').length / executionHistory.length) * 100 : 0}%`
                    }}
                  ></div>
                </div>
              </div>

              {/* Task List */}
              <div className="space-y-3">
                {executionHistory.map((step, index) => {
                  const status = getStepStatus(step);
                  const attrs = getStepAttributes(step);

                  return (
                    <div
                      key={step.id}
                      className={`flex items-center p-3 rounded-lg border transition-all duration-200 ${theme === 'dark' ? 'border-gray-700 bg-gray-750' : 'border-gray-200 bg-gray-50'
                        } ${status === 'active' ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}`}
                    >
                      {/* Status Icon */}
                      <div className="flex-shrink-0 mr-4">
                        {status === 'completed' && (
                          <CheckCircleIcon className="w-6 h-6 text-green-500" />
                        )}
                        {status === 'active' && (
                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                            <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                          </div>
                        )}
                        {status === 'pending' && (
                          <ClockIcon className="w-6 h-6 text-gray-400" />
                        )}
                      </div>

                      {/* Task Info */}
                      <div className="flex-grow">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-sm">{step.name || 'Unnamed Task'}</h3>
                          <div className="flex items-center space-x-2">
                            {/* Status Badge */}
                            <span className={`px-2 py-1 text-xs rounded-full font-medium ${status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                status === 'active' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                                  'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                              }`}>
                              {status === 'completed' ? 'Completed' : status === 'active' ? 'In Progress' : 'Pending'}
                            </span>



                            {/* Action Button for Active Human Tasks */}
                            {status === 'active' && attrs.actionCenterTaskLink && (
                              <button
                                onClick={() => handleOpenTask(attrs.actionCenterTaskLink)}
                                className="px-2 py-1 bg-blue-500 text-white text-xs rounded flex items-center hover:bg-blue-600 transition-colors"
                              >
                                <UserCheckIcon className="w-3 h-3 mr-1" />
                                Open
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Task Details */}
                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 flex items-center space-x-4">
                          <span>Assigned to: {step.source || 'System'}</span>
                          {step.startTime && (
                            <span>
                              {status === 'completed' ? 'Completed' : 'Started'}: {new Date(step.startTime).toLocaleString(undefined, {
                                hour: '2-digit',
                                minute: '2-digit',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </span>
                          )}
                        </div>


                      </div>
                    </div>
                  );
                })}

                {executionHistory.length === 0 && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <ClockIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No task history available</p>
                  </div>
                )}
              </div>
            </div>
            {/* Audit Log Section */}
            <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow`}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium">Audit History</h2>
                <div className="flex items-center">
                  <input
                    type="text"
                    placeholder="Add comment..."
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    className={`mr-2 px-3 py-1 text-sm rounded-lg border ${theme === 'dark'
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                      }`}
                  />
                  <button
                    onClick={addComment}
                    className="px-3 py-1.5 bg-blue-500 text-white text-sm rounded-lg flex items-center"
                  >
                    Add Comment
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                {executionHistory.map(step => {
                  const attrs = getStepAttributes(step);
                  // Only show steps that have audit-relevant information
                  if (!attrs.comment && !attrs.user && step.status !== 'Error') {
                    return null;
                  }
                  return (
                    <div key={`audit-${step.id}`} className={`border rounded-lg overflow-hidden ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                      <div className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            {step.status === 'Error' ? (
                              <XIcon className="w-5 h-5 text-red-500 mr-3" />
                            ) : attrs.user ? (
                              <UserIcon className="w-5 h-5 text-blue-500 mr-3" />
                            ) : (
                              <MessageSquareIcon className="w-5 h-5 text-gray-500 mr-3" />
                            )}
                            <div>
                              <div className="font-medium">
                                {attrs.user ? `Action by ${attrs.user}` : step.name}
                              </div>
                              {attrs.comment && (
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {attrs.comment}
                                </div>
                              )}
                              {step.status === 'Error' && (
                                <div className="text-sm text-red-500">
                                  {attrs.errorMessage || 'An error occurred'}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {step.startTime && new Date(step.startTime).toLocaleString(undefined, {
                              hour: '2-digit',
                              minute: '2-digit',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {executionHistory.every(step => {
                  const attrs = getStepAttributes(step);
                  return !attrs.comment && !attrs.user && step.status !== 'Error';
                }) && (
                    <div className="text-center text-gray-500 dark:text-gray-400 py-4">
                      No audit entries yet
                    </div>
                  )}
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Stop Confirmation Modal */}
      <ConfirmationModal
        isOpen={showStopModal}
        title="Stop Process"
        message="Are you sure you want to stop this process? This action cannot be undone."
        confirmText="Stop Process"
        cancelText="Cancel"
        requireJustification={true}
        onConfirm={handleStop}
        onCancel={() => setShowStopModal(false)}
      />
    </div>
  );
};

export default ProcessInstance;