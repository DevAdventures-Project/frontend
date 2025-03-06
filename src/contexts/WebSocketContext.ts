import { createContext } from "react";
import { io } from "socket.io-client";

export const socket = io("https://hackaton.jayllyz.fr/", {
  transports: ["websocket"],
  autoConnect: true,
});
export const WebSocketContext = createContext(socket);
