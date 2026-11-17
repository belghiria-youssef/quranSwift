import { useEffect, useState } from 'react';

import { firestoreProgressRepository } from '@/data/repositories/FirestoreProgressRepository';
import { useAuth } from '@/presentation/hooks/useAuth';
import { useTeams } from '@/presentation/hooks/useTeams';

export function useProfileDates(): string[] {
  const { user } = useAuth();
  const { teams } = useTeams();
  const [dates, setDates] = useState<string[]>([]);
  const ids = teams.length ? teams.map((team) => team.id).join(',') : '';

  useEffect(() => {
    if (!user || !ids) {
      setDates([]);
      return undefined;
    }
    let active = true;
    Promise.all(
      teams.map(async (team) => firestoreProgressRepository.getReadingDates(team.id, user.uid)),
    )
      .then((all) => {
        if (!active) {
          return;
        }
        const seen = new Set<string>();
        const merged: string[] = [];
        all.forEach((list) => {
          list.forEach((key) => {
            if (!seen.has(key)) {
              seen.add(key);
              merged.push(key);
            }
          });
        });
        setDates(merged);
      })
      .catch(() => {
        if (active) {
          setDates([]);
        }
      });
    return () => {
      active = false;
    };
  }, [user, ids]);

  return dates;
}