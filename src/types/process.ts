export interface ProcessInstanceData {
    id: string;
    name: string;
    status: string;
    startedAt: string;
    currentStep?: string;
    instanceId: string;
    folderKey: string | null;
}

export interface InstanceRun {
    status: string;
}

export interface UiPathInstance {
    instanceId: string | null;
    instanceDisplayName: string | null;
    instanceRuns: { status: string }[] | null;
    startedTimeUtc: string | null;
    folderKey: string | null;
} 