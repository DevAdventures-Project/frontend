"use server";

import type { Quest } from "@/models/Quest";

export async function getQuests(): Promise<Quest[]> {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const response = await fetch(`${API_URL}/quests`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (response.ok) {
    const data = await response.json();

    for (const quest of data) {
      quest.deadline = new Date(quest.deadline);
      quest.createdAt = new Date(quest.createdAt);
      quest.deadline = new Date(quest.deadline);
    }

    return data;
  }
  console.error("Error fetching quests", response);
  return [];
}
