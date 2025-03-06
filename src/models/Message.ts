import type { UserChat } from "./User";

export interface Message {
  content: string;
  author: UserChat;
  createdAt: string;
}
