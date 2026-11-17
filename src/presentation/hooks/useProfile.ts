import { useEffect, useState } from 'react';

import { firestoreProgressRepository } from '@/data/repositories/FirestoreProgressRepository';
import { Membership } from '@/domain/entities/Membership';
import { useAuth } from '@/presentation/hooks/useAuth';
import { useTeams } from '@/presentation/hooks/useTeams';

export interface ProfileEntry {
  teamId: string;
  teamName: string;
  membership: Membership | null;
}

interface UseProfileResult {
  entries: ProfileEntry[];
  loading: boolean;
}

export function useProfile(): UseProfileResult {
  const { user } = useAuth();
  const { teams } = useTeams();
  const [entries, setEntries] = useState<ProfileEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const teamIds = teams.map((team) => team.id).join(',');

  useEffect(() => {
    if (!user) {
      setEntries([]);
      setLoading(false);
      return undefined;
    }
    let active = true;
    setLoading(true);
    Promise.all(
      teams.map(async (team) => ({
        teamId: team.id,
        teamName: team.name,
        membership: await firestoreProgressRepository.getMember(team.id, user.uid),
      })),
    )
      .then((nextEntries) => {
        if (active) {
          setEntries(nextEntries);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setEntries([]);
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [user, teamIds]);

  return { entries, loading };
}
