import { useCallback } from 'react';

import { firestoreProgressRepository } from '@/data/repositories/FirestoreProgressRepository';
import { useAuth } from '@/presentation/hooks/useAuth';

export function useRecordProgress() {
  const { user } = useAuth();

  return useCallback(
    async (teamId: string, page: number) => {
      if (!user) {
        throw new Error('يجب تسجيل الدخول أولًا');
      }
      await firestoreProgressRepository.recordProgress({
        teamId,
        userId: user.uid,
        displayName: user.displayName,
        page,
      });
    },
    [user],
  );
}
