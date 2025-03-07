import type { UserChat } from "./User";

export interface Message {
  content: string;
  author: UserChat;
  createdAt: string;
}

export interface QuestMessage extends Message {
  quest: {
    id: number;
    title: string;
  };
}
