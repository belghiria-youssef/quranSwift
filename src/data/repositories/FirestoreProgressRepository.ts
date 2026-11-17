import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';

import { toDateKey } from '@/core/utils/date';
import { firestore } from '@/data/firebase/config';
import { Membership } from '@/domain/entities/Membership';
import {
  ProgressRepository,
  RecordProgressInput,
} from '@/domain/repositories/ProgressRepository';
import { nextStreak } from '@/domain/usecases/streak';

interface MemberDocument {
  displayName?: string;
  latestPage?: number;
  lastUpdate?: { toDate: () => Date } | null;
  streak?: number;
  lastReadDate?: string | null;
}

const toMembership = (userId: string, data: MemberDocument): Membership => ({
  userId,
  displayName: data.displayName ?? '',
  latestPage: data.latestPage ?? 0,
  lastUpdate: data.lastUpdate ? data.lastUpdate.toDate() : null,
  streak: data.streak ?? 0,
  lastReadDate: data.lastReadDate ?? null,
});

export const firestoreProgressRepository: ProgressRepository = {
  observeMembers(teamId, listener) {
    if (!teamId) {
      listener([]);
      return () => undefined;
    }
    return onSnapshot(collection(firestore, 'teams', teamId, 'members'), (snapshot) => {
      listener(snapshot.docs.map((document) => toMembership(document.id, document.data())));
    });
  },

  async getMember(teamId, userId) {
    if (!teamId) {
      return null;
    }
    const snapshot = await getDoc(doc(firestore, 'teams', teamId, 'members', userId));
    return snapshot.exists() ? toMembership(userId, snapshot.data() as MemberDocument) : null;
  },

  async getReadingDates(teamId, userId) {
    if (!teamId) {
      return [];
    }
    const updatesQuery = query(
      collection(firestore, 'teams', teamId, 'members', userId, 'updates'),
      orderBy('date', 'desc'),
      limit(366),
    );
    const snapshot = await getDocs(updatesQuery);
    const dates: string[] = [];
    snapshot.docs.forEach((document) => {
      const data = document.data() as { date?: { toDate: () => Date } };
      const value = data.date?.toDate();
      if (value) {
        dates.push(toDateKey(value));
      }
    });
    return dates;
  },

  async recordProgress({ teamId, userId, displayName, page }: RecordProgressInput) {
    if (!teamId) {
      throw new Error('لا يوجد فريق');
    }
    const memberRef = doc(firestore, 'teams', teamId, 'members', userId);
    await runTransaction(firestore, async (transaction) => {
      const snapshot = await transaction.get(memberRef);
      const data = snapshot.data() as MemberDocument | undefined;
      const today = toDateKey(new Date());
      const streak = nextStreak(data?.lastReadDate ?? null, today, data?.streak ?? 0);
      transaction.set(
        memberRef,
        {
          displayName,
          latestPage: page,
          lastUpdate: serverTimestamp(),
          lastReadDate: today,
          streak,
        },
        { merge: true },
      );
      const updateRef = doc(collection(firestore, 'teams', teamId, 'members', userId, 'updates'));
      transaction.set(updateRef, { page, date: serverTimestamp() });
    });
  },
};
