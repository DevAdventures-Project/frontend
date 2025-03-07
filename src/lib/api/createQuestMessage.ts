export async function createQuestMessage(
  content: string,
  userId: number,
  questId: number,
): Promise<{
  id: number;
  content: string;
  authorId: number;
  questId: number;
  createdAt: string;
}> {
  const apiUrl = process.env.API_URL;

  try {
    const response = await fetch(`${apiUrl}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content, authorId: userId, questId }),
    });

    if (!response.ok) {
      throw new Error("Failed to create quest");
    }

    const data = (await response.json()) as {
      id: number;
      content: string;
      authorId: number;
      questId: number;
      createdAt: string;
    };

    return data;
  } catch (error) {
    console.error("Error creating quest:", error);
    throw error;
  }
}
