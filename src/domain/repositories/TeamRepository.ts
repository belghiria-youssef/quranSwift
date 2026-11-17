import { ReadingSystem, Team } from '@/domain/entities/Team';

export interface CreateTeamInput {
  name: string;
  ownerId: string;
  ownerName: string;
  readingSystem: ReadingSystem;
}

export interface JoinTeamInput {
  code: string;
  userId: string;
  displayName: string;
}

export interface TeamRepository {
  createTeam(input: CreateTeamInput): Promise<Team>;
  joinByCode(input: JoinTeamInput): Promise<Team>;
  deleteTeam(teamId: string, userId: string): Promise<void>;
  renameTeam(teamId: string, userId: string, name: string): Promise<void>;
  updateMemberName(userId: string, displayName: string): Promise<void>;
  observeMyTeams(userId: string, listener: (teams: Team[]) => void): () => void;
}
