import React, { useState } from 'react';
import { XIcon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  requireJustification?: boolean;
  onConfirm: (justification?: string) => void;
  onCancel: () => void;
}
const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmText,
  cancelText,
  requireJustification = false,
  onConfirm,
  onCancel
}) => {
  const {
    theme
  } = useTheme();
  const [justification, setJustification] = useState('');
  if (!isOpen) return null;
  return <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className={`relative w-full max-w-md p-6 rounded-lg shadow-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
        <button onClick={onCancel} className="absolute top-3 right-3 text-gray-400 hover:text-gray-500">
          <XIcon className="w-5 h-5" />
        </button>
        <h3 className="text-lg font-medium mb-2">{title}</h3>
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          {message}
        </p>
        {requireJustification && <div className="mb-4">
            <label htmlFor="justification" className="block mb-2 text-sm font-medium">
              Justification
            </label>
            <textarea id="justification" rows={3} value={justification} onChange={e => setJustification(e.target.value)} className={`w-full px-3 py-2 border rounded-lg ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} placeholder="Please provide a reason..." />
          </div>}
        <div className="flex justify-end space-x-3">
          <button onClick={onCancel} className={`px-4 py-2 text-sm font-medium rounded-lg ${theme === 'dark' ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}>
            {cancelText}
          </button>
          <button onClick={() => onConfirm(requireJustification ? justification : undefined)} disabled={requireJustification && !justification.trim()} className={`px-4 py-2 text-sm font-medium text-white rounded-lg ${requireJustification && !justification.trim() ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>;
};
export default ConfirmationModal;