import type { UserProfile } from "@/models/User";

const apiUrl = process.env.API_URL;

export const fetchUser = async () => {
  const token = localStorage.getItem("accessToken") || "";
  const userUrl = `${apiUrl}/users/profile`;

  const response = await fetch(userUrl, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  return await response.json();
};

export const fetchUserProfile = async (): Promise<UserProfile> => {
  const token = localStorage.getItem("accessToken") || "";
  const userUrl = `${apiUrl}/users/profile`;

  const response = await fetch(userUrl, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  return await response.json();
};
