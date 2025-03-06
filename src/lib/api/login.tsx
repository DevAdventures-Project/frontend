"use server";

export async function login(
  email: string,
  password: string,
): Promise<{ id: number; pseudo: string; accessToken: string }> {
  const API_URL = process.env.API_URL;

  const responseLogin = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!responseLogin.ok) {
    throw new Error("Failed to login");
  }
  const dataToken = (await responseLogin.json()) as { accessToken: string };

  const responseProfile = await fetch(`${API_URL}/users/profile`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${dataToken.accessToken}`,
    },
  });

  if (!responseProfile.ok) {
    throw new Error("Failed to login");
  }

  const dataProfile = (await responseProfile.json()) as {
    id: number;
    pseudo: string;
  };

  return {
    id: dataProfile.id,
    pseudo: dataProfile.pseudo,
    accessToken: dataToken.accessToken,
  };
}
