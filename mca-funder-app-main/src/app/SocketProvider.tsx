"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useRef,
  useCallback,
  useMemo,
} from "react";

interface WebSocketContextType {
  ws: WebSocket | null;
  isConnected: boolean;
  sendMessage: (message: any) => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export function SocketProvider({ children }: { readonly children: ReactNode }) {
  const wsRef = useRef<WebSocket | null>(null);

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn("WebSocket is not connected. Message not sent:", message);
    }
  }, []);

  const contextValue = useMemo(
    () => ({
      ws: null,
      isConnected: false,
      sendMessage,
    }),
    [sendMessage]
  );

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
}

export const useSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useSocket must be used within SocketProvider");
  }
  return context;
};
