"use client";

import { MessageSquare } from "lucide-react";

interface ChatToggleButtonProps {
  isVisible: boolean;
  toggleVisibility: () => void;
}

export default function ChatToggleButton({
  isVisible,
  toggleVisibility,
}: ChatToggleButtonProps) {
  return (
    <button
      type="button"
      onClick={toggleVisibility}
      className={`fixed bottom-4 left-4 p-3 rounded-full shadow-lg transition-all ${
        isVisible
          ? "bg-red-600 hover:bg-red-700"
          : "bg-blue-600 hover:bg-blue-700"
      }`}
      aria-label={isVisible ? "Hide chat" : "Show chat"}
    >
      <MessageSquare className="text-white" size={20} />
    </button>
  );
}
