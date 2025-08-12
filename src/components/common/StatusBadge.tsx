import React from 'react';

type StatusType = 'Running' | 'Paused' | 'Completed' | 'Error' | 'Unknown' | string | null | undefined;

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  className = ''
}) => {
  const normalizedStatus = status?.toLowerCase() || 'unknown';

  const getStatusStyles = () => {
    switch (normalizedStatus) {
      case 'running':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'completed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyles()} ${className}`}>
      {status || 'Unknown'}
    </span>
  );
};

export default StatusBadge;