import { getRankings } from "@/lib/api/leaderboard/getAllUsers";
import type { UserLeaderBoard } from "@/models/UserLeaderBoard";
import { useEffect, useRef, useState } from "react";
import LeaderBoardModal from "./ui/LeaderBoardModal";
import LeaderboardButton from "./ui/LeaderboardToggle";

export default function LeaderBoard() {
  const [leaderBoardVisible, setLeaderBoardVisible] = useState(false);
  const [users, setUsers] = useState<UserLeaderBoard[]>([]);

  const toggleLeaderBoardVisible = () => {
    setLeaderBoardVisible(!leaderBoardVisible);
  };

  useEffect(() => {
    async function fetchRankings() {
      const users = await getRankings();
      setUsers(users);
    }
    fetchRankings();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (leaderBoardVisible) {
        setLeaderBoardVisible(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [leaderBoardVisible]);

  return (
    <div className="w-full h-full">
      {leaderBoardVisible && (
        <div className="fixed bottom-70 right 100 z-50">
          <LeaderBoardModal users={users} />
        </div>
      )}

      <LeaderboardButton
        onClick={toggleLeaderBoardVisible}
        className="fixed bottom-4 right-4 z-50"
        label="Leaderboard"
      />
    </div>
  );
}
