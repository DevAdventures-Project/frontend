"use client";

import type { UserChat } from "@/models/User";
import { useState } from "react";
import GameChat from "./GameChat";
import ChatToggleButton from "./ui/ChatToggle";

interface ChatLayoutProps {
  user: { id: number | null; pseudo: string };
}

export default function ChatLayout({ user }: ChatLayoutProps) {
  const [chatVisible, setChatVisible] = useState(false);

  const toggleChatVisibility = () => {
    setChatVisible(!chatVisible);
  };

  return (
    <div className="relative w-[1024px] h-[768px] overflow-hidden">
      <GameChat isVisible={chatVisible} currentUser={user as UserChat} />

      <ChatToggleButton
        isVisible={chatVisible}
        toggleVisibility={toggleChatVisibility}
      />
    </div>
  );
}
