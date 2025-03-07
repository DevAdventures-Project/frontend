"use client";

import { WebSocketContext } from "@/contexts/WebSocketContext";
import type { Message } from "@/models/Message";
import type { UserChat } from "@/models/User";
import { useContext, useState } from "react";
import GameChat from "./GameChat";
import ChatToggleButton from "./ui/ChatToggle";

export type ChatLayoutProps = {
  room: string;
};

export default function ChatLayout({ room }: ChatLayoutProps) {
  const [chatVisible, setChatVisible] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const wsClient = useContext(WebSocketContext);
  const currentUser: UserChat = {
    id: 1,
    pseudo: "Player1",
  };

  wsClient.on("message", (data: string) => {
    const newMessage: Message = JSON.parse(data);
    setMessages([...messages, newMessage]);
  });

  const handleSendMessage = (content: string) => {
    const newMessage: Message = {
      content,
      author: currentUser,
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
        currentUser={currentUser}
        room={room}
        onSendMessage={handleSendMessage}
        messages={messages}
      />

      <ChatToggleButton
        isVisible={chatVisible}
        toggleVisibility={toggleChatVisibility}
      />
    </div>
  );
}
