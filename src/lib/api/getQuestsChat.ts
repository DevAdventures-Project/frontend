"use server";

import type { Message, QuestMessage } from "@/models/Message";

export async function getQuestsChat(): Promise<Record<number, Message[]>> {
  const API_URL = "https://hackaton.jayllyz.fr";

  const response = await fetch(`${API_URL}/chat`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch quests");
  }

  const data: QuestMessage[] = await response.json();

  const messages: Record<number, Message[]> = {};

  data.forEach((questMessage) => {
    const { quest, ...message } = questMessage;
    if (!messages[quest.id]) {
      messages[quest.id] = [];
    }
    messages[quest.id].push(message);
  });

  return messages;
}
