import React, { useState } from 'react';
import { XIcon, CheckIcon, XCircleIcon, FileTextIcon, PaperclipIcon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { ProcessStep } from '../../data/mockProcessInstance';
interface HumanTaskPanelProps {
  isOpen: boolean;
  onClose: () => void;
  task: ProcessStep | null;
}
const HumanTaskPanel: React.FC<HumanTaskPanelProps> = ({
  isOpen,
  onClose,
  task
}) => {
  const {
    theme
  } = useTheme();
  const [notes, setNotes] = useState('');
  const [decision, setDecision] = useState<'approve' | 'reject' | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const handleSubmit = () => {
    // In a real app, this would submit the task completion
    console.log('Task completed', {
      taskId: task?.id,
      decision,
      notes,
      uploadedFiles
    });
    onClose();
  };
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      // In a real app, this would upload the file to a server
      // Here we just add the file name to the list
      const newFiles = Array.from(e.target.files).map(file => file.name);
      setUploadedFiles([...uploadedFiles, ...newFiles]);
    }
  };
  if (!task) return null;
  return <div className={`fixed right-0 top-[57px] h-[calc(100vh-57px)] w-3/4 transition-transform ${isOpen ? 'translate-x-0' : 'translate-x-full'} ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} border-l ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} flex flex-col z-30`}>
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          <h2 className="text-xl font-semibold">Human Task</h2>
          <div className="ml-4 px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            {task.status === 'active' ? 'In Progress' : task.status}
          </div>
        </div>
        <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
          <XIcon className="w-6 h-6" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-3 gap-8">
          <div className="col-span-2">
            <div className="mb-8">
              <h3 className="text-2xl font-medium mb-2">{task.name}</h3>
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-4">
                <span className="mr-3">Assigned to: {task.performer}</span>
                <span>
                  {task.startTime && `Started: ${new Date(task.startTime).toLocaleString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}`}
                </span>
              </div>
              <div className={`p-4 rounded-lg mb-6 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <h4 className="font-medium mb-2">Task Description</h4>
                <p>
                  Review the customer documents and verify that they meet the
                  requirements. Check for completeness, accuracy, and
                  authenticity. The documents should be properly signed and
                  dated. If any issues are found, please reject the documents
                  and provide detailed notes on what needs to be corrected.
                </p>
              </div>
            </div>
            <div className="mb-8">
              <h4 className="text-lg font-medium mb-3">Input Documents</h4>
              <div className="grid grid-cols-2 gap-4">
                {task.inputs?.map((input, index) => <div key={index} className={`p-4 rounded-lg flex items-center ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <FileTextIcon className="w-6 h-6 mr-3 text-blue-500" />
                    <span>{input}</span>
                  </div>)}
              </div>
            </div>
            <div className="mb-8">
              <h4 className="text-lg font-medium mb-3">Notes</h4>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Add your notes here..." className={`w-full p-4 rounded-lg resize-none ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-100 border-gray-300 text-gray-900'}`} rows={6} />
            </div>
          </div>
          <div>
            <div className="mb-8">
              <h4 className="text-lg font-medium mb-3">Decision</h4>
              <div className="space-y-3">
                <button className={`w-full py-3 px-4 rounded-lg flex items-center justify-center text-base ${decision === 'approve' ? 'bg-green-500 text-white' : theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`} onClick={() => setDecision('approve')}>
                  <CheckIcon className="w-5 h-5 mr-2" />
                  Approve Documents
                </button>
                <button className={`w-full py-3 px-4 rounded-lg flex items-center justify-center text-base ${decision === 'reject' ? 'bg-red-500 text-white' : theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`} onClick={() => setDecision('reject')}>
                  <XCircleIcon className="w-5 h-5 mr-2" />
                  Reject Documents
                </button>
              </div>
            </div>
            <div className="mb-8">
              <h4 className="text-lg font-medium mb-3">Attachments</h4>
              <div className="space-y-3">
                {uploadedFiles.map((file, index) => <div key={index} className={`p-3 rounded-lg flex items-center justify-between ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <div className="flex items-center">
                      <PaperclipIcon className="w-5 h-5 mr-2 text-blue-500" />
                      <span>{file}</span>
                    </div>
                    <button className="text-red-500 hover:text-red-700 p-1" onClick={() => setUploadedFiles(uploadedFiles.filter((_, i) => i !== index))}>
                      <XIcon className="w-5 h-5" />
                    </button>
                  </div>)}
                <label className={`p-3 rounded-lg flex items-center justify-center cursor-pointer ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}>
                  <PaperclipIcon className="w-5 h-5 mr-2" />
                  <span>Attach Files</span>
                  <input type="file" className="hidden" onChange={handleFileUpload} multiple />
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="p-6 border-t border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <button onClick={onClose} className="px-6 py-3 rounded-lg font-medium border border-gray-300 dark:border-gray-600">
            Save as Draft
          </button>
          <button onClick={handleSubmit} disabled={!decision} className={`px-6 py-3 rounded-lg font-medium ${decision ? 'bg-blue-500 hover:bg-blue-600 text-white' : theme === 'dark' ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}>
            Complete Task
          </button>
        </div>
      </div>
    </div>;
};
export default HumanTaskPanel;