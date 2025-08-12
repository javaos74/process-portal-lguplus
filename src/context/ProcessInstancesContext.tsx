import React, { useEffect, useState } from 'react';
import { useUiPath } from './UiPathContext';
import { ProcessInstanceGetResponse, ProcessInstanceExecutionHistoryResponse } from '@uipath/uipath-typescript';

// Helper functions for processing step information
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

const getStatusDisplayText = (status: 'completed' | 'active' | 'pending', attributes: any): string => {
    switch (status) {
        case 'completed':
            return 'Completed';
        case 'active':
            return 'In Progress';
        case 'pending':
            return 'Waiting';
        default:
            return 'Unknown';
    }
};

interface InstanceWithHistory extends ProcessInstanceGetResponse {
    executionHistory: ProcessInstanceExecutionHistoryResponse[];
    historyLoading: boolean;
    historyError?: boolean;
    currentStep: string | null;
}

interface GetAllOptions {
    processKey: string;
    pageSize: number;
    nextPage?: string;
    sortBy?: string;
    sortDirection?: string;
    [key: string]: string | number | undefined;
}

export const useprocessInstance = (processKey: string | undefined) => {
    const [instances, setInstances] = useState<InstanceWithHistory[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [hasMoreResults, setHasMoreResults] = useState(false);
    const [nextPageToken, setNextPageToken] = useState<string | undefined>(undefined);
    const { sdk } = useUiPath();

    const fetchInstances = async (pageToken: string | undefined = undefined) => {
        try {
            setLoading(true);
            const options: GetAllOptions = {
                processKey: processKey || '',
                pageSize: 50
            };
            if (pageToken) {
                options.nextPage = pageToken;
            }

            const instancesData = await sdk.maestro.processInstances.getAll(options);
            // Show instances immediately with loading state for history
            const initialInstances = (instancesData || []).map(instance => ({
                ...instance,
                executionHistory: [],
                historyLoading: true,
                currentStep: 'Loading...'
            }));
            
            setInstances(initialInstances);
            // setHasMoreResults(instancesData.hasMoreResults || false);
            // const nextPage = instancesData.nextPage;
            // setNextPageToken(nextPage === null ? undefined : nextPage);

            // Then fetch execution history for each instance one by one
            (instancesData || []).forEach(async (instance, index) => {
                if (!instance.instanceId) return;

                try {
                    
                    const history = await sdk.maestro.processInstances.getExecutionHistory(instance.instanceId);
                    history.forEach(step => {
                        console.log("step.createdTime", step.createdTime)
                    })
                    
                    // Create a more human-readable current step description
                    let currentStep = 'No steps';
                    if (history.length > 0) {
                        const latestStep = history[history.length - 1];
                        const stepAttributes = getStepAttributes(latestStep);
                        const stepStatus = getStepStatus(latestStep);
                        
                        // Create a descriptive current step message
                        const stepName = latestStep.name || 'Unnamed Step';
                        const statusText = getStatusDisplayText(stepStatus, stepAttributes);
                        const assignee = latestStep.source || 'System';
                        
                        if (stepStatus === 'active') {
                            currentStep = `Currently at: ${stepName} (${statusText} - Assigned to ${assignee})`;
                        } else if (stepStatus === 'completed') {
                            currentStep = `Last completed: ${stepName} (${statusText})`;
                        } else {
                            currentStep = `Pending: ${stepName} (${statusText})`;
                        }
                    }
                    // Update just this instance's history and current step
                    setInstances(currentInstances => {
                        const newInstances = [...currentInstances];
                        newInstances[index] = {
                            ...newInstances[index],
                            executionHistory: history,
                            historyLoading: false,
                            currentStep
                        };
                        return newInstances;
                    });
                } catch (error) {
                    console.error(`Error fetching history for instance ${instance.instanceId}:`, error);
                    // Update the instance with error state
                    setInstances(currentInstances => {
                        const newInstances = [...currentInstances];
                        newInstances[index] = {
                            ...newInstances[index],
                            executionHistory: [],
                            historyLoading: false,
                            historyError: true,
                            currentStep: 'Error loading step'
                        };
                        return newInstances;
                    });
                }
            });

            setLoading(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch instances');
            setLoading(false);
        }
    };

    useEffect(() => {
        if (processKey) {
            fetchInstances();
        }
    }, [processKey, sdk]);

    return { instances, loading, error, hasMoreResults, nextPageToken };
}; 