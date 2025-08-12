import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboardIcon, BarChartIcon, SettingsIcon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
const Sidebar: React.FC = () => {
  const {
    theme
  } = useTheme();
  const navItems = [{
    path: '/dashboard',
    label: 'Process Portfolio',
    icon: <LayoutDashboardIcon className="w-5 h-5" />
  }, {
    path: '/insights',
    label: 'Insights & Reporting',
    icon: <BarChartIcon className="w-5 h-5" />
  }, {
    path: '/settings',
    label: 'Settings',
    icon: <SettingsIcon className="w-5 h-5" />
  }];
  return <aside className={`fixed left-0 top-[57px] h-[calc(100vh-57px)] w-64 transition-transform -translate-x-full md:translate-x-0 ${theme === 'dark' ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-800'} border-r ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} pt-5`}>
      <div className="px-3 py-4 overflow-y-auto">
        <ul className="space-y-2">
          {navItems.map(item => <li key={item.path}>
              <NavLink to={item.path} className={({
            isActive
          }) => `flex items-center p-2 rounded-lg hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-700 dark:hover:text-white ${isActive ? 'bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-white' : ''}`}>
                {item.icon}
                <span className="ml-3">{item.label}</span>
              </NavLink>
            </li>)}
        </ul>
      </div>
    </aside>;
};
export default Sidebar;