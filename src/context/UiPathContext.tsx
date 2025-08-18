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

interface MaestroSummary {
    totalInstances: number;
    successRate: number;
    failureRate: number;
    weeklyExecutions: WeeklyExecution[];
}

interface WeeklyExecution {
    weekStart: string;
    weekEnd: string;
    weekLabel: string;
    count: number;
    successful: number;
    failed: number;
    running: number;
    pending: number;
    other: number;
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
    maestroSummary: MaestroSummary | null;
    summaryLoading: boolean;
    summaryError: string | null;
    fetchMaestroSummary: () => Promise<void>;
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
    loadPreviousPage: async () => { },
    maestroSummary: null,
    summaryLoading: false,
    summaryError: null,
    fetchMaestroSummary: async () => { }
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

    // Maestro Summary states
    const [maestroSummary, setMaestroSummary] = useState<MaestroSummary | null>(null);
    const [summaryLoading, setSummaryLoading] = useState(false);
    const [summaryError, setSummaryError] = useState<string | null>(null);

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
                        pageSize: 100, // Increase to get more recent instances
                        sortBy: 'startedTimeUtc',
                        sortDirection: 'desc'
                    };
                    if (pageToken) {
                        options.nextPage = pageToken;
                    }

                    const response = await sdk.maestro.processInstances.getAll(options);                // Update pagination state if this is the last process

                    // Get the latest instance if available (first in the sorted array since we sort by desc)
                    const latestInstance = response[0];

                    console.log(`Process ${process.processKey}: Found ${response.length} instances, latest: ${latestInstance?.startedTime}`);


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

    const fetchMaestroSummary = async () => {
        try {
            setSummaryLoading(true);
            setSummaryError(null);

            console.log('🚀 Starting fetchMaestroSummary...');
            console.log('📅 Current date for summary calculation:', new Date().toISOString());

            // Check SDK status
            if (!sdk || !sdk.maestro) {
                throw new Error('UiPath SDK is not properly initialized');
            }

            console.log('✅ SDK is available, proceeding with API calls...');

            // Get all processes first
            console.log('🔍 Calling sdk.maestro.processes.getAll()...');
            const processesData = await sdk.maestro.processes.getAll();
            console.log('📋 Found processes:', processesData.length);

            if (!processesData || processesData.length === 0) {
                console.warn('⚠️ No processes found or empty response');
                throw new Error('No processes found in the system');
            }

            console.log('📋 Process list:', processesData.map(p => ({
                processKey: p.processKey,
                name: p.packageId,
                folderName: p.folderName
            })));

            let totalInstances = 0;
            let successfulInstances = 0;
            let failedInstances = 0;
            let runningInstances = 0;
            let pendingInstances = 0;
            let otherInstances = 0;
            const statusCounts: { [key: string]: number } = {};
            const weeklyStats: { [key: string]: { count: number; successful: number; failed: number; running: number; pending: number; other: number; weekStart: string; weekEnd: string; weekLabel: string } } = {};

            // Helper function to get week start (Monday at 00:00:00)
            const getWeekStart = (date: Date): Date => {
                const d = new Date(date);
                const day = d.getDay();
                const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday
                const weekStart = new Date(d.setDate(diff));

                // Set to start of day (00:00:00)
                weekStart.setHours(0, 0, 0, 0);

                console.log(`Week start for ${date.toDateString()}: ${weekStart.toDateString()} ${weekStart.toTimeString()}`);
                return weekStart;
            };

            // Helper function to get week end (Sunday at 23:59:59)
            const getWeekEnd = (weekStart: Date): Date => {
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 6);

                // Set to end of day (23:59:59.999)
                weekEnd.setHours(23, 59, 59, 999);

                return weekEnd;
            };

            // 🗓️ STEP 1: Calculate the last 4 weeks (fixed weeks for consolidation)
            const today = new Date();
            console.log('📅 Today for week calculation:', today.toISOString());

            const last4Weeks = Array.from({ length: 4 }, (_, i) => {
                // Create a fresh date for each week calculation
                const baseDate = new Date(today);
                baseDate.setDate(baseDate.getDate() - (i * 7));

                const weekStart = getWeekStart(baseDate);
                const weekEnd = getWeekEnd(weekStart);

                const weekKey = weekStart.toISOString().split('T')[0];
                const weekLabel = `${weekStart.getMonth() + 1}/${weekStart.getDate()} - ${weekEnd.getMonth() + 1}/${weekEnd.getDate()}`;

                console.log(`🗓️ Week ${i + 1} calculation:`);
                console.log(`   Base date: ${baseDate.toISOString()}`);
                console.log(`   Week start: ${weekStart.toISOString()}`);
                console.log(`   Week end: ${weekEnd.toISOString()}`);
                console.log(`   Week label: ${weekLabel}`);

                return {
                    key: weekKey,
                    start: weekStart.toISOString().split('T')[0],
                    end: weekEnd.toISOString().split('T')[0],
                    label: weekLabel,
                    startDate: new Date(weekStart),
                    endDate: new Date(weekEnd)
                };
            }); // Keep in order: most recent week first (index 0)

            console.log('📊 Fixed 4 weeks for consolidation:');
            last4Weeks.forEach((week, index) => {
                console.log(`  Week ${index + 1}: ${week.label} (${week.start} to ${week.end})`);
            });

            // 🔍 Test with August 18, 2025 to see which week it belongs to
            const testDate = new Date('2025-08-18');
            const testWeekStart = getWeekStart(new Date(testDate));
            const testWeekEnd = getWeekEnd(testWeekStart);
            console.log(`🎯 August 18, 2025 (${testDate.toDateString()}) belongs to week:`);
            console.log(`   Week start: ${testWeekStart.toDateString()} (${testWeekStart.toISOString().split('T')[0]})`);
            console.log(`   Week end: ${testWeekEnd.toDateString()} (${testWeekEnd.toISOString().split('T')[0]})`);

            // Check if August 18, 2025 falls within our 4-week range
            const august18InRange = last4Weeks.find(week => {
                const aug18Date = new Date('2025-08-18');
                return aug18Date >= week.startDate && aug18Date <= week.endDate;
            });

            if (august18InRange) {
                console.log(`✅ August 18, 2025 IS within our 4-week range: ${august18InRange.label}`);
            } else {
                console.log(`❌ August 18, 2025 is NOT within our 4-week range`);
                console.log(`   Current 4-week range: ${last4Weeks[0].label} to ${last4Weeks[3].label}`);
            }

            // 🗓️ STEP 2: Initialize weekly stats for ONLY these 4 weeks
            last4Weeks.forEach(week => {
                weeklyStats[week.key] = {
                    count: 0,
                    successful: 0,
                    failed: 0,
                    running: 0,
                    pending: 0,
                    other: 0,
                    weekStart: week.start,
                    weekEnd: week.end,
                    weekLabel: week.label
                };
            });

            // 🔍 Helper function to find which week an instance belongs to
            const findWeekForInstance = (instanceDate: Date) => {
                // Create a new date to avoid mutation
                const checkDate = new Date(instanceDate);

                // Debug for August 18, 2025 specifically
                const isAugust18 = instanceDate.toISOString().includes('2025-08-18');
                if (isAugust18) {
                    console.log(`🔍 findWeekForInstance DEBUG for August 18:`);
                    console.log(`   Input date: ${instanceDate.toISOString()}`);
                    console.log(`   Check date: ${checkDate.toISOString()}`);
                }

                for (let i = 0; i < last4Weeks.length; i++) {
                    const week = last4Weeks[i];
                    const isInRange = checkDate >= week.startDate && checkDate <= week.endDate;

                    if (isAugust18) {
                        console.log(`   Week ${i + 1} (${week.label}):`);
                        console.log(`     Range: ${week.startDate.toISOString()} to ${week.endDate.toISOString()}`);
                        console.log(`     checkDate >= startDate: ${checkDate >= week.startDate}`);
                        console.log(`     checkDate <= endDate: ${checkDate <= week.endDate}`);
                        console.log(`     Is in range: ${isInRange}`);
                    }

                    // Check if the instance date falls within this week's range
                    if (isInRange) {
                        if (isAugust18) {
                            console.log(`   ✅ MATCH found in week ${i + 1}: ${week.label}`);
                        }
                        return {
                            weekKey: week.key,
                            weekLabel: week.label,
                            weekStart: week.startDate,
                            weekEnd: week.endDate
                        };
                    }
                }

                if (isAugust18) {
                    console.log(`   ❌ NO MATCH found for August 18, 2025`);
                }
                return null; // Instance is outside our 4-week range
            };

            // Function to fetch instances for a process - using SAME method as ProcessInstancesContext
            const fetchAllInstancesForProcess = async (processKey: string) => {
                console.log(`   🌐 Making API call: sdk.maestro.processInstances.getAll() for process: ${processKey}`);
                console.log(`   📋 Using EXACT same method as ProcessInstancesContext (pageSize: 50, no sorting)`);

                try {
                    // Use the EXACT same options as ProcessInstancesContext (pageSize: 50, no pagination)
                    const options: GetAllOptions = {
                        processKey: processKey,
                        pageSize: 50  // Same as ProcessInstancesContext - this is the key difference!
                    };
                    // NO sortBy, NO sortDirection, NO nextPage - exactly like ProcessInstancesContext

                    console.log(`   ⏳ Calling sdk.maestro.processInstances.getAll() with options:`, options);

                    if (!sdk.maestro.processInstances) {
                        throw new Error('SDK maestro.processInstances is not available');
                    }

                    const instances = await sdk.maestro.processInstances.getAll(options);
                    console.log(`   ✅ API response: ${instances ? instances.length : 'null/undefined'} instances for process ${processKey}`);

                    // Log first few instances to verify we're getting the same data
                    if (instances.length > 0) {
                        console.log(`📋 First instance for ${processKey}:`, {
                            instanceId: instances[0].instanceId,
                            startedTime: instances[0].startedTime,
                            status: instances[0].latestRunStatus
                        });

                        // Check if we have August 18, 2025 data in this process
                        const august18Instances = instances.filter(inst =>
                            inst.startedTime && inst.startedTime.includes('2025-08-18')
                        );
                        if (august18Instances.length > 0) {
                            console.log(`🎯 FOUND ${august18Instances.length} August 18, 2025 instances in process ${processKey}:`,
                                august18Instances.map(inst => ({
                                    instanceId: inst.instanceId,
                                    startedTime: inst.startedTime,
                                    status: inst.latestRunStatus
                                }))
                            );
                        }
                    }

                    return instances;
                } catch (error) {
                    console.error(`❌ Error fetching instances for process ${processKey}:`, error);
                    return [];
                }
            };

            // Fetch instances for each process
            console.log(`🔄 Starting to fetch instances for ${processesData.length} processes...`);

            for (let i = 0; i < processesData.length; i++) {
                const process = processesData[i];
                try {
                    console.log(`\n🔍 [${i + 1}/${processesData.length}] Fetching instances for process: ${process.processKey}`);
                    console.log(`   Process name: ${process.packageId || 'Unknown'}`);
                    console.log(`   Folder: ${process.folderName || 'Unknown'}`);

                    const instances = await fetchAllInstancesForProcess(process.processKey);
                    console.log(`✅ [${i + 1}/${processesData.length}] TOTAL instances found for process ${process.processKey}: ${instances.length}`);

                    // Process all instances for this process
                    instances.forEach((instance, index) => {
                        totalInstances++;

                        // Log first few instances for debugging
                        if (index < 5) {
                            console.log(`Instance ${index + 1}:`, {
                                startedTime: instance.startedTime,
                                status: instance.latestRunStatus,
                                processKey: instance.processKey
                            });
                        }

                        // Count all possible statuses
                        const status = instance.latestRunStatus?.toLowerCase() || 'unknown';

                        // Count each status type for analysis
                        statusCounts[status] = (statusCounts[status] || 0) + 1;

                        // Categorize statuses
                        if (status === 'completed' || status === 'successful') {
                            successfulInstances++;
                        } else if (status === 'failed' || status === 'cancelled' || status === 'error' ||
                            status === 'terminated' || status === 'stopped' || status === 'faulted' ||
                            status === 'aborted') {
                            failedInstances++;
                        } else if (status === 'running' || status === 'inprogress' || status === 'executing') {
                            runningInstances++;
                        } else if (status === 'pending' || status === 'waiting' || status === 'queued' ||
                            status === 'suspended' || status === 'paused') {
                            pendingInstances++;
                        } else {
                            otherInstances++;
                            // Log unknown statuses for investigation
                            if (index < 10) { // Log first 10 unknown statuses
                                console.log(`❓ Unknown status found: "${instance.latestRunStatus}" for instance ${instance.instanceId}`);
                            }
                        }

                        // 📊 STEP 3: Map each instance to the correct week (ONLY 4 weeks)
                        if (instance.startedTime) {
                            const instanceDate = new Date(instance.startedTime);
                            const weekInfo = findWeekForInstance(instanceDate);

                            // Log ALL instances for the first few to debug
                            if (index < 10) {
                                console.log(`📋 Instance ${index + 1}: ${instance.startedTime} -> ${weekInfo ? weekInfo.weekLabel : 'OUTSIDE range'}`);
                            }

                            // Log instances from August 18, 2025 specifically
                            if (instance.startedTime.includes('2025-08-18')) {
                                console.log(`🎯 FOUND August 18, 2025 instance: ${instance.startedTime}`);
                                console.log(`   📅 Instance date: ${instanceDate.toDateString()} (${instanceDate.toISOString()})`);
                                console.log(`   📊 Mapped to week: ${weekInfo ? weekInfo.weekLabel : 'OUTSIDE 4-week range'}`);
                                if (weekInfo) {
                                    console.log(`   📊 Week range: ${weekInfo.weekStart.toDateString()} - ${weekInfo.weekEnd.toDateString()}`);
                                    console.log(`   📊 Week key: ${weekInfo.weekKey}`);
                                } else {
                                    console.log(`   ❌ Week info is null - checking why...`);
                                    // Debug why weekInfo is null
                                    console.log(`   🔍 Available weeks:`, last4Weeks.map(w => ({
                                        label: w.label,
                                        start: w.startDate.toDateString(),
                                        end: w.endDate.toDateString(),
                                        key: w.key
                                    })));
                                }
                            }

                            if (weekInfo && weeklyStats[weekInfo.weekKey]) {
                                // ✅ Instance falls within our 4-week range
                                weeklyStats[weekInfo.weekKey].count++;

                                if (status === 'completed' || status === 'successful') {
                                    weeklyStats[weekInfo.weekKey].successful++;
                                } else if (status === 'failed' || status === 'cancelled' || status === 'error' ||
                                    status === 'terminated' || status === 'stopped' || status === 'faulted' ||
                                    status === 'aborted') {
                                    weeklyStats[weekInfo.weekKey].failed++;
                                } else if (status === 'running' || status === 'inprogress' || status === 'executing') {
                                    weeklyStats[weekInfo.weekKey].running++;
                                } else if (status === 'pending' || status === 'waiting' || status === 'queued' ||
                                    status === 'suspended' || status === 'paused') {
                                    weeklyStats[weekInfo.weekKey].pending++;
                                } else {
                                    weeklyStats[weekInfo.weekKey].other++;
                                }

                                // Log consolidation for August 18, 2025 specifically
                                if (instance.startedTime.includes('2025-08-18')) {
                                    console.log(`   ✅ Added to week ${weekInfo.weekKey}: total=${weeklyStats[weekInfo.weekKey].count}, successful=${weeklyStats[weekInfo.weekKey].successful}, failed=${weeklyStats[weekInfo.weekKey].failed}`);
                                }
                            } else {
                                // ❌ Instance is outside our 4-week range - skip it
                                if (index < 5) { // Log first few instances outside range
                                    console.log(`   ⏭️ Instance ${instance.startedTime} is outside 4-week range, skipping`);
                                }
                            }
                        }
                    });

                    console.log(`✅ [${i + 1}/${processesData.length}] Processed ${instances.length} instances for process ${process.processKey}`);
                } catch (processError) {
                    console.error(`❌ [${i + 1}/${processesData.length}] Error fetching instances for process ${process.processKey}:`, processError);
                }
            }

            console.log(`\n🏁 Finished processing all ${processesData.length} processes`);

            // Calculate rates
            const successRate = totalInstances > 0 ? (successfulInstances / totalInstances) * 100 : 0;
            const failureRate = totalInstances > 0 ? (failedInstances / totalInstances) * 100 : 0;

            // 📊 STEP 4: Convert ONLY the 4 fixed weeks to final array (most recent first)
            const weeklyExecutions: WeeklyExecution[] = last4Weeks.map(week => ({
                weekStart: weeklyStats[week.key].weekStart,
                weekEnd: weeklyStats[week.key].weekEnd,
                weekLabel: weeklyStats[week.key].weekLabel,
                count: weeklyStats[week.key].count,
                successful: weeklyStats[week.key].successful,
                failed: weeklyStats[week.key].failed,
                running: weeklyStats[week.key].running,
                pending: weeklyStats[week.key].pending,
                other: weeklyStats[week.key].other
            }));

            console.log('\n📊 SUMMARY STATISTICS:');
            console.log(`Total instances processed: ${totalInstances}`);
            console.log(`✅ Successful instances: ${successfulInstances}`);
            console.log(`❌ Failed instances: ${failedInstances}`);
            console.log(`🔄 Running instances: ${runningInstances}`);
            console.log(`⏳ Pending instances: ${pendingInstances}`);
            console.log(`❓ Other status instances: ${otherInstances}`);
            console.log(`Success rate: ${successRate.toFixed(1)}%`);
            console.log(`Failure rate: ${failureRate.toFixed(1)}%`);
            console.log('📋 All status counts:', statusCounts);

            console.log('\n📅 WEEKLY CONSOLIDATED SUMMARY (Fixed 4 weeks):');
            console.log('All 4 weeks (including empty):');
            last4Weeks.forEach((week, index) => {
                const stats = weeklyStats[week.key];
                console.log(`  Week ${index + 1}: ${stats.weekLabel}`);
                console.log(`    Total: ${stats.count}, Success: ${stats.successful}, Failed: ${stats.failed}, Running: ${stats.running}, Pending: ${stats.pending}, Other: ${stats.other}`);
            });

            console.log('\n📊 Final weekly executions (displayed in UI):', weeklyExecutions);

            // Check if we have any August 2025 data
            const august2025Weeks = Object.keys(weeklyStats).filter(key => key.startsWith('2025-08'));
            console.log('August 2025 weeks found:', august2025Weeks);
            august2025Weeks.forEach(weekKey => {
                const week = weeklyStats[weekKey];
                console.log(`Week ${weekKey}: ${week.count} instances (${week.successful} successful, ${week.failed} failed)`);
            });

            const summary: MaestroSummary = {
                totalInstances,
                successRate: Math.round(successRate * 10) / 10, // Round to 1 decimal place
                failureRate: Math.round(failureRate * 10) / 10,
                weeklyExecutions
            };

            console.log('Final maestro summary:', summary);
            setMaestroSummary(summary);
            setSummaryLoading(false);

        } catch (err) {
            console.error('❌ DETAILED ERROR in fetchMaestroSummary:', err);
            console.error('❌ Error type:', typeof err);
            console.error('❌ Error constructor:', err?.constructor?.name);

            if (err instanceof Error) {
                console.error('❌ Error message:', err.message);
                console.error('❌ Error stack:', err.stack);
                setSummaryError(`API Error: ${err.message}`);
            } else {
                console.error('❌ Non-Error object:', err);
                setSummaryError(`Unknown error: ${JSON.stringify(err)}`);
            }
            setSummaryLoading(false);
        }
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

                // Also fetch maestro summary
                console.log('Fetching maestro summary...');
                await fetchMaestroSummary();
                console.log('Maestro summary fetched successfully');
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
            loadPreviousPage,
            maestroSummary,
            summaryLoading,
            summaryError,
            fetchMaestroSummary
        }}>
            {children}
        </UiPathContext.Provider>
    );
}; 