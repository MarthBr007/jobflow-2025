"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  UserGroupIcon,
  HashtagIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";
import ChatInterface from "@/components/chat/ChatInterface";
import Button from "@/components/ui/Button";
import { useWebSocket } from "@/lib/websocket";
import Breadcrumbs from "@/components/ui/Breadcrumbs";

interface ChatRoom {
  id: string;
  name: string;
  type: "direct" | "group" | "project" | "general";
  participants: ChatParticipant[];
  lastMessage?: ChatMessage;
  unreadCount: number;
  avatar?: string;
  description?: string;
  projectId?: string;
}

interface ChatParticipant {
  id: string;
  name: string;
  avatar?: string;
  status: "online" | "away" | "busy" | "offline";
  role?: "admin" | "member";
  lastSeen?: string;
}

interface ChatMessage {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  timestamp: string;
  type: "text" | "image" | "file" | "system";
  attachments?: any[];
  reactions?: any[];
  replyTo?: string;
  edited?: boolean;
  editedAt?: string;
}

export default function ChatPage() {
  const { data: session } = useSession();
  const [currentRoom, setCurrentRoom] = useState<ChatRoom | null>(null);
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { isConnected, joinRoom, leaveRoom, on, off } = useWebSocket();

  // Demo data - in production this would come from API
  useEffect(() => {
    const demoRooms: ChatRoom[] = [
      {
        id: "general",
        name: "Algemene Chat",
        type: "general",
        participants: [
          {
            id: "user1",
            name: "John Doe",
            status: "online",
            role: "admin",
          },
          {
            id: "user2",
            name: "Jane Smith",
            status: "online",
            role: "member",
          },
        ],
        unreadCount: 3,
        description: "Algemene discussies en mededelingen",
      },
      {
        id: "project-1",
        name: "Project Alpha",
        type: "project",
        participants: [
          {
            id: "user1",
            name: "John Doe",
            status: "online",
            role: "admin",
          },
          {
            id: "user3",
            name: "Mike Johnson",
            status: "away",
            role: "member",
          },
        ],
        unreadCount: 1,
        projectId: "project-1",
        description: "Project Alpha team communicatie",
      },
      {
        id: "direct-jane",
        name: "Jane Smith",
        type: "direct",
        participants: [
          {
            id: "user2",
            name: "Jane Smith",
            status: "online",
            role: "member",
          },
        ],
        unreadCount: 0,
        avatar: "/avatars/jane.jpg",
      },
    ];

    setRooms(demoRooms);
  }, []);

  // Demo messages - in production this would come from API
  useEffect(() => {
    if (currentRoom) {
      const demoMessages: ChatMessage[] = [
        {
          id: "msg1",
          content: "Hallo team! Welkom in de chat.",
          senderId: "user1",
          senderName: "John Doe",
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          type: "text",
        },
        {
          id: "msg2",
          content: "Bedankt! Fijn dat dit er nu is 👍",
          senderId: "user2",
          senderName: "Jane Smith",
          timestamp: new Date(Date.now() - 1800000).toISOString(),
          type: "text",
          reactions: [
            { emoji: "👍", count: 2, users: ["John Doe", "Mike Johnson"] },
          ],
        },
        {
          id: "msg3",
          content: "De nieuwe functies zien er geweldig uit!",
          senderId: session?.user?.id || "current-user",
          senderName: session?.user?.name || "Jij",
          timestamp: new Date(Date.now() - 300000).toISOString(),
          type: "text",
        },
      ];

      setMessages(demoMessages);
    }
  }, [currentRoom, session]);

  // Listen for real-time chat messages
  useEffect(() => {
    if (!isConnected) return;

    const handleChatMessage = (data: any) => {
      console.log("📨 Received chat message:", data);

      // Add the new message to the current room if it matches
      if (currentRoom && data.roomId === currentRoom.id) {
        const newMessage: ChatMessage = {
          id: data.id || `msg-${Date.now()}`,
          content: data.message,
          senderId: data.senderId,
          senderName: data.senderName,
          timestamp: data.timestamp,
          type: "text",
          attachments: data.attachments,
        };

        setMessages((prev) => [...prev, newMessage]);
      }

      // Update unread count for other rooms
      setRooms((prev) =>
        prev.map((room) => {
          if (
            room.id === data.roomId &&
            (!currentRoom || room.id !== currentRoom.id)
          ) {
            return { ...room, unreadCount: room.unreadCount + 1 };
          }
          return room;
        })
      );
    };

    on("chatMessage", handleChatMessage);

    return () => {
      off("chatMessage", handleChatMessage);
    };
  }, [isConnected, currentRoom, on, off]);

  const handleRoomSelect = (room: ChatRoom) => {
    if (currentRoom) {
      leaveRoom(currentRoom.id);
    }

    setCurrentRoom(room);

    if (isConnected) {
      joinRoom(room.id);
    }

    // Mark room as read (reset unread count)
    setRooms((prev) =>
      prev.map((r) => (r.id === room.id ? { ...r, unreadCount: 0 } : r))
    );
  };

  const handleSendMessage = (content: string, attachments?: File[]) => {
    if (!currentRoom || !session?.user) return;

    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      content,
      senderId: session.user.id,
      senderName: session.user.name || "Jij",
      timestamp: new Date().toISOString(),
      type: attachments && attachments.length > 0 ? "file" : "text",
      attachments: attachments?.map((file) => ({
        name: file.name,
        size: file.size,
        type: file.type,
      })),
    };

    // Add message locally for immediate feedback
    setMessages((prev) => [...prev, newMessage]);

    // Update room's last message
    setRooms((prev) =>
      prev.map((room) =>
        room.id === currentRoom.id ? { ...room, lastMessage: newMessage } : room
      )
    );

    // Send via WebSocket for real-time delivery to others
    // Note: The local message won't be duplicated as our server will only broadcast to other users
  };

  const filteredRooms = rooms.filter((room) =>
    room.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoomIcon = (room: ChatRoom) => {
    switch (room.type) {
      case "project":
        return <HashtagIcon className="h-5 w-5" />;
      case "group":
      case "general":
        return <UserGroupIcon className="h-5 w-5" />;
      case "direct":
        return (
          <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full" />
          </div>
        );
      default:
        return <ChatBubbleLeftRightIcon className="h-5 w-5" />;
    }
  };

  const getTotalUnreadCount = () => {
    return rooms.reduce((total, room) => total + room.unreadCount, 0);
  };

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Team Chat" },
        ]}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Team Chat
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Real-time communicatie met je team
            {!isConnected && (
              <span className="ml-2 text-orange-500">
                (Offline - berichten worden gesynchroniseerd bij verbinding)
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400">
            <div
              className={`w-2 h-2 rounded-full ${
                isConnected ? "bg-green-500" : "bg-red-500"
              }`}
            />
            <span>{isConnected ? "Verbonden" : "Offline"}</span>
          </div>

          {getTotalUnreadCount() > 0 && (
            <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
              {getTotalUnreadCount()} ongelezen
            </div>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 h-[calc(100vh-250px)]">
        <div className="flex h-full">
          {/* Sidebar - Chat Rooms */}
          <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 flex flex-col">
            {/* Search */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Zoek gesprekken..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            {/* New Chat Button */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <Button
                variant="primary"
                size="sm"
                leftIcon={<PlusIcon className="h-4 w-4" />}
                className="w-full"
              >
                Nieuw gesprek
              </Button>
            </div>

            {/* Room List */}
            <div className="flex-1 overflow-y-auto">
              {filteredRooms.map((room) => (
                <motion.div
                  key={room.id}
                  whileHover={{ backgroundColor: "rgba(59, 130, 246, 0.05)" }}
                  onClick={() => handleRoomSelect(room)}
                  className={`p-4 cursor-pointer border-b border-gray-100 dark:border-gray-700 ${
                    currentRoom?.id === room.id
                      ? "bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500"
                      : ""
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="text-gray-500 dark:text-gray-400">
                      {getRoomIcon(room)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {room.name}
                        </p>
                        {room.unreadCount > 0 && (
                          <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                            {room.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {room.type === "direct"
                          ? room.participants[0]?.status || "Offline"
                          : room.description ||
                            `${room.participants.length} leden`}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Main Chat Area */}
          <div className="flex-1">
            <ChatInterface
              currentUserId={session?.user?.id || ""}
              currentRoom={currentRoom}
              messages={messages}
              onSendMessage={handleSendMessage}
              loading={loading}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
