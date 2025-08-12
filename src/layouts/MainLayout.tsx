import React, { useState } from 'react';
import Navbar from '../components/common/Navbar';
import Sidebar from '../components/common/Sidebar';
import HelpPanel from '../components/common/HelpPanel';
import { useTheme } from '../context/ThemeContext';
interface MainLayoutProps {
  children: React.ReactNode;
}
const MainLayout: React.FC<MainLayoutProps> = ({
  children
}) => {
  const {
    theme
  } = useTheme();
  const [helpOpen, setHelpOpen] = useState(false);
  return <div className={`${theme === 'dark' ? 'dark bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'} min-h-screen transition-colors duration-200`}>
      <Navbar onHelpToggle={() => setHelpOpen(!helpOpen)} />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4 md:p-6 max-w-[95rem] mx-auto">{children}</main>
        <HelpPanel isOpen={helpOpen} onClose={() => setHelpOpen(false)} />
      </div>
    </div>;
};
export default MainLayout;