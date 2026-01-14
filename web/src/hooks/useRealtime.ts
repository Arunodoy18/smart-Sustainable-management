'use client';

import { useEffect, useCallback, useState } from 'react';
import { wsManager } from '@/lib/websocket';
import type { WSMessage, WSEventType } from '@/lib/types';

interface UseRealtimeOptions {
  onNewPickup?: (data: WSMessage['data']) => void;
  onPickupAccepted?: (data: WSMessage['data']) => void;
  onPickupCollected?: (data: WSMessage['data']) => void;
  onStatusUpdate?: (data: WSMessage['data']) => void;
  onDriverLocation?: (data: WSMessage['data']) => void;
}

interface UseRealtimeReturn {
  isConnected: boolean;
  lastMessage: WSMessage | null;
  send: (data: Record<string, unknown>) => void;
  connect: () => void;
  disconnect: () => void;
}

export function useRealtime(options: UseRealtimeOptions = {}): UseRealtimeReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WSMessage | null>(null);

  const {
    onNewPickup,
    onPickupAccepted,
    onPickupCollected,
    onStatusUpdate,
    onDriverLocation,
  } = options;

  useEffect(() => {
    // Check connection status periodically
    const interval = setInterval(() => {
      setIsConnected(wsManager.isConnected);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const unsubscribers: (() => void)[] = [];

    // Subscribe to all messages for lastMessage state
    unsubscribers.push(
      wsManager.subscribe('all', (message) => {
        setLastMessage(message);
      })
    );

    // Subscribe to specific events
    if (onNewPickup) {
      unsubscribers.push(wsManager.subscribe('new_pickup', (msg) => onNewPickup(msg.data)));
    }
    if (onPickupAccepted) {
      unsubscribers.push(wsManager.subscribe('pickup_accepted', (msg) => onPickupAccepted(msg.data)));
    }
    if (onPickupCollected) {
      unsubscribers.push(wsManager.subscribe('pickup_collected', (msg) => onPickupCollected(msg.data)));
    }
    if (onStatusUpdate) {
      unsubscribers.push(wsManager.subscribe('status_update', (msg) => onStatusUpdate(msg.data)));
    }
    if (onDriverLocation) {
      unsubscribers.push(wsManager.subscribe('driver_location', (msg) => onDriverLocation(msg.data)));
    }

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [onNewPickup, onPickupAccepted, onPickupCollected, onStatusUpdate, onDriverLocation]);

  const connect = useCallback(() => {
    wsManager.connect();
  }, []);

  const disconnect = useCallback(() => {
    wsManager.disconnect();
  }, []);

  const send = useCallback((data: Record<string, unknown>) => {
    wsManager.send(data);
  }, []);

  return {
    isConnected,
    lastMessage,
    send,
    connect,
    disconnect,
  };
}
