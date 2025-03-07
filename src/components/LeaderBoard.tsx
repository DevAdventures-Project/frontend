import { getRankings } from "@/lib/api/leaderboard/getAllUsers";
import type { UserLeaderBoard } from "@/models/UserLeaderBoard";
import { useEffect, useRef, useState } from "react";
import LeaderBoardModal from "./ui/LeaderBoardModal";
import LeaderboardButton from "./ui/LeaderboardToggle";

export default function LeaderBoard() {
  const [leaderBoardVisible, setLeaderBoardVisible] = useState(false);
  const [users, setUsers] = useState<UserLeaderBoard[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 300, y: -200 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const leaderboardRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);

  const toggleLeaderBoardVisible = (status: boolean) => {
    setLeaderBoardVisible(status);
  };

  useEffect(() => {
    async function fetchRankings() {
      try {
        const users = await getRankings();
        setUsers(users);
      } catch (e) {
        console.log(e);
      }
    }
    fetchRankings();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isDragging) return;

      if (
        leaderBoardVisible &&
        leaderboardRef.current &&
        !leaderboardRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setLeaderBoardVisible(false);
      }
    };

    const timeoutId = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 10);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [leaderBoardVisible, isDragging]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging && leaderboardRef.current) {
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;

      setPosition({ x: newX, y: newY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: handleMouseMove and handleMouseUp re render every frame
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

  return (
    <div className="w-full h-full">
      {leaderBoardVisible && (
        <div
          ref={leaderboardRef}
          className="fixed z-50"
          style={{
            transform: `translate(${position.x}px, ${position.y}px)`,
            bottom: "70px",
            right: "100px",
          }}
        >
          <div
            onMouseDown={handleMouseDown}
            style={{ cursor: isDragging ? "grabbing" : "grab" }}
          >
            <LeaderBoardModal users={users} />
          </div>
        </div>
      )}

      <div ref={buttonRef}>
        <LeaderboardButton
          onClick={() => toggleLeaderBoardVisible(!leaderBoardVisible)}
          className="fixed bottom-4 right-4 z-50"
          label="Leaderboard"
        />
      </div>
    </div>
  );
}
