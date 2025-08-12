import React from 'react';
import { XIcon } from 'lucide-react';
interface FilterPillProps {
  label: string;
  active: boolean;
  onClick: () => void;
  onRemove?: () => void;
}
const FilterPill: React.FC<FilterPillProps> = ({
  label,
  active,
  onClick,
  onRemove
}) => {
  return <button className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${active ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`} onClick={onClick}>
      {label}
      {onRemove && <XIcon className="w-4 h-4 ml-1 cursor-pointer" onClick={e => {
      e.stopPropagation();
      onRemove();
    }} />}
    </button>;
};
export default FilterPill;