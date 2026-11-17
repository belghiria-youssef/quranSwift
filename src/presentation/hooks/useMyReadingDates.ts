import { useEffect, useState } from 'react';

import { firestoreProgressRepository } from '@/data/repositories/FirestoreProgressRepository';
import { useAuth } from '@/presentation/hooks/useAuth';

export function useMyReadingDates(teamId: string): string[] {
  const { user } = useAuth();
  const [dates, setDates] = useState<string[]>([]);

  useEffect(() => {
    if (!user || !teamId) {
      setDates([]);
      return undefined;
    }
    let active = true;
    firestoreProgressRepository
      .getReadingDates(teamId, user.uid)
      .then((next) => {
        if (active) {
          setDates(next);
        }
      })
      .catch(() => {
        if (active) {
          setDates([]);
        }
      });
    return () => {
      active = false;
    };
  }, [teamId, user]);

  return dates;
}