"use server";

import type { Quest } from "@/models/Quest";

export async function getChatRooms(
  token: string,
): Promise<{ id: number; name: string }[]> {
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

  const responseProfile = await fetch(`${API_URL}/users/profile`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!responseProfile.ok) {
    throw new Error("Failed to fetch user profile");
  }

  const profile = (await responseProfile.json()) as {
    questsCreated: Quest[];
    questsHelped: Quest[];
  };

  let rooms = data.map((quest) => {
    return { id: quest.id, name: quest.title };
  });

  rooms = rooms.filter((room) => {
    return (
      profile.questsCreated.some((quest) => quest.id === room.id) ||
      profile.questsHelped.some((quest) => quest.id === room.id)
    );
  });

  rooms.push({ id: 0, name: "Général" });

  return rooms;
}
