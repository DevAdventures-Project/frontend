"use client";

import type { UserChat } from "@/models/User";
import Image from "next/image";
import { useState } from "react";
import GameChat from "./GameChat";
import ChatToggleButton from "./ui/ChatToggle";

interface ChatLayoutProps {
  user: { id: number | null; pseudo: string };
  changeScene: (scene: string) => void;
}

export default function ChatLayout({ user, changeScene }: ChatLayoutProps) {
  const [chatVisible, setChatVisible] = useState(false);

  const toggleChatVisibility = () => {
    setChatVisible(!chatVisible);
  };

  return (
    <div className="relative w-[1024px] h-[768px] overflow-hidden">
      <GameChat isVisible={chatVisible} currentUser={user as UserChat} />

      <button
        onClick={() => changeScene("MarketplaceScene")}
        type="button"
        className="cursor-pointer w-24 h-24 flex justify-center items-center border-6 border-b-gray-900 rounded-2xl bg-orange-200 shadow-md"
      >
        <Image
          src="/assets/icons/market.png"
          alt="Icon"
          width={60}
          height={60}
          className="object-contain"
          priority
        />
      </button>

      <button
        onClick={() => changeScene("ProfileScene")}
        type="button"
        className="cursor-pointer w-24 h-24 flex justify-center items-center border-6 border-b-gray-900 rounded-2xl bg-orange-200 shadow-md"
      >
        <Image
          src="/assets/icons/profile.png"
          alt="Icon"
          width={60}
          height={60}
          className="object-contain"
        />
      </button>

      <ChatToggleButton
        isVisible={chatVisible}
        toggleVisibility={toggleChatVisibility}
      />
    </div>
  );
}
