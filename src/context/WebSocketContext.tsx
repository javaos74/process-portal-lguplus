import React, { useEffect, useState, createContext, useContext } from 'react';
interface WebSocketMessage {
  type: string;
  payload: any;
}
interface WebSocketContextType {
  lastMessage: WebSocketMessage | null;
  connected: boolean;
}
const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);
// This is a mock implementation since we can't actually connect to a WebSocket
export const WebSocketProvider: React.FC<{
  children: React.ReactNode;
}> = ({
  children
}) => {
  const [connected, setConnected] = useState(true);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  useEffect(() => {
    // Simulate WebSocket messages
    const interval = setInterval(() => {
      const types = ['process_update', 'task_completed', 'sla_warning'];
      const randomType = types[Math.floor(Math.random() * types.length)];
      setLastMessage({
        type: randomType,
        payload: {
          id: Math.floor(Math.random() * 1000).toString(),
          timestamp: new Date().toISOString()
        }
      });
    }, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, []);
  return <WebSocketContext.Provider value={{
    lastMessage,
    connected
  }}>
      {children}
    </WebSocketContext.Provider>;
};
export const useWebSocket = (): WebSocketContextType => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};