import type { QuestCreate } from "@/models/QuestCreate";

export async function createQuest(questData: QuestCreate) {
  const apiUrl: string = process.env.NEXT_PUBLIC_API_URL || "";

  try {
    const response = await fetch(`${apiUrl}/quests`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(questData),
    });

    if (!response.ok) {
      throw new Error("Failed to create quest");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error creating quest:", error);
    throw error;
  }
}
