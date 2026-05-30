export type Mood = 1 | 2 | 3 | 4 | 5;

export interface Entry {
  id: string;
  date: string;
  title?: string;
  body: string;
  mood: Mood;
  createdAt: string;
  updatedAt: string;
}
