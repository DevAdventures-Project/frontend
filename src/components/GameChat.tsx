"use client";

import { WebSocketContext } from "@/contexts/WebSocketContext";
import { createQuestMessage } from "@/lib/api/createQuestMessage";
import { getChatRooms } from "@/lib/api/getChatRooms";
import { getQuestsChat } from "@/lib/api/getQuestsChat";
import type { Message, QuestMessage } from "@/models/Message";
import type { UserChat } from "@/models/User";
import { ChevronLeft, ChevronRight, Send } from "lucide-react";
import type React from "react";
import { useCallback, useContext, useEffect, useRef, useState } from "react";

interface GameChatProps {
  isVisible: boolean;
  currentUser: UserChat;
}

export default function GameChat({ isVisible, currentUser }: GameChatProps) {
  const [messages, setMessages] = useState<Record<number, Message[]>>({});
  const [messageInput, setMessageInput] = useState("");
  const [currentRoomId, setCurrentRoomId] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [availableRooms, setAvailableRooms] = useState<
    { id: number; name: string }[]
  >([]);
  const wsClient = useContext(WebSocketContext);

  const handleRoomChange = (roomId: number) => {
    setCurrentRoomId(roomId);
  };

  useEffect(() => {
    getQuestsChat().then((data) => {
      setMessages(data);
    });
    getChatRooms(localStorage?.getItem("accessToken") || "").then((data) => {
      setAvailableRooms(data);

      data.forEach((room) => {
        if (room.id !== 0) {
          wsClient.emit("joinQuestRoom", {
            questId: room.id,
            user: currentUser,
          });
        }
      });
    });

    // Cleanup: Disconnect from all quest rooms
    return () => {
      availableRooms.forEach((room) => {
        if (room.id !== 0) {
          wsClient.emit("leaveQuestRoom", {
            questId: room.id,
            user: currentUser,
          });
        }
      });
    };
  }, [wsClient, currentUser, availableRooms]);

  useEffect(() => {
    const handleMessage = (data: string) => {
      const newMessage: Message = JSON.parse(data);

      if (newMessage.author.id === currentUser.id) return;

      setMessages((prevMessages) => ({
        ...prevMessages,
        0: [...(prevMessages[0] || []), newMessage],
      }));
    };

    wsClient.on("message", handleMessage);

    return () => {
      wsClient.off("message", handleMessage);
    };
  }, [wsClient, currentUser.id]);

  useEffect(() => {
    const handleQuestMessage = (data: QuestMessage) => {
      if (data.author.id === currentUser.id) return;

      setMessages((prevMessages) => ({
        ...prevMessages,
        [data.quest.id]: [...(prevMessages[data.quest.id] || []), data],
      }));

      if (data.quest.id !== 0) {
        createQuestMessage(data.content, data.author.id, data.quest.id);
      }
    };

    wsClient.on("questMessage", handleQuestMessage);

    return () => {
      wsClient.off("questMessage", handleQuestMessage);
    };
  }, [wsClient, currentUser.id]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (messageInput.trim()) {
      if (currentRoomId === 0) {
        const newMessage: Message = {
          content: messageInput,
          author: currentUser,
          createdAt: new Date().toISOString(),
        };

        setMessages((prevMessages) => ({
          ...prevMessages,
          0: [...(prevMessages[0] || []), newMessage],
        }));

        wsClient.emit("message", JSON.stringify(newMessage));
      } else {
        const newMessage: QuestMessage = {
          content: messageInput,
          author: currentUser,
          createdAt: new Date().toISOString(),
          quest: {
            id: currentRoomId,
            title:
              availableRooms.find((room) => room.id === currentRoomId)?.name ||
              "",
          },
        };

        setMessages((prevMessages) => ({
          ...prevMessages,
          [currentRoomId]: [...(prevMessages[currentRoomId] || []), newMessage],
        }));

        wsClient.emit("sendQuestMessage", {
          questId: currentRoomId,
          message: newMessage,
        });
      }

      setMessageInput("");
    }
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDragging && chatRef.current) {
        const newX = e.clientX - dragStart.x;
        const newY = e.clientY - dragStart.y;
        setPosition({ x: newX, y: newY });
      }
    },
    [isDragging, dragStart.x, dragStart.y],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  if (!isVisible) return null;

  return (
    <div
      ref={chatRef}
      className="z-[1000] flex bg-black/80 border border-gray-700 rounded-md shadow-lg overflow-hidden"
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        cursor: isDragging ? "grabbing" : "auto",
        width: isSidebarOpen ? "30rem" : "20rem",
        height: "24rem",
      }}
    >
      {/* Sidebar */}
      {isSidebarOpen && (
        <div
          className="w-[160px] bg-gray-900 border-r border-gray-700 flex flex-col"
          style={{
            height: "24rem",
          }}
        >
          <div className="p-2 bg-gray-800 text-white text-xs font-bold text-center">
            CANAUX
          </div>
          <button
            type="button"
            onClick={() => handleRoomChange(0)}
            className={`w-full text-left px-3 py-2 text-sm relative ${
              currentRoomId === 0
                ? "bg-gray-700 text-white"
                : "text-gray-300 hover:bg-gray-800"
            }`}
          >
            Général
          </button>
          <div className="p-2 bg-gray-800 text-white text-xs font-bold text-center">
            QUÊTES
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700">
            {availableRooms
              .filter((room) => room.id !== 0)
              .map((room) => (
                <button
                  type="button"
                  key={room.id}
                  onClick={() => handleRoomChange(room.id)}
                  className={`w-full text-left px-3 py-2 text-sm relative ${
                    currentRoomId === room.id
                      ? "bg-gray-700 text-white"
                      : "text-gray-300 hover:bg-gray-800"
                  }`}
                >
                  <div className="truncate">{room.name}</div>
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {/* Chat header - draggable area */}
        <div
          className="bg-gray-800 px-4 py-2 flex justify-between items-center"
          onMouseDown={handleMouseDown}
          style={{ cursor: isDragging ? "grabbing" : "grab" }}
        >
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="mr-2 text-gray-400 hover:text-white"
            >
              {isSidebarOpen ? (
                <ChevronLeft size={16} />
              ) : (
                <ChevronRight size={16} />
              )}
            </button>
            <h3 className="text-white font-bold truncate max-w-[10rem]">
              {availableRooms.find((room) => room.id === currentRoomId)?.name}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-xs text-gray-400">
              {messages[currentRoomId]?.length || "0"} message
              {messages[currentRoomId]?.length < 1 && "s"}
            </div>
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin scrollbar-thumb-gray-700">
          {messages[currentRoomId]?.map((message: Message) => (
            <div
              key={message.createdAt}
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
            placeholder={`Envoyer un message à ${
              availableRooms.find((room) => room.id === currentRoomId)?.name
            }`}
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
    </div>
  );
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
