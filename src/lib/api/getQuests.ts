"use server";

import type { Quest } from "@/models/Quest";

export async function getQuests(): Promise<Quest[]> {
  const API_URL = process.env.API_URL;

  const response = await fetch(`${API_URL}/quests`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (response.ok) {
    let data = await response.json();

    for (const quest of data) {
      quest.deadline = new Date(quest.deadline);
      quest.createdAt = new Date(quest.createdAt);
      quest.deadline = new Date(quest.deadline);
    }

    const today = new Date();
    data.sort((a: Quest, b: Quest) => {
      return a.deadline.getTime() - b.deadline.getTime();
    });

    data = data.filter((quest: Quest) => {
      return quest.deadline.getTime() > today.getTime();
    });

    return data;
  }
  console.error("Error fetching quests", response);
  return [];
}
