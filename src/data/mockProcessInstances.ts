import { Process } from './mockProcesses';
export interface ProcessInstance {
  id: string;
  processId: string;
  name: string;
  status: 'running' | 'paused' | 'completed' | 'errored';
  startedAt: string;
  currentStep?: string;
  owner: string;
  slaRemaining: number; // hours
}
// Create multiple instances for each process
export const mockprocessInstance: ProcessInstance[] = [
// Customer Onboarding instances
{
  id: '101',
  processId: '1',
  name: 'Customer Onboarding - John Doe',
  status: 'running',
  startedAt: '2023-10-15T08:30:00Z',
  currentStep: 'Review Customer Documents',
  owner: 'Sarah Johnson',
  slaRemaining: 12
}, {
  id: '102',
  processId: '1',
  name: 'Customer Onboarding - Jane Smith',
  status: 'paused',
  startedAt: '2023-10-14T09:45:00Z',
  currentStep: 'Validate Customer Information',
  owner: 'Sarah Johnson',
  slaRemaining: 8
}, {
  id: '103',
  processId: '1',
  name: 'Customer Onboarding - Acme Corp',
  status: 'completed',
  startedAt: '2023-10-10T10:15:00Z',
  owner: 'Sarah Johnson',
  slaRemaining: 0
},
// Invoice Processing instances
{
  id: '201',
  processId: '2',
  name: 'Invoice #INV-2023-001',
  status: 'paused',
  startedAt: '2023-10-14T14:45:00Z',
  currentStep: 'Approval',
  owner: 'Michael Chen',
  slaRemaining: 24
}, {
  id: '202',
  processId: '2',
  name: 'Invoice #INV-2023-002',
  status: 'running',
  startedAt: '2023-10-15T11:30:00Z',
  currentStep: 'Validation',
  owner: 'Michael Chen',
  slaRemaining: 30
},
// Loan Approval instances
{
  id: '301',
  processId: '3',
  name: 'Loan Application - #LA-458',
  status: 'completed',
  startedAt: '2023-10-12T10:15:00Z',
  owner: 'Jessica Miller',
  slaRemaining: 0
}, {
  id: '302',
  processId: '3',
  name: 'Loan Application - #LA-459',
  status: 'running',
  startedAt: '2023-10-15T13:20:00Z',
  currentStep: 'Credit Check',
  owner: 'Jessica Miller',
  slaRemaining: 18
},
// Support Ticket instances
{
  id: '401',
  processId: '4',
  name: 'Support Ticket #ST-2023-112',
  status: 'errored',
  startedAt: '2023-10-15T09:20:00Z',
  currentStep: 'Assign Support Agent',
  owner: 'David Wilson',
  slaRemaining: 2
}, {
  id: '402',
  processId: '4',
  name: 'Support Ticket #ST-2023-113',
  status: 'running',
  startedAt: '2023-10-15T14:10:00Z',
  currentStep: 'Initial Response',
  owner: 'David Wilson',
  slaRemaining: 4
},
// Additional instances for other processes
{
  id: '501',
  processId: '5',
  name: 'Employee Onboarding - Robert Johnson',
  status: 'running',
  startedAt: '2023-10-13T11:00:00Z',
  currentStep: 'Equipment Setup',
  owner: 'Amanda Rodriguez',
  slaRemaining: 36
}, {
  id: '601',
  processId: '6',
  name: 'Expense Report - Q3 Marketing',
  status: 'paused',
  startedAt: '2023-10-14T16:30:00Z',
  currentStep: 'Manager Review',
  owner: 'Thomas Brown',
  slaRemaining: 8
}];
export const getprocessInstanceByProcessId = (processId: string): ProcessInstance[] => {
  return mockprocessInstance.filter(instance => instance.processId === processId);
};
export const getProcessInstanceById = (id: string): ProcessInstance | undefined => {
  return mockprocessInstance.find(instance => instance.id === id);
};