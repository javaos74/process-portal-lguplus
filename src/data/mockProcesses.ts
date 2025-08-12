export interface Process {
  id: string;
  name: string;
  status: 'running' | 'paused' | 'completed' | 'errored';
  owner: string;
  startedAt: string;
  slaRemaining: number; // hours
  tags: string[];
}
export const mockProcesses: Process[] = [{
  id: '1',
  name: 'Customer Onboarding',
  status: 'running',
  owner: 'Sarah Johnson',
  startedAt: '2023-10-15T08:30:00Z',
  slaRemaining: 12,
  tags: ['customer', 'onboarding', 'high-priority']
}, {
  id: '2',
  name: 'Invoice Processing',
  status: 'paused',
  owner: 'Michael Chen',
  startedAt: '2023-10-14T14:45:00Z',
  slaRemaining: 24,
  tags: ['finance', 'invoice']
}, {
  id: '3',
  name: 'Loan Approval',
  status: 'completed',
  owner: 'Jessica Miller',
  startedAt: '2023-10-12T10:15:00Z',
  slaRemaining: 0,
  tags: ['finance', 'loan', 'approval']
}, {
  id: '4',
  name: 'Customer Support Ticket',
  status: 'errored',
  owner: 'David Wilson',
  startedAt: '2023-10-15T09:20:00Z',
  slaRemaining: 2,
  tags: ['support', 'customer']
}, {
  id: '5',
  name: 'Employee Onboarding',
  status: 'running',
  owner: 'Amanda Rodriguez',
  startedAt: '2023-10-13T11:00:00Z',
  slaRemaining: 36,
  tags: ['hr', 'onboarding']
}, {
  id: '6',
  name: 'Expense Approval',
  status: 'paused',
  owner: 'Thomas Brown',
  startedAt: '2023-10-14T16:30:00Z',
  slaRemaining: 8,
  tags: ['finance', 'expense']
}, {
  id: '7',
  name: 'Contract Review',
  status: 'running',
  owner: 'Emily Davis',
  startedAt: '2023-10-15T13:45:00Z',
  slaRemaining: 48,
  tags: ['legal', 'contract', 'review']
}, {
  id: '8',
  name: 'Product Order Fulfillment',
  status: 'completed',
  owner: 'Robert Taylor',
  startedAt: '2023-10-11T09:00:00Z',
  slaRemaining: 0,
  tags: ['order', 'fulfillment', 'logistics']
}, {
  id: '9',
  name: 'Software License Request',
  status: 'running',
  owner: 'Jennifer White',
  startedAt: '2023-10-14T10:20:00Z',
  slaRemaining: 16,
  tags: ['it', 'license', 'software']
}, {
  id: '10',
  name: 'Travel Expense Reimbursement',
  status: 'errored',
  owner: 'Daniel Martinez',
  startedAt: '2023-10-13T15:10:00Z',
  slaRemaining: 4,
  tags: ['finance', 'travel', 'expense']
}];
export const getProcessById = (id: string): Process | undefined => {
  return mockProcesses.find(process => process.id === id);
};