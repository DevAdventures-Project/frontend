"use client";

import type React from "react";

import type { Message } from "@/models/Message";
import type { UserChat } from "@/models/User";
import { Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface GameChatProps {
  isVisible: boolean;
  currentUser: UserChat;
  room: string;
  onSendMessage: (content: string) => void;
  messages: Message[];
}

export default function GameChat({
  isVisible,
  currentUser,
  room,
  onSendMessage,
  messages,
}: GameChatProps) {
  const [messageInput, setMessageInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Scroll to bottom when new messages arrive
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (messageInput.trim()) {
      onSendMessage(messageInput);
      setMessageInput("");
    }
  };

  // Custom drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging && chatRef.current) {
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;

      // Optional: Add bounds checking here if needed
      setPosition({ x: newX, y: newY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Set up and clean up event listeners
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragStart]);

  if (!isVisible) return null;

  return (
    <div
      ref={chatRef}
      className="z-[1000] w-80 h-96 bg-black/80 border border-gray-700 rounded-md shadow-lg flex flex-col overflow-hidden"
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        cursor: isDragging ? "grabbing" : "auto",
      }}
    >
      {/* Chat header - draggable area */}
      <div
        className="bg-gray-800 px-4 py-2 cursor-grab flex justify-between items-center"
        onMouseDown={handleMouseDown}
        style={{ cursor: isDragging ? "grabbing" : "grab" }}
      >
        <h3 className="text-white font-bold">{room} Chat</h3>
        <div className="text-xs text-gray-400">{messages.length} messages</div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin scrollbar-thumb-gray-700">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex flex-col ${message.author.id === currentUser.id ? "items-end" : "items-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-md px-3 py-2 ${
                message.author.id === currentUser.id
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-white"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs">
                  {message.author.pseudo}
                </span>
                <span className="text-xs opacity-70">
                  {formatTime(message.createdAt)}
                </span>
              </div>
              <p className="mt-1 text-sm break-words">{message.content}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <form
        onSubmit={handleSendMessage}
        className="p-2 bg-gray-900 flex items-center gap-2"
      >
        <input
          type="text"
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 bg-gray-800 text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-md"
          disabled={!messageInput.trim()}
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}

// Helper function to format time from ISO string
function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
