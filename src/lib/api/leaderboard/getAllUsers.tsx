"use server";

import type { UserLeaderBoard } from "@/models/UserLeaderBoard";

export async function getRankings(): Promise<UserLeaderBoard[]> {
  const API_URL = process.env.API_URL;

  const response = await fetch(`${API_URL}/users/ranking`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Error fetching rankins");
  }

  const data: UserLeaderBoard[] = await response.json();

  for (let i = 0; i < data.length; i++) {
    data[i].position = i + 1;
  }

  return data;
}
