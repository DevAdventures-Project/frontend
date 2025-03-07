const apiUrl = process.env.API_URL;

export const postBuyItem = async (itemId: number) => {
  const token = localStorage.getItem("accessToken") || "";
  const itemUrl = `${apiUrl}/marketplace/purchase`;

  const response = await fetch(itemUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ itemId, quantity: 1 }),
  });

  return await response;
};
