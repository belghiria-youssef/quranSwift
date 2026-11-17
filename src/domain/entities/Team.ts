export type ReadingSystem = 'hizb' | 'juz' | 'surah' | 'free';

export interface Team {
  id: string;
  name: string;
  inviteCode: string;
  creatorId: string;
  members: string[];
  readingSystem: ReadingSystem;
}
