"use server";

export async function joinQuest(questId: number): Promise<boolean> {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  // TODO: utiliser le bon userId stocker dans les cookies plus tard
  const userId = 2;

  const response = await fetch(
    `${API_URL}/quests/${questId}/register/${userId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new Error("Error joining quest");
  }
  return true;
}
