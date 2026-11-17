import { useEffect, useState } from 'react';

import { firestoreProgressRepository } from '@/data/repositories/FirestoreProgressRepository';
import { Membership } from '@/domain/entities/Membership';

interface UseTeamMembersResult {
  members: Membership[];
  loading: boolean;
}

export function useTeamMembers(teamId: string): UseTeamMembersResult {
  const [members, setMembers] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!teamId) {
      setMembers([]);
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    return firestoreProgressRepository.observeMembers(teamId, (nextMembers) => {
      setMembers(nextMembers);
      setLoading(false);
    });
  }, [teamId]);

  return { members, loading };
}
