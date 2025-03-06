export interface Quest {
  id: number;
  title: string;
  content: string;
  link: string;
  nbHelpers: number;
  category: string;
  minimumRank: string;
  deadline: Date;
  createdAt: Date;
  author: {
    id: number;
    pseudo: string;
  };
  helpers: {
    id: number;
    pseudo: string;
  }[];
}
