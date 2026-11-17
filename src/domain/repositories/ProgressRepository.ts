import { Membership } from '@/domain/entities/Membership';

export interface RecordProgressInput {
  teamId: string;
  userId: string;
  displayName: string;
  page: number;
}

export interface ProgressRepository {
  observeMembers(teamId: string, listener: (members: Membership[]) => void): () => void;
  getMember(teamId: string, userId: string): Promise<Membership | null>;
  recordProgress(input: RecordProgressInput): Promise<void>;
  getReadingDates(teamId: string, userId: string): Promise<string[]>;
}
