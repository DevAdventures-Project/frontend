export interface QuestCreate {
  title: string;
  content: string;
  link: string;
  nbHelpers: number;
  category: string;
  status: string;
  minimumRank: string;
  authorId: number;
  deadline: string;
}
