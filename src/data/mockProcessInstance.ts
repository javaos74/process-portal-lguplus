export interface ProcessStep {
  id: string;
  name: string;
  type: 'start' | 'task' | 'gateway' | 'end';
  status: 'completed' | 'active' | 'pending';
  lane: string;
  performer: string;
  startTime?: string;
  endTime?: string;
  duration?: number; // in minutes
  outcome?: string;
  isHumanTask?: boolean;
  inputs?: string[]; // Added input data
  outputs?: string[]; // Added output data
}
export interface ProcessAuditLog {
  id: string;
  timestamp: string;
  type: 'status_change' | 'user_action' | 'comment' | 'sla_breach';
  message: string;
  user?: string;
}
export interface ProcessInstance {
  id: string;
  processId: string;
  name: string;
  status: 'running' | 'paused' | 'completed' | 'errored';
  startedAt: string;
  currentStep?: string;
  steps: ProcessStep[];
  auditLog: ProcessAuditLog[];
}
export const mockProcessInstance: ProcessInstance = {
  id: '101',
  processId: '1',
  name: 'Customer Onboarding - John Doe',
  status: 'running',
  startedAt: '2023-10-15T08:30:00Z',
  currentStep: '3',
  steps: [{
    id: '1',
    name: 'Start Process',
    type: 'start',
    status: 'completed',
    lane: 'System',
    performer: 'System',
    startTime: '2023-10-15T08:30:00Z',
    endTime: '2023-10-15T08:30:05Z',
    duration: 0.08,
    inputs: ['Process trigger signal', 'Customer ID: CUS-2023-1045'],
    outputs: ['Process instance created', 'Initial context prepared']
  }, {
    id: '2',
    name: 'Validate Customer Information',
    type: 'task',
    status: 'completed',
    lane: 'System',
    performer: 'Data Validation Bot',
    startTime: '2023-10-15T08:30:05Z',
    endTime: '2023-10-15T08:32:15Z',
    duration: 2.17,
    outcome: 'Valid',
    inputs: ['Customer name: John Doe', 'Email: john.doe@example.com', 'Phone: +1-555-123-4567', 'Address: 123 Main St, Anytown, USA'],
    outputs: ['Validation result: Valid', 'Customer record created', 'Risk score: Low (0.2)']
  }, {
    id: '3',
    name: 'Review Customer Documents',
    type: 'task',
    status: 'active',
    lane: 'Operations',
    performer: 'Sarah Johnson',
    startTime: '2023-10-15T08:32:15Z',
    isHumanTask: true,
    inputs: ['ID document (passport)', 'Proof of address (utility bill)', 'Customer application form', 'Initial validation results'],
    outputs: []
  }, {
    id: '4',
    name: 'Document Quality Check',
    type: 'gateway',
    status: 'pending',
    lane: 'System',
    performer: 'System',
    inputs: ['Document review results', 'Image quality metrics', 'Validation confidence score'],
    outputs: ['Quality decision: Pass/Fail', 'Routing decision']
  }, {
    id: '5',
    name: 'Request Additional Documents',
    type: 'task',
    status: 'pending',
    lane: 'Customer Service',
    performer: 'Unassigned',
    isHumanTask: true,
    inputs: ['Document quality issues', 'Customer contact information', 'Required document types'],
    outputs: ['Customer notification sent', 'Follow-up scheduled', 'Case notes updated']
  }, {
    id: '6',
    name: 'Create Customer Account',
    type: 'task',
    status: 'pending',
    lane: 'System',
    performer: 'Account Creation Service',
    inputs: ['Validated customer information', 'Document verification results', 'Account type: Standard'],
    outputs: ['Account number: ACC-2023-5678', 'Login credentials created', 'Initial account balance: $0.00']
  }, {
    id: '7',
    name: 'Send Welcome Email',
    type: 'task',
    status: 'pending',
    lane: 'System',
    performer: 'Notification Service',
    inputs: ['Customer email address', 'Account details', 'Welcome package template'],
    outputs: ['Welcome email sent', 'Email tracking ID', 'Digital welcome package delivered']
  }, {
    id: '8',
    name: 'End Process',
    type: 'end',
    status: 'pending',
    lane: 'System',
    performer: 'System',
    inputs: ['Process completion signal', 'Final process state'],
    outputs: ['Process archived', 'Analytics data recorded', 'SLA metrics finalized']
  }],
  auditLog: [{
    id: 'log1',
    timestamp: '2023-10-15T08:30:00Z',
    type: 'status_change',
    message: 'Process started'
  }, {
    id: 'log2',
    timestamp: '2023-10-15T08:30:05Z',
    type: 'status_change',
    message: 'Step "Start Process" completed'
  }, {
    id: 'log3',
    timestamp: '2023-10-15T08:30:05Z',
    type: 'status_change',
    message: 'Step "Validate Customer Information" started'
  }, {
    id: 'log4',
    timestamp: '2023-10-15T08:32:15Z',
    type: 'status_change',
    message: 'Step "Validate Customer Information" completed with outcome: Valid'
  }, {
    id: 'log5',
    timestamp: '2023-10-15T08:32:15Z',
    type: 'status_change',
    message: 'Step "Review Customer Documents" started'
  }, {
    id: 'log6',
    timestamp: '2023-10-15T09:15:30Z',
    type: 'user_action',
    message: 'User viewed customer documents',
    user: 'Sarah Johnson'
  }, {
    id: 'log7',
    timestamp: '2023-10-15T10:45:12Z',
    type: 'comment',
    message: 'ID verification appears valid but address proof is blurry',
    user: 'Sarah Johnson'
  }]
};