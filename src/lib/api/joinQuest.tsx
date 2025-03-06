"use server";

import type { Quest } from "@/models/Quest";

export async function joinQuest(
  questId: number,
  token: string,
): Promise<boolean> {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const response = await fetch(`${API_URL}/quests/${questId}/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Error joining quest");
  }

  return true;
}
