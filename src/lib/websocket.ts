import React from 'react';
import { io, Socket } from 'socket.io-client';

export interface WebSocketMessage {
    type: 'TIME_UPDATE' | 'PROJECT_UPDATE' | 'NOTIFICATION' | 'USER_STATUS' | 'CHAT_MESSAGE';
    data: any;
    userId?: string;
    timestamp: string;
}

export interface UserStatusUpdate {
    userId: string;
    status: 'WORKING' | 'BREAK' | 'OFFLINE' | 'SICK' | 'VACATION';
    lastSeen: string;
    currentProject?: string;
}

export interface TimeTrackingUpdate {
    userId: string;
    action: 'START' | 'END' | 'BREAK_START' | 'BREAK_END';
    timestamp: string;
    projectId?: string;
}

export interface NotificationUpdate {
    id: string;
    type: 'TIME_TRACKING' | 'PROJECT' | 'TEAM' | 'SYSTEM' | 'MESSAGE';
    priority: 'urgent' | 'high' | 'normal' | 'low';
    title: string;
    message: string;
    userId: string;
    read: boolean;
}

class WebSocketClient {
    private socket: Socket | null = null;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectDelay = 1000;
    private isInitialized = false;

    // Event listeners
    private listeners: Map<string, Set<Function>> = new Map();

    constructor() {
        // Only initialize on client side
        if (typeof window !== 'undefined') {
            this.connect();
        }
    }

    private connect() {
        if (typeof window === 'undefined') return;

        try {
            this.socket = io(process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001', {
                transports: ['websocket', 'polling'],
                timeout: 20000,
                forceNew: true,
            });

            this.socket.on('connect', () => {
                console.log('✅ WebSocket connected');
                this.reconnectAttempts = 0;
                this.isInitialized = true;
                this.emit('connected', { timestamp: new Date().toISOString() });
            });

            this.socket.on('disconnect', (reason: string) => {
                console.log('❌ WebSocket disconnected:', reason);
                this.emit('disconnected', { reason, timestamp: new Date().toISOString() });
                this.handleReconnect();
            });

            this.socket.on('connect_error', (error: Error) => {
                console.error('🔴 WebSocket connection error:', error);
                this.handleReconnect();
            });

            // Real-time event handlers
            this.socket.on('timeUpdate', (data: TimeTrackingUpdate) => {
                this.emit('timeUpdate', data);
            });

            this.socket.on('userStatusUpdate', (data: UserStatusUpdate) => {
                this.emit('userStatusUpdate', data);
            });

            this.socket.on('notification', (data: NotificationUpdate) => {
                this.emit('notification', data);
            });

            this.socket.on('projectUpdate', (data: any) => {
                this.emit('projectUpdate', data);
            });

            this.socket.on('chatMessage', (data: any) => {
                this.emit('chatMessage', data);
            });

        } catch (error) {
            console.error('Failed to create WebSocket connection:', error);
            this.handleReconnect();
        }
    }

    private handleReconnect() {
        if (typeof window === 'undefined') return;

        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

            console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms`);

            setTimeout(() => {
                this.connect();
            }, delay);
        } else {
            console.error('❌ Max reconnection attempts reached');
            this.emit('maxReconnectAttemptsReached', {});
        }
    }

    // Event emitter methods
    on(event: string, callback: Function) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event)!.add(callback);
    }

    off(event: string, callback: Function) {
        const eventListeners = this.listeners.get(event);
        if (eventListeners) {
            eventListeners.delete(callback);
        }
    }

    private emit(event: string, data: any) {
        const eventListeners = this.listeners.get(event);
        if (eventListeners) {
            eventListeners.forEach(callback => callback(data));
        }
    }

    // Public methods
    sendMessage(type: WebSocketMessage['type'], data: any) {
        if (this.socket?.connected) {
            this.socket.emit('message', {
                type,
                data,
                timestamp: new Date().toISOString(),
            });
        } else {
            console.warn('WebSocket not connected, message not sent:', { type, data });
        }
    }

    joinRoom(roomId: string) {
        if (this.socket?.connected) {
            this.socket.emit('joinRoom', roomId);
        }
    }

    leaveRoom(roomId: string) {
        if (this.socket?.connected) {
            this.socket.emit('leaveRoom', roomId);
        }
    }

    updateUserStatus(status: UserStatusUpdate['status'], projectId?: string) {
        this.sendMessage('USER_STATUS', {
            status,
            projectId,
            timestamp: new Date().toISOString(),
        });
    }

    sendTimeUpdate(action: TimeTrackingUpdate['action'], projectId?: string) {
        this.sendMessage('TIME_UPDATE', {
            action,
            projectId,
            timestamp: new Date().toISOString(),
        });
    }

    sendChatMessage(roomId: string, message: string, attachments?: any[]) {
        if (this.socket?.connected) {
            this.socket.emit('chatMessage', {
                roomId,
                message,
                attachments,
                timestamp: new Date().toISOString(),
            });
        }
    }

    isConnected(): boolean {
        return this.socket?.connected || false;
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }
}

// Create singleton instance
let websocketClient: WebSocketClient | null = null;

// Lazy initialization
export function getWebSocketClient(): WebSocketClient {
    if (typeof window === 'undefined') {
        // Return a mock client for SSR
        return {
            on: () => { },
            off: () => { },
            sendMessage: () => { },
            joinRoom: () => { },
            leaveRoom: () => { },
            updateUserStatus: () => { },
            sendTimeUpdate: () => { },
            sendChatMessage: () => { },
            isConnected: () => false,
            disconnect: () => { },
        } as any;
    }

    if (!websocketClient) {
        websocketClient = new WebSocketClient();
    }
    return websocketClient;
}

// React hook for easy WebSocket usage
export function useWebSocket() {
    const [isConnected, setIsConnected] = React.useState(false);
    const [client] = React.useState(() => getWebSocketClient());

    React.useEffect(() => {
        if (typeof window === 'undefined') return;

        const handleConnect = () => setIsConnected(true);
        const handleDisconnect = () => setIsConnected(false);

        client.on('connected', handleConnect);
        client.on('disconnected', handleDisconnect);

        // Set initial connection state
        setIsConnected(client.isConnected());

        return () => {
            client.off('connected', handleConnect);
            client.off('disconnected', handleDisconnect);
        };
    }, [client]);

    return {
        isConnected,
        sendMessage: client.sendMessage.bind(client),
        on: client.on.bind(client),
        off: client.off.bind(client),
        joinRoom: client.joinRoom.bind(client),
        leaveRoom: client.leaveRoom.bind(client),
        updateUserStatus: client.updateUserStatus.bind(client),
        sendTimeUpdate: client.sendTimeUpdate.bind(client),
        sendChatMessage: client.sendChatMessage.bind(client),
    };
}

export default getWebSocketClient(); 