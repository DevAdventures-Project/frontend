import type { UserChat } from "./User";

export interface Message {
  content: string;
  author: UserChat;
  createdAt: string;
}

export interface QuestMessage extends Message {
  id: number;
  quest: {
    id: number;
    title: string;
  };
}
