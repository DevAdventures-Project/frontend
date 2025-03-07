"use server";

import type { Quest } from "@/models/Quest";

export async function getChatRooms(): Promise<{ id: number; name: string }[]> {
  const API_URL = process.env.API_URL;

  const response = await fetch(`${API_URL}/quests`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch quests");
  }

  const data: Quest[] = await response.json();

  const rooms = data.map((quest) => {
    return { id: quest.id, name: quest.title };
  });

  rooms.push({ id: 0, name: "Général" });

  return rooms;
}
