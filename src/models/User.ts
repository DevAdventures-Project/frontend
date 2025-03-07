export interface UserChat {
  id: number;
  pseudo: string;
}

export interface User {
  id: number;
  pseudo: string;
  coins: number;
}

export interface UserProfile {
  id: number;
  pseudo: string;
  coins: number;
  inventory: Item[];
  questsHelped: Quests[];
}

interface Quests {
  id: number;
  title: string;
  minimumRank: string;
  status: string;
  createdAt: string;
}

interface Item {
  itemId: number;
}
