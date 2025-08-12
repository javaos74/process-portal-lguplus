import React, { useState } from 'react';
import { XIcon, SendIcon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
interface HelpPanelProps {
  isOpen: boolean;
  onClose: () => void;
}
const HelpPanel: React.FC<HelpPanelProps> = ({
  isOpen,
  onClose
}) => {
  const {
    theme
  } = useTheme();
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<{
    text: string;
    isUser: boolean;
  }[]>([{
    text: "Hi! I'm your AI assistant. How can I help you with process management today?",
    isUser: false
  }]);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    // Add user message
    setMessages(prev => [...prev, {
      text: query,
      isUser: true
    }]);
    // Simulate AI response based on query
    setTimeout(() => {
      let response = "I'm analyzing your processes to help with that question.";
      if (query.toLowerCase().includes('delay')) {
        response = "I've analyzed your processes and found that the 'Document Review' step is taking 150% longer than usual. This appears to be the main cause of delays.";
      } else if (query.toLowerCase().includes('older than')) {
        response = 'I found 5 tasks that are older than 2 days. Would you like me to show them to you?';
      } else if (query.toLowerCase().includes('help')) {
        response = "You can ask me questions about process performance, bottlenecks, or specific instances. Try questions like 'What's causing delays?' or 'Show me tasks older than 2 days'.";
      }
      setMessages(prev => [...prev, {
        text: response,
        isUser: false
      }]);
    }, 1000);
    setQuery('');
  };
  return <div className={`fixed right-0 top-[57px] h-[calc(100vh-57px)] w-80 transition-transform ${isOpen ? 'translate-x-0' : 'translate-x-full'} ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} border-l ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} flex flex-col`}>
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold">AI Assistant</h2>
        <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
          <XIcon className="w-5 h-5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => <div key={index} className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-lg ${msg.isUser ? 'bg-blue-500 text-white' : theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
              {msg.text}
            </div>
          </div>)}
      </div>
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          <input type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="Ask about your processes..." className={`flex-1 p-2 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`} />
          <button type="submit" className="p-2 bg-blue-500 text-white rounded-r-lg hover:bg-blue-600">
            <SendIcon className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>;
};
export default HelpPanel;