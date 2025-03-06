import { UserLeaderBoard } from "@/models/UserLeaderBoard";
import { Trophy } from "lucide-react";
import { forwardRef, RefObject } from "react";
import LeaderboardButton from "./LeaderboardToggle";
import LeaderBoard from '../LeaderBoard';

interface LeaderboardButtonProps {
  users: UserLeaderBoard[];
}

export default function LeaderBoardModal({ users }: LeaderboardButtonProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg w-full max-w-md mx-auto overflow-hidden">
      <div className="p-4 bg-gradient-to-r from-blue-600 to-blue-400 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6" />
            <h2 className="text-xl font-bold">Leaderboard</h2>
          </div>
        </div>
      </div>

      <div className="overflow-y-auto max-h-[400px]">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Position
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Pseudo
              </th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Coins
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {users.map((user : UserLeaderBoard) => (
              <tr
                key={user.id}
                className={`hover:bg-gray-50 dark:hover:bg-gray-800 ${
                  user.position <= 3 ? "bg-blue-50 dark:bg-blue-900/20" : ""
                }`}
              >
                <td className="px-4 py-3 whitespace-nowrap text-gray-900 dark:text-white font-medium">
                  {user.position}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="font-medium text-gray-900 dark:text-white">{user.pseudo}</div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right font-mono font-medium text-gray-900 dark:text-white">
                  {user.coins.toLocaleString()} Coin
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

