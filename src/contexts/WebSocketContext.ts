import { createContext } from "react";
import { io } from "socket.io-client";

export const socket = io(process.env.NEXT_PUBLIC_API_URL, {
  transports: ["websocket"],
  autoConnect: true,
});
export const WebSocketContext = createContext(socket);
