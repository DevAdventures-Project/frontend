"use client";

import { WebSocketContext } from "@/contexts/WebSocketContext";
import type { Message } from "@/models/Message";
import type { UserChat } from "@/models/User";
import { useContext, useState } from "react";
import GameChat from "./GameChat";
import Marketplace from "./Marketpace";
import ChatToggleButton from "./ui/ChatToggle";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogTrigger } from "./ui/dialog";
import { Toaster } from "./ui/sonner";

interface ChatLayoutProps {
  user: { id: number | null; pseudo: string };
}

export default function ChatLayout({ user }: ChatLayoutProps) {
  const [chatVisible, setChatVisible] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isMarketplaceOpen, setIsMarketplaceOpen] = useState(false);
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
    <div className="rellative w-[1024px] h-[768px] overflow-hidden">
      <GameChat isVisible={chatVisible} currentUser={currentUser} />

      <ChatToggleButton
        isVisible={chatVisible}
        toggleVisibility={toggleChatVisibility}
      />

      <Dialog open={isMarketplaceOpen} onOpenChange={setIsMarketplaceOpen}>
        <DialogTrigger asChild>
          <Button className="pixel-button bg-pokemon-red hover:bg-pokemon-red-dark text-white text-lg px-6 py-3">
            Marché
          </Button>
        </DialogTrigger>
        <DialogContent className="m-auto">
          <Marketplace />
        </DialogContent>
      </Dialog>

      <Toaster />
    </div>
  );
}
