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

let globalClient: WebSocketClient | null = null;

export function getWebSocketClient(): WebSocketClient {
    if (!globalClient) {
        globalClient = new WebSocketClient();
    }
    return globalClient;
}

class WebSocketClient {
    private socket: Socket | null = null;
    private eventHandlers: Map<string, Function[]> = new Map();
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private isConnecting = false;
    private pollingInterval: NodeJS.Timeout | null = null;
    private usePolling = false;

    constructor() {
        if (typeof window !== 'undefined') {
            this.connect();
        }
    }

    private connect() {
        if (this.isConnecting || this.socket?.connected) return;

        this.isConnecting = true;

        try {
            // Try WebSocket first, fallback to polling for Vercel
            const socketUrl = process.env.NODE_ENV === 'production'
                ? window.location.origin // Use same domain in production
                : 'http://localhost:3001';

            this.socket = io(socketUrl, {
                auth: {
                    userId: this.getUserId(),
                },
                transports: ['websocket', 'polling'], // Allow both transports
                timeout: 5000,
                forceNew: true,
            });

            this.socket.on('connect', () => {
                console.log('✅ WebSocket connected');
                this.isConnecting = false;
                this.reconnectAttempts = 0;
                this.usePolling = false;
                this.emit('connected');

                // Stop polling if WebSocket works
                if (this.pollingInterval) {
                    clearInterval(this.pollingInterval);
                    this.pollingInterval = null;
                }
            });

            this.socket.on('disconnect', () => {
                console.log('❌ WebSocket disconnected');
                this.emit('disconnected');
                this.startPollingFallback();
            });

            this.socket.on('connect_error', (error) => {
                console.warn('WebSocket connection failed, falling back to polling:', error);
                this.isConnecting = false;
                this.startPollingFallback();
            });

            // Set up event listeners
            this.setupEventListeners();

        } catch (error) {
            console.error('WebSocket setup failed:', error);
            this.isConnecting = false;
            this.startPollingFallback();
        }
    }

    private startPollingFallback() {
        if (this.usePolling || this.pollingInterval) return;

        console.log('🔄 Starting polling fallback for real-time updates');
        this.usePolling = true;
        this.emit('disconnected');

        // Poll for updates every 5 seconds
        this.pollingInterval = setInterval(async () => {
            try {
                await this.pollForUpdates();
            } catch (error) {
                console.error('Polling error:', error);
            }
        }, 5000);
    }

    private async pollForUpdates() {
        try {
            // Poll for new messages, notifications, etc.
            const response = await fetch('/api/realtime/poll', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();

                // Emit events for any updates
                if (data.messages?.length > 0) {
                    data.messages.forEach((message: any) => {
                        this.emit('newChatMessage', message);
                    });
                }

                if (data.notifications?.length > 0) {
                    data.notifications.forEach((notification: any) => {
                        this.emit('notification', notification);
                    });
                }

                if (data.timeUpdates?.length > 0) {
                    data.timeUpdates.forEach((update: any) => {
                        this.emit('timeUpdate', update);
                    });
                }
            }
        } catch (error) {
            console.error('Polling failed:', error);
        }
    }

    private setupEventListeners() {
        if (!this.socket) return;

        // Chat events
        this.socket.on('newChatMessage', (data) => {
            this.emit('newChatMessage', data);
        });

        this.socket.on('userTyping', (data) => {
            this.emit('userTyping', data);
        });

        this.socket.on('userJoinedRoom', (data) => {
            this.emit('userJoinedRoom', data);
        });

        this.socket.on('userLeftRoom', (data) => {
            this.emit('userLeftRoom', data);
        });

        // Time tracking events
        this.socket.on('timeUpdate', (data) => {
            this.emit('timeUpdate', data);
        });

        // User status events
        this.socket.on('userStatusUpdate', (data) => {
            this.emit('userStatusUpdate', data);
        });

        this.socket.on('activeUsers', (data) => {
            this.emit('activeUsers', data);
        });

        // Notification events
        this.socket.on('notification', (data) => {
            this.emit('notification', data);
        });

        // Error handling
        this.socket.on('error', (error) => {
            console.error('WebSocket error:', error);
            this.emit('error', error);
        });
    }

    private getUserId(): string {
        // Get user ID from session storage or other source
        if (typeof window !== 'undefined') {
            return localStorage.getItem('userId') || 'anonymous';
        }
        return 'anonymous';
    }

    isConnected(): boolean {
        return this.socket?.connected || false;
    }

    on(event: string, handler: Function) {
        if (!this.eventHandlers.has(event)) {
            this.eventHandlers.set(event, []);
        }
        this.eventHandlers.get(event)!.push(handler);
    }

    off(event: string, handler: Function) {
        const handlers = this.eventHandlers.get(event);
        if (handlers) {
            const index = handlers.indexOf(handler);
            if (index > -1) {
                handlers.splice(index, 1);
            }
        }
    }

    emit(event: string, data?: any) {
        const handlers = this.eventHandlers.get(event);
        if (handlers) {
            handlers.forEach(handler => handler(data));
        }
    }

    sendMessage(type: string, data: any) {
        const message: WebSocketMessage = {
            type: type as any,
            data,
            timestamp: new Date().toISOString(),
        };

        if (this.socket?.connected) {
            this.socket.emit('message', message);
        } else {
            // Fallback: send via HTTP API
            this.sendViaAPI(type, data);
        }
    }

    private async sendViaAPI(type: string, data: any) {
        try {
            await fetch('/api/realtime/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ type, data }),
            });
        } catch (error) {
            console.error('Failed to send via API:', error);
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

    updateUserStatus(status: string, projectId?: string) {
        if (this.socket?.connected) {
            this.socket.emit('userStatusUpdate', { status, projectId });
        }
    }

    sendTimeUpdate(action: string, projectId?: string) {
        if (this.socket?.connected) {
            this.socket.emit('timeUpdate', { action, projectId });
        }
    }

    sendChatMessage(roomId: string, message: string, attachments?: any[]) {
        if (this.socket?.connected) {
            this.socket.emit('chatMessage', {
                roomId,
                message,
                attachments,
                timestamp: new Date().toISOString(),
            });
        } else {
            // Fallback: send via HTTP API
            this.sendChatViaAPI(roomId, message, attachments);
        }
    }

    private async sendChatViaAPI(roomId: string, message: string, attachments?: any[]) {
        try {
            await fetch('/api/chat/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    roomId,
                    content: message,
                    attachments,
                }),
            });
        } catch (error) {
            console.error('Failed to send chat message via API:', error);
        }
    }

    disconnect() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }

        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }

        this.usePolling = false;
        this.emit('disconnected');
    }
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