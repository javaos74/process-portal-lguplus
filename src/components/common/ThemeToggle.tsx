import React from 'react';
import { SunIcon, MoonIcon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
const ThemeToggle: React.FC = () => {
  const {
    theme,
    toggleTheme
  } = useTheme();
  return <button type="button" onClick={toggleTheme} className={`p-2 rounded-full ${theme === 'dark' ? 'text-yellow-300' : 'text-gray-600'}`} aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
      {theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
    </button>;
};
export default ThemeToggle;