"use client";

import Login from "@/components/Login";

export default function LoginLayout() {
  if (localStorage.getItem("accessToken")) {
    return <Login loggedIn={true} />;
  }
  return <Login loggedIn={false} />;
}
