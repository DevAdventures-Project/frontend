import type { UserChat } from "./User";

export interface Message {
  id: number;
  content: string;
  author: UserChat;
  room: string;
  createdAt: string;
}
