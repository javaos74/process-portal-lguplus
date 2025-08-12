import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader2Icon, UserIcon, CheckIcon, SearchIcon, XIcon } from 'lucide-react';
import { useUiPath } from '../context/UiPathContext';
import { useTheme } from '../context/ThemeContext';
import { TaskAssignmentResult } from '@uipath/uipath-typescript';
import { UserLoginInfo } from '@uipath/uipath-typescript';

const ProcessTask: React.FC = () => {
  const [searchParams] = useSearchParams();
  const taskUrl = searchParams.get('taskUrl');
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<UserLoginInfo[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedUserName, setSelectedUserName] = useState<string>('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignmentSuccess, setAssignmentSuccess] = useState(false);
  const [assignmentError, setAssignmentError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [currentlyAssignedUserId, setCurrentlyAssignedUserId] = useState<number | null>(null);
  const [currentlyAssignedUserName, setCurrentlyAssignedUserName] = useState<string>('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { sdk, isInitialized } = useUiPath();
  const { theme } = useTheme();

  // Extract task ID from URL
  const extractTaskId = (url: string): number | null => {
    if (!url) return null;
    const match = url.match(/tasks\/(\d+)$/);
    return match ? parseInt(match[1], 10) : null;
  };

  // Transform the task URL to embed URL
  const getEmbedUrl = (url: string) => {
    if (!url) return '';
    const baseUrl = 'https://alpha.uipath.com';
    const path = url.replace(baseUrl, '');
    const parts = path.split('/actions_/');
    if (parts.length !== 2) return url;
    return `${baseUrl}/embed_${parts[0]}/actions_/current-task/${parts[1]}`;
  };

  const embedUrl = getEmbedUrl(taskUrl || '');
  const taskId = extractTaskId(taskUrl || '');

  // Filter users based on search term
  const filteredUsers = users.filter(user => {
    const fullName = `${user.name} ${user.surname} ${user.displayName} ${user.emailAddress}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase());
  });

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch users when task ID is available
  useEffect(() => {
    const fetchTaskAndUsers = async () => {
      if (!taskId || !isInitialized) return;

      try {
        // First get the task details to find the folder ID
        const task = await sdk.task.getById(taskId);
        if (task && task.folderId) {
          // Now fetch users for this folder
          const userList = await sdk.task.getUsers(task.folderId);
          setUsers(userList);
          
          // Set the currently assigned user if any
          if (task.assignedToUserId) {
            setCurrentlyAssignedUserId(task.assignedToUserId);
            const assignedUser = userList.find((u: any) => u.id === task.assignedToUserId);
            if (assignedUser) {
              setCurrentlyAssignedUserName(assignedUser.displayName || `${assignedUser.name} ${assignedUser.surname}`);
              // Pre-select the currently assigned user
              setSelectedUserId(task.assignedToUserId);
              setSelectedUserName(assignedUser.displayName || `${assignedUser.name} ${assignedUser.surname}`);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching task details or users:', error);
        setAssignmentError('Failed to load user list');
      }
    };

    fetchTaskAndUsers();
  }, [taskId, sdk, isInitialized]);

  useEffect(() => {
    if (!taskUrl) {
      setIsLoading(false);
      return;
    }
    // Simulate a short loading state to ensure iframe has time to initialize
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, [taskUrl]);

  // Handle user assignment/reassignment
  const handleAssignTask = async () => {
    if (!taskId || !selectedUserId) return;

    // Don't reassign to the same user
    if (currentlyAssignedUserId && currentlyAssignedUserId === selectedUserId) {
      setAssignmentError('Task is already assigned to this user');
      return;
    }

    setIsAssigning(true);
    setAssignmentError(null);
    setAssignmentSuccess(false);

    try {
      let result: TaskAssignmentResult[];
      
      if (currentlyAssignedUserId) {
        // Task is already assigned, use reassign method
        result = await sdk.task.reassign({
          taskId: taskId,
          userId: selectedUserId
        });
      } else {
        // Task is not assigned, use assign method
        result = await sdk.task.assign({
          taskId: taskId,
          userId: selectedUserId
        });
      }

      // Check if the result indicates success
      if (result && result.length > 0 && result[0].errorCode) {
        setAssignmentError(result[0].errorMessage || 'Failed to assign task');
      } else {
        setAssignmentSuccess(true);
        // Update the currently assigned user
        setCurrentlyAssignedUserId(selectedUserId);
        setCurrentlyAssignedUserName(selectedUserName);
        
        // Reload the iframe to reflect the assignment
        const iframe = document.querySelector('iframe');
        if (iframe) {
          iframe.src = iframe.src;
        }
        // Clear success message after 3 seconds
        setTimeout(() => setAssignmentSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Error assigning/reassigning task:', error);
      setAssignmentError(currentlyAssignedUserId ? 'Failed to reassign task' : 'Failed to assign task');
    } finally {
      setIsAssigning(false);
    }
  };

  if (!taskUrl) {
    return (
      <div className="pt-16 md:ml-64 min-h-screen">
        <div className="p-4">
          No task URL provided
        </div>
      </div>
    );
  }

  return (
    <div className="pt-16 md:ml-64 min-h-screen">
      <div className="p-4 h-full relative">
        {/* User Assignment Section */}
        {taskId && (
          <div className={`mb-4 p-4 rounded-lg border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow`}>
            {/* Current Assignment Status */}
            {currentlyAssignedUserId && (
              <div className={`mb-3 p-2 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <span className="text-sm text-gray-600 dark:text-gray-400">Currently assigned to: </span>
                <span className="font-medium">{currentlyAssignedUserName}</span>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 flex-1">
                <UserIcon className="w-5 h-5 text-gray-500" />
                <label className="font-medium">
                  {currentlyAssignedUserId ? 'Reassign to:' : 'Assign to:'}
                </label>
                <div className="relative flex-1 max-w-xs" ref={dropdownRef}>
                  <div className="relative">
                    <input
                      type="text"
                      value={isDropdownOpen ? searchTerm : selectedUserName}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onFocus={() => {
                        setIsDropdownOpen(true);
                        setSearchTerm('');
                      }}
                      placeholder="Search and select a user..."
                      className={`w-full px-3 py-2 pr-10 rounded-lg border ${
                        theme === 'dark'
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                      disabled={isAssigning || users.length === 0}
                    />
                    <SearchIcon className="absolute right-3 top-2.5 w-5 h-5 text-gray-400 pointer-events-none" />
                  </div>
                  
                  {isDropdownOpen && (
                    <div className={`absolute z-10 w-full mt-1 max-h-60 overflow-auto rounded-lg shadow-lg border ${
                      theme === 'dark'
                        ? 'bg-gray-800 border-gray-700'
                        : 'bg-white border-gray-200'
                    }`}>
                      {filteredUsers.length === 0 ? (
                        <div className="px-3 py-2 text-gray-500">
                          No users found
                        </div>
                      ) : (
                        filteredUsers.map((user) => (
                          <button
                            key={user.id}
                            onClick={() => {
                              setSelectedUserId(user.id);
                              setSelectedUserName(user.displayName || `${user.name} ${user.surname}`);
                              setIsDropdownOpen(false);
                              setSearchTerm('');
                            }}
                            className={`w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 ${
                              selectedUserId === user.id ? 'bg-gray-100 dark:bg-gray-700' : ''
                            }`}
                          >
                            <div className="font-medium">
                              {user.displayName || `${user.name} ${user.surname}`}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {user.emailAddress}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
                <button
                  onClick={handleAssignTask}
                  disabled={!selectedUserId || isAssigning || (currentlyAssignedUserId === selectedUserId)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    !selectedUserId || isAssigning || (currentlyAssignedUserId === selectedUserId)
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : currentlyAssignedUserId 
                        ? 'bg-orange-500 hover:bg-orange-600 text-white'
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                >
                  {isAssigning ? (
                    <span className="flex items-center">
                      <Loader2Icon className="w-4 h-4 mr-2 animate-spin" />
                      {currentlyAssignedUserId ? 'Reassigning...' : 'Assigning...'}
                    </span>
                  ) : (
                    currentlyAssignedUserId ? 'Reassign' : 'Assign'
                  )}
                </button>
              </div>
              {assignmentSuccess && (
                <div className="flex items-center text-green-600 ml-4">
                  <CheckIcon className="w-5 h-5 mr-2" />
                  Task {currentlyAssignedUserId ? 'reassigned' : 'assigned'} successfully!
                </div>
              )}
              {assignmentError && (
                <div className="text-red-600 ml-4">
                  {assignmentError}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-gray-900 bg-opacity-75 dark:bg-opacity-75 z-10">
            <Loader2Icon className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        )}

        {/* Task Iframe */}
        <iframe
          src={embedUrl}
          className={`w-full rounded-lg border-0 ${taskId ? 'h-[calc(100vh-12rem)]' : 'h-[calc(100vh-6rem)]'}`}
          title="Task View"
          onLoad={() => setIsLoading(false)}
        />
      </div>
    </div>
  );
};

export default ProcessTask; 