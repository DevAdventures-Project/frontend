"use server";

import type { Quest } from "@/models/Quest";

export async function deleteQuest(questId: number): Promise<boolean> {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const response = await fetch(`${API_URL}/quests/${questId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Error deleting quest");
  }

  return true;
}
