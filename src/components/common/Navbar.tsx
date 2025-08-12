import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MenuIcon, BellIcon, HelpCircleIcon, UserIcon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import ThemeToggle from './ThemeToggle';

// Initials Avatar Component
const InitialsAvatar: React.FC<{ initials: string; className?: string }> = ({ initials, className = "w-8 h-8" }) => {
  return (
    <div className={`${className} rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-medium`}>
      {initials}
    </div>
  );
};
interface NavbarProps {
  onHelpToggle: () => void;
}
const Navbar: React.FC<NavbarProps> = ({
  onHelpToggle
}) => {
  const {
    theme
  } = useTheme();
  const {
    user
  } = useAuth();
  const navigate = useNavigate();
  return <nav className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b px-4 py-2.5 fixed w-full top-0 z-10`}>
      <div className="flex flex-wrap justify-between items-center">
        <div className="flex items-center">
          <button type="button" className="md:hidden p-2 mr-2 rounded-lg">
            <MenuIcon className="w-6 h-6" />
          </button>
          <div onClick={() => navigate('/dashboard')} className="flex items-center cursor-pointer">
            <span className="self-center text-xl font-semibold whitespace-nowrap">
              ProcessFlow
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button type="button" className="p-2 rounded-full">
            <BellIcon className="w-6 h-6" />
          </button>
          <button type="button" className="p-2 rounded-full" onClick={onHelpToggle}>
            <HelpCircleIcon className="w-6 h-6" />
          </button>
          <div className="flex items-center ml-3">
            {user ? <div className="flex items-center gap-2">
                <span className="hidden md:block">{user.name}</span>
                <InitialsAvatar initials={user.initials} />
              </div> : <UserIcon className="w-6 h-6" />}
          </div>
        </div>
      </div>
    </nav>;
};
export default Navbar;