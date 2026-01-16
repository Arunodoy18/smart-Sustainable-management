import { endpoints } from './config';
import { tokenStorage } from './api';
import type { WSMessage, WSEventType } from './types';

type WSEventHandler = (message: WSMessage) => void;

class WebSocketManager {
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private handlers: Map<WSEventType | 'all', Set<WSEventHandler>> = new Map();
  private isIntentionallyClosed = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  connect(): void {
    // Skip if running server-side
    if (typeof window === 'undefined') {
      return;
    }
    
    const token = tokenStorage.get();
    if (!token) {
      // Don't warn - this is expected when not logged in
      return;
    }

    if (this.socket?.readyState === WebSocket.OPEN) {
      return;
    }

    // Clear any pending reconnect
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.isIntentionallyClosed = false;

    try {
      const wsUrl = endpoints.waste.ws(token);
      
      // Skip connection if URL looks invalid
      if (!wsUrl || wsUrl.includes('undefined')) {
        console.warn('[WebSocket] Invalid WebSocket URL - skipping connection');
        return;
      }
      
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        console.info('[WebSocket] Connected');
        this.reconnectAttempts = 0;
      };

      this.socket.onmessage = (event) => {
        try {
          const message: WSMessage = JSON.parse(event.data);
          this.notifyHandlers(message);
        } catch {
          // Silently ignore malformed messages
        }
      };

      this.socket.onclose = (event) => {
        if (!this.isIntentionallyClosed && event.code !== 1000) {
          console.info('[WebSocket] Connection closed, will retry');
          this.attemptReconnect();
        }
      };

      this.socket.onerror = () => {
        // Error details are not accessible in browser for security reasons
        // The onclose handler will trigger reconnection
      };
    } catch {
      // WebSocket creation failed - likely invalid URL
      console.warn('[WebSocket] Failed to create connection');
    }
  }

  disconnect(): void {
    this.isIntentionallyClosed = true;
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.socket) {
      try {
        this.socket.close(1000, 'User logout');
      } catch {
        // Ignore close errors
      }
      this.socket = null;
    }
    
    this.reconnectAttempts = 0;
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.info('[WebSocket] Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  subscribe(eventType: WSEventType | 'all', handler: WSEventHandler): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    this.handlers.get(eventType)!.add(handler);

    // Return unsubscribe function
    return () => {
      this.handlers.get(eventType)?.delete(handler);
    };
  }

  private notifyHandlers(message: WSMessage): void {
    // Notify specific event handlers
    this.handlers.get(message.type)?.forEach((handler) => {
      try {
        handler(message);
      } catch {
        // Prevent handler errors from breaking the WebSocket
      }
    });
    // Notify 'all' handlers
    this.handlers.get('all')?.forEach((handler) => {
      try {
        handler(message);
      } catch {
        // Prevent handler errors from breaking the WebSocket
      }
    });
  }

  send(data: Record<string, unknown>): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      try {
        this.socket.send(JSON.stringify(data));
      } catch {
        // Ignore send failures - connection may have dropped
      }
    }
  }

  get isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }
}

export const wsManager = new WebSocketManager();
