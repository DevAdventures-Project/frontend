"use server";

import type { Quest } from "@/models/Quest";

export async function getQuests(userId: number): Promise<Quest[]> {
  const API_URL = "https://hackaton.jayllyz.fr";

  const response = await fetch(`${API_URL}/chat`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  return [];
}
