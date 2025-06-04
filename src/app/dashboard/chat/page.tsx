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
  ChatBubbleOvalLeftEllipsisIcon,
  UserIcon,
  CogIcon,
  BellIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import ChatInterface from "@/components/chat/ChatInterface";
import Button from "@/components/ui/Button";
import MetricCard from "@/components/ui/MetricCard";
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

  const handleNewMessage = (message: ChatMessage) => {
    // Handle new messages received from WebSocket or polling
    setMessages((prev) => {
      // Check if message already exists to prevent duplicates
      if (prev.some((msg) => msg.id === message.id)) {
        return prev;
      }
      return [...prev, message];
    });

    // Update room's last message and unread count if not current room
    setRooms((prev) =>
      prev.map((room) => {
        if (room.id === message.senderId && room.type === "direct") {
          // For direct messages, find room by sender
          return {
            ...room,
            lastMessage: message,
            unreadCount: currentRoom?.id === room.id ? 0 : room.unreadCount + 1,
          };
        } else if (room.id === currentRoom?.id) {
          // For current room, update last message but don't increment unread
          return { ...room, lastMessage: message };
        }
        return room;
      })
    );
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
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Team Chat" },
        ]}
        className="mb-4"
      />

      {/* Modern Header Card */}
      <div className="overflow-hidden bg-white border border-gray-200 shadow-sm dark:bg-gray-800 rounded-xl dark:border-gray-700">
        <div className="px-6 py-8 border-b border-gray-200 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 dark:border-gray-700">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <ChatBubbleOvalLeftEllipsisIcon className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Team Chat
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Real-time communicatie en samenwerking met je team
                </p>
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                  <span className="flex items-center space-x-1">
                    <div
                      className={`h-2 w-2 rounded-full ${
                        isConnected ? "bg-green-500" : "bg-red-500"
                      }`}
                    ></div>
                    <span>{isConnected ? "Online" : "Offline"}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span className="h-2 w-2 bg-blue-500 rounded-full"></span>
                    <span>{rooms.length} Gesprekken</span>
                  </span>
                  {getTotalUnreadCount() > 0 && (
                    <span className="flex items-center space-x-1">
                      <span className="h-2 w-2 bg-orange-500 rounded-full"></span>
                      <span>{getTotalUnreadCount()} Ongelezen</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                size="md"
                leftIcon={<CogIcon className="h-4 w-4" />}
                className="bg-white hover:bg-gray-50 border-gray-300 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:border-gray-600 dark:text-gray-300"
              >
                Instellingen
              </Button>
              <Button
                variant="primary"
                size="md"
                leftIcon={<PlusIcon className="h-4 w-4" />}
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
              >
                Nieuw Gesprek
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          title="Actieve Gesprekken"
          value={rooms.length}
          icon={<ChatBubbleLeftRightIcon className="w-8 h-8" />}
          color="blue"
          subtitle="Totaal beschikbaar"
          trend={{
            value: 15,
            isPositive: true,
            label: "deze week",
          }}
        />

        <MetricCard
          title="Ongelezen Berichten"
          value={getTotalUnreadCount()}
          icon={<BellIcon className="w-8 h-8" />}
          color="orange"
          subtitle="Wachten op jou"
          trend={
            getTotalUnreadCount() > 0
              ? {
                  value: getTotalUnreadCount(),
                  isPositive: false,
                  label: "nieuwe berichten",
                }
              : undefined
          }
        />

        <MetricCard
          title="Online Leden"
          value={rooms.reduce(
            (count, room) =>
              count +
              room.participants.filter((p) => p.status === "online").length,
            0
          )}
          icon={<UsersIcon className="w-8 h-8" />}
          color="green"
          subtitle="Nu beschikbaar"
          trend={{
            value: 8,
            isPositive: true,
            label: "actieve gebruikers",
          }}
        />

        <MetricCard
          title="Verbindingsstatus"
          value={isConnected ? "Online" : "Offline"}
          icon={<CheckCircleIcon className="w-8 h-8" />}
          color={isConnected ? "green" : "red"}
          subtitle="Real-time sync"
          status={isConnected ? "normal" : "warning"}
        />
      </div>

      {/* Modern Chat Interface */}
      <div className="overflow-hidden bg-white border border-gray-200 shadow-sm dark:bg-gray-800 rounded-xl dark:border-gray-700 h-[calc(100vh-420px)]">
        <div className="flex h-full">
          {/* Sidebar - Chat Rooms */}
          <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 flex flex-col">
            {/* Sidebar Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 dark:bg-gray-700/50 dark:border-gray-600">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <UserGroupIcon className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                Gesprekken
                {getTotalUnreadCount() > 0 && (
                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200">
                    {getTotalUnreadCount()}
                  </span>
                )}
              </h3>
            </div>

            {/* Search */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Zoek gesprekken..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white placeholder-gray-400 text-sm"
                />
              </div>
            </div>

            {/* New Chat Button */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <Button
                variant="primary"
                size="sm"
                leftIcon={<PlusIcon className="h-4 w-4" />}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
              >
                Nieuw gesprek
              </Button>
            </div>

            {/* Room List */}
            <div className="flex-1 overflow-y-auto">
              {filteredRooms.length === 0 ? (
                <div className="p-6 text-center">
                  <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                    Geen gesprekken gevonden
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Start een nieuw gesprek om te beginnen
                  </p>
                </div>
              ) : (
                filteredRooms.map((room) => (
                  <motion.div
                    key={room.id}
                    whileHover={{ backgroundColor: "rgba(59, 130, 246, 0.05)" }}
                    onClick={() => handleRoomSelect(room)}
                    className={`p-4 cursor-pointer border-b border-gray-100 dark:border-gray-700 transition-all duration-200 ${
                      currentRoom?.id === room.id
                        ? "bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500 shadow-sm"
                        : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`flex-shrink-0 ${
                          room.type === "direct" ? "relative" : ""
                        }`}
                      >
                        {room.type === "direct" ? (
                          <div className="relative">
                            <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-sm">
                              <span className="text-white font-bold text-sm">
                                {room.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div
                              className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${
                                room.participants[0]?.status === "online"
                                  ? "bg-green-500"
                                  : room.participants[0]?.status === "away"
                                  ? "bg-yellow-500"
                                  : room.participants[0]?.status === "busy"
                                  ? "bg-red-500"
                                  : "bg-gray-400"
                              }`}
                            />
                          </div>
                        ) : (
                          <div className="h-10 w-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-sm">
                            {getRoomIcon(room)}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                            {room.name}
                          </p>
                          {room.unreadCount > 0 && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500 text-white shadow-sm">
                              {room.unreadCount}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {room.type === "direct"
                              ? `${room.participants[0]?.status || "Offline"}`
                              : room.description ||
                                `${room.participants.length} leden`}
                          </p>
                          {room.lastMessage && (
                            <span className="text-xs text-gray-400 dark:text-gray-500">
                              {new Date(
                                room.lastMessage.timestamp
                              ).toLocaleTimeString("nl-NL", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          )}
                        </div>
                        {room.lastMessage && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 truncate mt-1">
                            <span className="font-medium">
                              {room.lastMessage.senderName}:
                            </span>{" "}
                            {room.lastMessage.content}
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
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
              onNewMessage={handleNewMessage}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
