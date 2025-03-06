"use server";

import type { Quest } from "@/models/Quest";

export async function quitQuest(
  questId: number,
  token: string,
): Promise<boolean> {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const response = await fetch(`${API_URL}/quests/${questId}/unregister`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  console.log("response", response);

  if (!response.ok) {
    throw new Error("Error joining quest");
  }

  return true;
}
