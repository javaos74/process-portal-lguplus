import React, { createContext, useContext, useEffect, useState } from 'react';
// import { UiPath } from '@uipath/uipath-typescript';
import { UiPath } from '@uipath/uipath-typescript';
interface ProcessData {
    id: string;
    name: string;
    status: string;
    startedAt: string;
    processKey: string;
}
interface GetAllOptions {
    processKey: string;
    pageSize: number;
    nextPage?: string;
    sortBy?: string;
    sortDirection?: string;
    [key: string]: string | number | undefined;
}

interface UiPathContextType {
    processes: ProcessData[];
    loading: boolean;
    error: string | null;
    sdk: UiPath;
    isInitialized: boolean;
    hasMoreResults: boolean;
    currentPage: number;
    loadNextPage: () => Promise<void>;
    loadPreviousPage: () => Promise<void>;
}
// Environment variables with fallbacks (Vite uses import.meta.env)
const getEnvVar = (name: string, fallback?: string) => {
    const value = import.meta.env[name] || fallback;
    console.log(`${name}:`, value ? `${value.substring(0, 20)}...` : 'NOT SET');
    return value;
};

// Get environment variables with fallbacks
const UIPATH_BASE_URL = getEnvVar('VITE_UIPATH_BASE_URL', 'https://staging.uipath.com');
const UIPATH_SECRET = getEnvVar('VITE_UIPATH_SECRET', 'eyJhbGciOiJSUzI1NiIsImtpZCI6Ijg1Njk5RDIwNzA4RkE0RTU5REU3QkQ1RjYzNzhDOTM5MDJFQ0QwMDMiLCJ4NXQiOiJoV21kSUhDUHBPV2Q1NzFmWTNqSk9RTHMwQU0iLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3N0YWdpbmcudWlwYXRoLmNvbS9pZGVudGl0eV8iLCJuYmYiOjE3NTQ5OTQ4MzMsImlhdCI6MTc1NDk5NTEzMywiZXhwIjoxNzU0OTk4NzMzLCJhdWQiOlsiT3JjaGVzdHJhdG9yQXBpVXNlckFjY2VzcyIsIkNvbm5lY3Rpb25TZXJ2aWNlIiwiRGF0YVNlcnZpY2UiLCJEb2N1bWVudFVuZGVyc3RhbmRpbmciLCJFbnRlcnByaXNlQ29udGV4dFNlcnZpY2UiLCJJZGVudGl0eVNlcnZlckFwaSIsIkphbUphbUFwaSIsIkxMTUdhdGV3YXkiLCJMTE1PcHMiLCJPTVMiLCJSZXNvdXJjZUNhdGFsb2dTZXJ2aWNlQXBpIl0sInNjb3BlIjpbIk9yY2hlc3RyYXRvckFwaVVzZXJBY2Nlc3MiLCJDb25uZWN0aW9uU2VydmljZSIsIkRhdGFTZXJ2aWNlIiwiRG9jdW1lbnRVbmRlcnN0YW5kaW5nIiwiRW50ZXJwcmlzZUNvbnRleHRTZXJ2aWNlIiwiRGlyZWN0b3J5IiwiSmFtSmFtQXBpIiwiTExNR2F0ZXdheSIsIkxMTU9wcyIsIk9NUyIsIlJDUy5Gb2xkZXJBdXRob3JpemF0aW9uIiwib2ZmbGluZV9hY2Nlc3MiXSwiYW1yIjpbImV4dGVybmFsIl0sInN1Yl90eXBlIjoidXNlciIsImNsaWVudF9pZCI6IjM2ZGVhNWI4LWU4YmItNDIzZC04ZTdiLWM4MDhkZjhmMWMwMCIsInN1YiI6Ijc3ZWQ1NDk0LTA1MGUtNDYwZS04MjkwLWE1YTI5OWU4MjJiZCIsImF1dGhfdGltZSI6MTc1NDk5NTExNiwiaWRwIjoib2lkYyIsImVtYWlsIjoiY2hhcmxlcy5rQGtha2FvLmNvbSIsIkFzcE5ldC5JZGVudGl0eS5TZWN1cml0eVN0YW1wIjoiNVJLTlI3RVI0STdWQ1FYQzNIQ0UzU0dLWjNPU0NBRloiLCJhdXRoMF9jb24iOiJVc2VybmFtZS1QYXNzd29yZC1BdXRoZW50aWNhdGlvbiIsImNvdW50cnkiOiIiLCJleHRfc3ViIjoiYXV0aDB8NjdhZWE0NzIwNGE4OGY0M2MyMzdiZDhkIiwibWFya2V0aW5nQ29uZGl0aW9uQWNjZXB0ZWQiOiJUcnVlIiwicGljdHVyZSI6Imh0dHBzOi8vcy5ncmF2YXRhci5jb20vYXZhdGFyLzM5ZWM1MTczYjc5YWFhNDU0ZGViZTllY2Y2ZjRhZDc0P3M9NDgwXHUwMDI2cj1wZ1x1MDAyNmQ9aHR0cHMlM0ElMkYlMkZjZG4uYXV0aDAuY29tJTJGYXZhdGFycyUyRmNoLnBuZyIsInBydF9pZCI6IjE4MzM3ZjhlLTlkZWEtNGNkZC05NTk2LTNhZDQ0ODMwOGJjNSIsImhvc3QiOiJGYWxzZSIsImZpcnN0X25hbWUiOiJDaGFybGVzIiwibGFzdF9uYW1lIjoiS2ltIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInByZWZlcnJlZF91c2VybmFtZSI6ImNoYXJsZXMua0BrYWthby5jb20iLCJuYW1lIjoiY2hhcmxlcy5rQGtha2FvLmNvbSIsImV4dF9pZHBfaWQiOiIxIiwiZXh0X2lkcF9kaXNwX25hbWUiOiJHbG9iYWxJZHAiLCJzaWQiOiJDNDA5NEQwNzgxMDdBQkMwNDE0QjZENTc5RTdBQjQ3NiJ9.luyYFO9Vef1cxkktB5XonKV32Fth_HgRgED2C_plUFlXRuPvs61YX_mpHGYcYlzdPP_wQrhzUYjVpN9Xxcgf9398lRHYiGIfFGm7RERH3R_Ni2tMD_ZQNFqpkq8hXWkFjDyil1xWQ2GlMLrnO-YQFp1iY-zaJx-D-7U24014kwNpe9TbsC5NKk-CoDd5W3-vF2JYmnP9M5IsUpLYbIBGA_hyPOSr3YK-hvU5hdbkP3uYK9XHiOzoDGbogU2bOffkzDzLO0TArNph7Cphgq8jZSegCPhaJf__XwOuPtYP43qhqiuyaBiMmOBgkXhtaPXUd3mGzWQBXLHSgxdp6BA80w');
const UIPATH_ORG_NAME = getEnvVar('VITE_UIPATH_ORG_NAME', 'lgdemo');
const UIPATH_TENANT_NAME = getEnvVar('VITE_UIPATH_TENANT_NAME', 'LGCNS');

console.log('Environment variables loaded successfully');

console.log('Creating UiPath SDK instance...');
let sdk: UiPath;
try {
    sdk = new UiPath({
        baseUrl: UIPATH_BASE_URL!,
        secret: UIPATH_SECRET!,
        orgName: UIPATH_ORG_NAME!,
        tenantName: UIPATH_TENANT_NAME!
    });
    console.log('UiPath SDK instance created successfully');
} catch (error) {
    console.error('Failed to create UiPath SDK instance:', error);
    // Create a dummy SDK instance to prevent app crash
    sdk = {} as UiPath;
}

const UiPathContext = createContext<UiPathContextType>({
    processes: [],
    loading: true,
    error: null,
    sdk,
    isInitialized: false,
    hasMoreResults: false,
    currentPage: 1,
    loadNextPage: async () => { },
    loadPreviousPage: async () => { }
});

export const useUiPath = () => useContext(UiPathContext);

export const UiPathProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [processes, setProcesses] = useState<ProcessData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [hasMoreResults, setHasMoreResults] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [nextPageToken, setNextPageToken] = useState<string | null>(null);
    const [pageHistory, setPageHistory] = useState<string[]>([]);
    const [isInitialized, setIsInitialized] = useState(false);

    // Helper function to extract the last part of packageId after the last dot
    const getProcessDisplayName = (packageId: string, folderName: string): string => {
        if (!packageId) return `Unknown Process (${folderName})`;
        
        // Split by dot and get the last part
        const parts = packageId.split('.');
        const lastPart = parts[parts.length - 1];
        
        return `${lastPart} (${folderName})`;
    };

    const fetchProcessesForPage = async (pageToken: string | null = null) => {
        try {
            console.log('Fetching processes from UiPath API...');
            const processesData = (await sdk.maestro.processes.getAll());
            console.log('Raw processes data:', processesData);
            
            // Log the first process to see all available properties
            if (processesData.length > 0) {
                console.log('Process object properties:', Object.keys(processesData[0]));
                console.log('First process data:', processesData[0]);
            }
            
            const initialProcesses = processesData.map(process => ({
                id: process.processKey,
                name: getProcessDisplayName(process.packageId, process.folderName),
                status: 'Loading...',
                startedAt: '',
                processKey: process.processKey,
                folderKey: process.folderKey
            }));

            // Set initial processes to show immediately
            setProcesses(initialProcesses);
            // (((await sdk.processInstance.getById("ad","ad")).cancel()).cancel()
            // Then fetch instance data for each process
            processesData.forEach(async (process, index) => {
                try {
                    const options: GetAllOptions = {
                        processKey: process.processKey,
                        pageSize: 50,
                        sortBy: 'startedTimeUtc',
                        sortDirection: 'desc'
                    };
                    if (pageToken) {
                        options.nextPage = pageToken;
                    }

                    const response = await sdk.maestro.processInstances.getAll(options);                // Update pagination state if this is the last process

                    // Get the latest instance if available (first in the sorted array)
                    const latestInstance = response[response.length - 1];


                    // Update just this process's data
                    setProcesses(currentProcesses => {
                        const newProcesses = [...currentProcesses];
                        newProcesses[index] = {
                            id: process.processKey,
                            name: getProcessDisplayName(latestInstance?.packageId || process.packageId, process.folderName),
                            status: latestInstance?.latestRunStatus || 'Unknown',
                            startedAt: latestInstance?.startedTime || '',
                            processKey: process.processKey
                        };
                        return newProcesses;
                    });
                } catch (error) {
                    console.error(`Error fetching instances for process ${process.processKey}:`, error);
                    // Update the process with error state
                    setProcesses(currentProcesses => {
                        const newProcesses = [...currentProcesses];
                        newProcesses[index] = {
                            id: process.processKey,
                            name: getProcessDisplayName(process.packageId, process.folderName),
                            status: 'Error',
                            startedAt: '',
                            processKey: process.processKey
                        };
                        return newProcesses;
                    });
                }
            });

            setLoading(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch processes');
            setLoading(false);
        }
    };

    const loadNextPage = async () => {
        if (!hasMoreResults || !nextPageToken) return;

        setLoading(true);
        // Save current page token for history
        setPageHistory(prev => [...prev, nextPageToken]);
        await fetchProcessesForPage(nextPageToken);
        setCurrentPage(prev => prev + 1);
    };

    const loadPreviousPage = async () => {
        if (currentPage <= 1) return;

        setLoading(true);
        const newHistory = [...pageHistory];
        const previousPageToken = newHistory.pop();
        setPageHistory(newHistory);
        await fetchProcessesForPage(previousPageToken || null);
        setCurrentPage(prev => prev - 1);
    };

    useEffect(() => {
        const initializeSdk = async () => {
            try {
                console.log('Initializing UiPath SDK...');
                setLoading(true);
                setError(null);
                
                await sdk.initialize();
                console.log('UiPath SDK initialized successfully');
                setIsInitialized(true);
                
                console.log('Fetching processes...');
                await fetchProcessesForPage();
                console.log('Processes fetched successfully');
            } catch (err) {
                console.error('SDK initialization failed:', err);
                const errorMessage = err instanceof Error ? err.message : 'Failed to initialize SDK';
                setError(errorMessage);
                setLoading(false);
            }
        };

        initializeSdk();
    }, []);

    return (
        <UiPathContext.Provider value={{
            processes,
            loading,
            error,
            sdk,
            isInitialized,
            hasMoreResults,
            currentPage,
            loadNextPage,
            loadPreviousPage
        }}>
            {children}
        </UiPathContext.Provider>
    );
}; 