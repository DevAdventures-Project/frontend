"use client";

import { WebSocketContext } from "@/contexts/WebSocketContext";
import type { Message } from "@/models/Message";
import { useContext, useState } from "react";
import GameChat from "./GameChat";
import ChatToggleButton from "./ui/ChatToggle";
import type { UserChat } from "@/models/User";

interface ChatLayoutProps {
  user: { id: number | null; pseudo: string };
}

const initialMessages = {
  0: [
    {
      author: { id: 1, pseudo: "Player2" },
      content: "Hello everyone!",
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      author: { id: 2, pseudo: "Player1" },
      content: "Hi there! How's the game going?",
      createdAt: new Date(Date.now() - 1800000).toISOString(),
    },
  ],
  1: [
    {
      author: { id: 3, pseudo: "Player3" },
      content: "Let's coordinate our next move",
      createdAt: new Date(Date.now() - 900000).toISOString(),
    },
  ],
  2: [
    {
      author: { id: 4, pseudo: "Player4" },
      content: "How do I upgrade my character?",
      createdAt: new Date(Date.now() - 600000).toISOString(),
    },
    {
      author: { id: 5, pseudo: "Player5" },
      content: "You need to collect 100 coins first",
      createdAt: new Date(Date.now() - 300000).toISOString(),
    },
    {
      author: { id: 6, pseudo: "Player6" },
      content: "And then visit the shop in the main town",
      createdAt: new Date(Date.now() - 120000).toISOString(),
    },
  ],
  3: [],
  4: [],
  5: [],
  6: [],
  7: [],
};

export default function ChatLayout({ user }: ChatLayoutProps) {
  const [chatVisible, setChatVisible] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const wsClient = useContext(WebSocketContext);

  wsClient.on("message", (data: string) => {
    const newMessage: Message = JSON.parse(data);
    setMessages([...messages, newMessage]);
  });

  const handleSendMessage = (content: string) => {
    const newMessage: Message = {
      content,
      author: user as UserChat,
      createdAt: new Date().toISOString(),
    };
    wsClient.emit("message", JSON.stringify(newMessage));
  };

  const toggleChatVisibility = () => {
    setChatVisible(!chatVisible);
  };

  return (
    <div className="relative w-[1024px] h-[768px] overflow-hidden">
      <GameChat
        isVisible={chatVisible}
        currentUser={user as UserChat}
        onSendMessage={handleSendMessage}
        messages={initialMessages}
      />

      <ChatToggleButton
        isVisible={chatVisible}
        toggleVisibility={toggleChatVisibility}
      />
    </div>
  );
}
