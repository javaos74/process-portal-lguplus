export interface KPI {
  id: string;
  name: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'neutral';
  change: number;
}
export interface ChartData {
  label: string;
  value: number;
}
export interface InsightDashboard {
  id: string;
  name: string;
  description: string;
  kpis: KPI[];
  charts: {
    [key: string]: ChartData[];
  };
}
export const mockKPIs: KPI[] = [{
  id: 'kpi1',
  name: 'Average Cycle Time',
  value: 2.3,
  unit: 'days',
  trend: 'down',
  change: 12
}, {
  id: 'kpi2',
  name: 'Touch Time vs Wait Time',
  value: 35,
  unit: '%',
  trend: 'up',
  change: 5
}, {
  id: 'kpi3',
  name: 'Rework Percentage',
  value: 8.2,
  unit: '%',
  trend: 'down',
  change: 3.1
}, {
  id: 'kpi4',
  name: 'SLA Compliance',
  value: 94.7,
  unit: '%',
  trend: 'up',
  change: 2.3
}, {
  id: 'kpi5',
  name: 'Human vs Bot Ratio',
  value: 0.8,
  unit: 'ratio',
  trend: 'down',
  change: 0.2
}];
export const mockDashboards: InsightDashboard[] = [{
  id: 'dashboard1',
  name: 'Operations Overview',
  description: 'High-level metrics on process performance and efficiency',
  kpis: mockKPIs,
  charts: {
    processVolume: [{
      label: 'Mon',
      value: 42
    }, {
      label: 'Tue',
      value: 38
    }, {
      label: 'Wed',
      value: 55
    }, {
      label: 'Thu',
      value: 47
    }, {
      label: 'Fri',
      value: 60
    }, {
      label: 'Sat',
      value: 25
    }, {
      label: 'Sun',
      value: 15
    }],
    statusDistribution: [{
      label: 'Running',
      value: 45
    }, {
      label: 'Completed',
      value: 35
    }, {
      label: 'Paused',
      value: 15
    }, {
      label: 'Errored',
      value: 5
    }]
  }
}, {
  id: 'dashboard2',
  name: 'Bottleneck Analysis',
  description: 'Identify and analyze process bottlenecks',
  kpis: [mockKPIs[0], mockKPIs[2]],
  charts: {
    stepDuration: [{
      label: 'Document Validation',
      value: 35
    }, {
      label: 'Credit Check',
      value: 120
    }, {
      label: 'Manager Approval',
      value: 240
    }, {
      label: 'Contract Generation',
      value: 45
    }, {
      label: 'Customer Signature',
      value: 1440
    }, {
      label: 'Account Setup',
      value: 60
    }]
  }
}, {
  id: 'dashboard3',
  name: 'Compliance Watch',
  description: 'Monitor regulatory compliance and SLA adherence',
  kpis: [mockKPIs[3]],
  charts: {
    slaBreaches: [{
      label: 'Jan',
      value: 3
    }, {
      label: 'Feb',
      value: 5
    }, {
      label: 'Mar',
      value: 2
    }, {
      label: 'Apr',
      value: 1
    }, {
      label: 'May',
      value: 0
    }, {
      label: 'Jun',
      value: 2
    }]
  }
}];