import React, { useState, useEffect } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { DownloadIcon, ShareIcon, PlusIcon, BarChart2Icon, PieChartIcon, LineChartIcon } from 'lucide-react';
import { mockKPIs, mockDashboards } from '../data/mockInsights';
import { useTheme } from '../context/ThemeContext';
import { useUiPath } from '../context/UiPathContext';

interface StatusData {
  status: string;
  count: number;
}

const Insights: React.FC = () => {
  const {
    theme
  } = useTheme();
  const { sdk } = useUiPath();
  const [activeDashboardId, setActiveDashboardId] = useState('dashboard1');
  const [statusDistribution, setStatusDistribution] = useState<StatusData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isBuilderMode, setIsBuilderMode] = useState(false);

  const activeDashboard = mockDashboards.find(d => d.id === activeDashboardId) || mockDashboards[0];

  useEffect(() => {
    const fetchStatusDistribution = async () => {
      try {
        // Get data for the last 30 days
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        
        const response = await sdk.insights.getprocessInstancetatusByDate(
          startDate.getTime(),
          endDate.getTime()
        );

        // Transform and aggregate the data by status
        const statusMap = new Map<string, number>();
        response.forEach(item => {
          const currentCount = statusMap.get(item.status) || 0;
          statusMap.set(item.status, currentCount + item.count);
        });

        // Convert to array format needed for the chart
        const chartData = Array.from(statusMap.entries()).map(([status, count]) => ({
          status,
          count
        }));

        setStatusDistribution(chartData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching status distribution:', error);
        setLoading(false);
      }
    };

    fetchStatusDistribution();
  }, [sdk]);

  const handleDashboardChange = (dashboardId: string) => {
    setActiveDashboardId(dashboardId);
  };

  const renderKPITrend = (trend: 'up' | 'down' | 'neutral', change: number) => {
    const color = trend === 'up' ? 'text-green-500 dark:text-green-400' : trend === 'down' ? 'text-red-500 dark:text-red-400' : 'text-gray-500 dark:text-gray-400';
    return <div className={`flex items-center ${color}`}>
        {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {change}%
      </div>;
  };
  return <div className="pt-16 md:ml-64 min-h-screen">
      <div className="p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold">Insights & Reporting</h1>
          <div className="flex space-x-2">
            <button className={`px-4 py-2 rounded-lg flex items-center ${isBuilderMode ? 'bg-blue-500 text-white' : theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-800'}`} onClick={() => setIsBuilderMode(!isBuilderMode)}>
              <PlusIcon className="w-5 h-5 mr-2" />
              {isBuilderMode ? 'Exit Builder' : 'Custom Insight Builder'}
            </button>
            <button className={`px-4 py-2 rounded-lg flex items-center ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-800'}`}>
              <DownloadIcon className="w-5 h-5 mr-2" />
              Export
            </button>
            <button className={`px-4 py-2 rounded-lg flex items-center ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-800'}`}>
              <ShareIcon className="w-5 h-5 mr-2" />
              Share
            </button>
          </div>
        </div>
        {/* Dashboard Templates */}
        {!isBuilderMode && <div className="mb-6">
            <h2 className="text-lg font-medium mb-3">Dashboard Templates</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {mockDashboards.map(dashboard => <div key={dashboard.id} className={`p-4 rounded-lg cursor-pointer border-2 ${activeDashboard.id === dashboard.id ? 'border-blue-500' : theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`} onClick={() => handleDashboardChange(dashboard.id)}>
                  <h3 className="font-medium">{dashboard.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {dashboard.description}
                  </p>
                </div>)}
            </div>
          </div>}
        {isBuilderMode /* Custom Insight Builder */ ? <div className={`p-6 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow`}>
            <h2 className="text-lg font-medium mb-4">Custom Insight Builder</h2>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Available Fields */}
              <div className={`p-4 rounded-lg border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                <h3 className="font-medium mb-3">Available Fields</h3>
                <div className="space-y-2">
                  {['Process Name', 'Status', 'Owner', 'Duration', 'Start Date', 'Completion Date', 'SLA Status'].map(field => <div key={field} className={`p-2 rounded-lg flex items-center cursor-move ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      <div className="w-4 h-4 mr-2 text-gray-500" />
                      {field}
                    </div>)}
                </div>
                <h3 className="font-medium mt-6 mb-3">Calculated Metrics</h3>
                <div className="space-y-2">
                  {['Avg. Cycle Time', 'SLA Compliance %', 'Rework Rate', 'Automation Rate'].map(metric => <div key={metric} className={`p-2 rounded-lg flex items-center cursor-move ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      <div className="w-4 h-4 mr-2 text-gray-500" />
                      {metric}
                    </div>)}
                </div>
              </div>
              {/* Chart Builder */}
              <div className="lg:col-span-3">
                <div className="flex space-x-4 mb-4">
                  <button className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <BarChart2Icon className="w-5 h-5" />
                  </button>
                  <button className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <LineChartIcon className="w-5 h-5" />
                  </button>
                  <button className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <PieChartIcon className="w-5 h-5" />
                  </button>
                </div>
                <div className={`p-4 rounded-lg border border-dashed h-80 flex items-center justify-center ${theme === 'dark' ? 'border-gray-600' : 'border-gray-300'}`}>
                  <div className="text-center">
                    <p className="mb-2">
                      Drag fields here to create your chart
                    </p>
                    <p className="text-sm text-gray-500">
                      Drag dimensions to X-axis and metrics to Y-axis
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex justify-end space-x-2">
                  <button className={`px-4 py-2 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>
                    Reset
                  </button>
                  <button className="px-4 py-2 bg-blue-500 text-white rounded-lg">
                    Save View
                  </button>
                </div>
              </div>
            </div>
          </div> /* Dashboard View */ : <div>
            {/* Pre-built KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              {activeDashboard.kpis.map(kpi => <div key={kpi.id} className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow`}>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {kpi.name}
                  </h3>
                  <div className="flex items-baseline justify-between mt-2">
                    <div className="text-3xl font-semibold">
                      {kpi.value}
                      <span className="text-sm ml-1">{kpi.unit}</span>
                    </div>
                    {renderKPITrend(kpi.trend, kpi.change)}
                  </div>
                </div>)}
            </div>
            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {activeDashboard.charts.processVolume && <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow`}>
                  <h3 className="text-lg font-medium mb-4">Process Volume</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={activeDashboard.charts.processVolume}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="label" />
                        <YAxis />
                        <Tooltip />
                        <Area type="monotone" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>}
              {activeDashboard.charts.statusDistribution && <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow`}>
                  <h3 className="text-lg font-medium mb-4">
                    Status Distribution
                  </h3>
                  <div className="h-80">
                    {loading ? (
                      <div className="flex items-center justify-center h-full">
                        <span>Loading...</span>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={statusDistribution}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="status" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="count" fill="#3b82f6" />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>}
              {activeDashboard.charts.stepDuration && <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow`}>
                  <h3 className="text-lg font-medium mb-4">
                    Step Duration (minutes)
                  </h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={activeDashboard.charts.stepDuration}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="label" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>}
              {activeDashboard.charts.slaBreaches && <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow`}>
                  <h3 className="text-lg font-medium mb-4">SLA Breaches</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={activeDashboard.charts.slaBreaches}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="label" />
                        <YAxis />
                        <Tooltip />
                        <Area type="monotone" dataKey="value" stroke="#ef4444" fill="#ef4444" fillOpacity={0.2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>}
            </div>
            {/* Export & Embed Section */}
            <div className={`mt-6 p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow`}>
              <h3 className="text-lg font-medium mb-4">Export & Embed</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Download Options</h4>
                  <div className="flex space-x-2">
                    <button className={`px-3 py-1 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>
                      CSV
                    </button>
                    <button className={`px-3 py-1 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>
                      PNG
                    </button>
                    <button className={`px-3 py-1 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>
                      PDF
                    </button>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Embed Code</h4>
                  <div className={`p-2 rounded-lg font-mono text-sm ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    &lt;iframe src="https://processflow.app/embed/dashboard/
                    {activeDashboard.id}" width="100%"
                    height="600"&gt;&lt;/iframe&gt;
                  </div>
                </div>
              </div>
            </div>
          </div>}
      </div>
    </div>;
};
export default Insights;