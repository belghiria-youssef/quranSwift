import { useCallback, useEffect, useState } from 'react';

import { firestoreTeamRepository } from '@/data/repositories/FirestoreTeamRepository';
import { ReadingSystem, Team } from '@/domain/entities/Team';
import { useAuth } from '@/presentation/hooks/useAuth';

interface UseTeamsResult {
  teams: Team[];
  loading: boolean;
  createTeam: (name: string, readingSystem: ReadingSystem) => Promise<Team>;
  joinByCode: (code: string) => Promise<Team>;
  deleteTeam: (teamId: string) => Promise<void>;
  renameTeam: (teamId: string, name: string) => Promise<void>;
}

export function useTeams(): UseTeamsResult {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setTeams([]);
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    return firestoreTeamRepository.observeMyTeams(user.uid, (nextTeams) => {
      setTeams(nextTeams);
      setLoading(false);
    });
  }, [user]);

  const createTeam = useCallback(
    async (name: string, readingSystem: ReadingSystem) => {
      if (!user) {
        throw new Error('يجب تسجيل الدخول أولًا');
      }
      return firestoreTeamRepository.createTeam({
        name: name.trim(),
        ownerId: user.uid,
        ownerName: user.displayName,
        readingSystem,
      });
    },
    [user],
  );

  const joinByCode = useCallback(
    async (code: string) => {
      if (!user) {
        throw new Error('يجب تسجيل الدخول أولًا');
      }
      return firestoreTeamRepository.joinByCode({
        code,
        userId: user.uid,
        displayName: user.displayName,
      });
    },
    [user],
  );

  const deleteTeam = useCallback(
    async (teamId: string) => {
      if (!user) {
        throw new Error('يجب تسجيل الدخول أولًا');
      }
      await firestoreTeamRepository.deleteTeam(teamId, user.uid);
    },
    [user],
  );

  const renameTeam = useCallback(
    async (teamId: string, name: string) => {
      if (!user) {
        throw new Error('يجب تسجيل الدخول أولًا');
      }
      await firestoreTeamRepository.renameTeam(teamId, user.uid, name.trim());
    },
    [user],
  );

  return { teams, loading, createTeam, joinByCode, deleteTeam, renameTeam };
}
