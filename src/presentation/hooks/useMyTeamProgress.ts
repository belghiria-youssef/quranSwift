import { useEffect, useState } from 'react';

import { firestoreProgressRepository } from '@/data/repositories/FirestoreProgressRepository';
import { Membership } from '@/domain/entities/Membership';
import { useActiveTeam } from '@/presentation/context/ActiveTeamContext';
import { useAuth } from '@/presentation/hooks/useAuth';

export function useMyTeamProgress(): Record<string, Membership> {
  const { teams } = useActiveTeam();
  const { user } = useAuth();
  const [map, setMap] = useState<Record<string, Membership>>({});

  useEffect(() => {
    if (!user || teams.length === 0) {
      setMap({});
      return undefined;
    }
    let active = true;
    Promise.all(
      teams.map((team) =>
        firestoreProgressRepository
          .getMember(team.id, user.uid)
          .catch(() => null),
      ),
    ).then((members) => {
      if (!active) {
        return;
      }
      const next: Record<string, Membership> = {};
      teams.forEach((team, index) => {
        const member = members[index];
        if (member) {
          next[team.id] = member;
        }
      });
      setMap(next);
    });
    return () => {
      active = false;
    };
  }, [teams, user]);

  return map;
}