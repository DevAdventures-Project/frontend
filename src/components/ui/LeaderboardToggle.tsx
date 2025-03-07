"use client";

import { Trophy } from "lucide-react";

interface LeaderboardButtonProps {
  onClick?: () => void;
  className?: string;
  label?: string;
}

export default function LeaderboardButton({
  onClick = () => console.log("Leaderboard clicked"),
  className = "",
  label = "Leaderboard",
}: LeaderboardButtonProps) {
  return (
    <button
      type="button"
      className={`
        flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-white
        bg-gradient-to-r from-blue-600 to-blue-400
        transition-all duration-300 ease-in-out
        hover:translate-y-[-2px] hover:shadow-lg
        active:translate-y-[1px] active:shadow-md
        focus:outline-none focus:ring-blue-400 focus:ring-opacity-50
        ${className}
      `}
      onClick={onClick}
      aria-label="View Leaderboard"
    >
      <Trophy className="w-5 h-5" />
      <span>{label}</span>
    </button>
  );
}
