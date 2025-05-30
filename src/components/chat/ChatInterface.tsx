"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PaperAirplaneIcon,
  PaperClipIcon,
  FaceSmileIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import Button from "../ui/Button";
import { useWebSocket } from "@/lib/websocket";

export interface ChatMessage {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  timestamp: string;
  type: "text" | "image" | "file" | "system";
  attachments?: ChatAttachment[];
  reactions?: ChatReaction[];
  replyTo?: string;
  edited?: boolean;
  editedAt?: string;
}

export interface ChatAttachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
}

export interface ChatReaction {
  emoji: string;
  count: number;
  users: string[];
}

export interface ChatRoom {
  id: string;
  name: string;
  type: "direct" | "group" | "project" | "general";
  participants: any[];
  lastMessage?: ChatMessage;
  unreadCount: number;
  avatar?: string;
  description?: string;
  projectId?: string;
}

interface ChatInterfaceProps {
  currentUserId: string;
  currentRoom: ChatRoom | null;
  messages: ChatMessage[];
  onSendMessage: (content: string, attachments?: File[]) => void;
  onRoomChange?: (room: ChatRoom) => void;
  loading?: boolean;
  className?: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  currentUserId,
  currentRoom,
  messages,
  onSendMessage,
  loading = false,
  className = "",
}) => {
  const [messageInput, setMessageInput] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isConnected, sendChatMessage } = useWebSocket();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle typing indicator
  useEffect(() => {
    if (messageInput && !isTyping) {
      setIsTyping(true);
      // Send typing start event
    }

    const timer = setTimeout(() => {
      setIsTyping(false);
      // Send typing stop event
    }, 2000);

    return () => clearTimeout(timer);
  }, [messageInput, isTyping]);

  const handleSendMessage = () => {
    if (!messageInput.trim() && attachments.length === 0) return;
    if (!currentRoom) return;

    // Call the parent handler for local state update
    onSendMessage(messageInput.trim(), attachments);

    // Send via WebSocket for real-time delivery
    if (isConnected && currentRoom) {
      sendChatMessage(currentRoom.id, messageInput.trim(), attachments);
    }

    setMessageInput("");
    setAttachments([]);
    setReplyingTo(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments((prev) => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString("nl-NL", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  if (!currentRoom) {
    return (
      <div
        className={`flex items-center justify-center h-full bg-gray-50 dark:bg-gray-900 ${className}`}
      >
        <div className="text-center">
          <div className="text-6xl mb-4">💬</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Welkom bij Team Chat
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Selecteer een gesprek om te beginnen met chatten
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Chat Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-medium">
                  {currentRoom.name.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {currentRoom.name}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {currentRoom.type === "direct"
                  ? "Direct bericht"
                  : `${currentRoom.participants.length} leden`}
                {!isConnected && (
                  <span className="ml-2 text-orange-500 text-xs">
                    • Offline
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
        {loading && (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          </div>
        )}

        {messages.length === 0 && !loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-4xl mb-2">💭</div>
              <p className="text-gray-500 dark:text-gray-400">
                Nog geen berichten in dit gesprek
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                Start de conversatie met een bericht!
              </p>
            </div>
          </div>
        ) : (
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`flex ${
                  message.senderId === currentUserId
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.senderId === currentUserId
                      ? "bg-blue-500 text-white"
                      : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700"
                  }`}
                >
                  {message.senderId !== currentUserId && (
                    <p className="text-xs font-medium mb-1 text-gray-500 dark:text-gray-400">
                      {message.senderName}
                    </p>
                  )}
                  <p className="text-sm whitespace-pre-wrap">
                    {message.content}
                  </p>

                  {/* Show attachments if any */}
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {message.attachments.map((attachment, index) => (
                        <div
                          key={index}
                          className="flex items-center space-x-2 text-xs opacity-75"
                        >
                          <PaperClipIcon className="h-3 w-3" />
                          <span>{attachment.name}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <p
                    className={`text-xs mt-1 ${
                      message.senderId === currentUserId
                        ? "text-blue-100"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    {formatTime(message.timestamp)}
                    {message.edited && <span className="ml-1">(bewerkt)</span>}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Reply Banner */}
      {replyingTo && (
        <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs text-blue-600 dark:text-blue-400">
                Antwoorden op {replyingTo.senderName}
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300 truncate">
                {replyingTo.content}
              </p>
            </div>
            <button
              onClick={() => setReplyingTo(null)}
              className="ml-2 text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-2">
            {attachments.map((file, index) => (
              <div
                key={index}
                className="flex items-center space-x-2 bg-white dark:bg-gray-700 px-3 py-1 rounded-lg border border-gray-200 dark:border-gray-600"
              >
                <span className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-32">
                  {file.name}
                </span>
                <button
                  onClick={() => removeAttachment(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Message Input */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
        <div className="flex items-end space-x-2">
          <div className="flex-1">
            <textarea
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={`Bericht naar ${currentRoom.name}...`}
              rows={1}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* File Input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            title="Bestand toevoegen"
          >
            <PaperClipIcon className="h-5 w-5" />
          </button>

          <button
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            title="Emoji toevoegen"
          >
            <FaceSmileIcon className="h-5 w-5" />
          </button>

          <Button
            onClick={handleSendMessage}
            disabled={
              (!messageInput.trim() && attachments.length === 0) || loading
            }
            variant="primary"
            size="sm"
            leftIcon={<PaperAirplaneIcon className="h-4 w-4" />}
          >
            {isConnected ? "Verzend" : "Opslaan"}
          </Button>
        </div>

        {/* Connection status info */}
        {!isConnected && (
          <p className="text-xs text-orange-500 mt-2">
            Offline - berichten worden verzonden wanneer de verbinding is
            hersteld
          </p>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;
