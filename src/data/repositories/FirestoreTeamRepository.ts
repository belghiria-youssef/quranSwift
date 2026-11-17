import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';

import { generateInviteCode } from '@/core/utils/inviteCode';
import { firestore } from '@/data/firebase/config';
import { ReadingSystem, Team } from '@/domain/entities/Team';
import {
  CreateTeamInput,
  JoinTeamInput,
  TeamRepository,
} from '@/domain/repositories/TeamRepository';

interface TeamDocument {
  name: string;
  inviteCode: string;
  creatorId: string;
  members: string[];
  readingSystem?: ReadingSystem;
}

const toTeam = (id: string, data: TeamDocument): Team => ({
  id,
  name: data.name,
  inviteCode: data.inviteCode,
  creatorId: data.creatorId,
  members: data.members ?? [],
  readingSystem: data.readingSystem ?? 'free',
});

const newMember = (displayName: string) => ({
  displayName,
  latestPage: 0,
  lastUpdate: null,
  streak: 0,
  lastReadDate: null,
});

async function reserveInviteCode(teamId: string): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const code = generateInviteCode();
    const inviteRef = doc(firestore, 'inviteCodes', code);
    const snapshot = await getDoc(inviteRef);
    if (!snapshot.exists()) {
      await setDoc(inviteRef, { teamId });
      return code;
    }
  }
  throw new Error('تعذر إنشاء رمز الدعوة، حاول مرة أخرى');
}

export const firestoreTeamRepository: TeamRepository = {
  async createTeam({ name, ownerId, ownerName, readingSystem }: CreateTeamInput) {
    const teamRef = doc(collection(firestore, 'teams'));
    const code = await reserveInviteCode(teamRef.id);
    const batch = writeBatch(firestore);
    batch.set(teamRef, {
      name,
      inviteCode: code,
      creatorId: ownerId,
      members: [ownerId],
      readingSystem,
      createdAt: serverTimestamp(),
    });
    batch.set(doc(firestore, 'teams', teamRef.id, 'members', ownerId), newMember(ownerName));
    await batch.commit();
    return {
      id: teamRef.id,
      name,
      inviteCode: code,
      creatorId: ownerId,
      members: [ownerId],
      readingSystem,
    };
  },

  async joinByCode({ code, userId, displayName }: JoinTeamInput) {
    const inviteSnapshot = await getDoc(doc(firestore, 'inviteCodes', code.trim().toUpperCase()));
    if (!inviteSnapshot.exists()) {
      throw new Error('رمز الدعوة غير صحيح');
    }
    const teamId = (inviteSnapshot.data() as { teamId: string }).teamId;
    const teamRef = doc(firestore, 'teams', teamId);
    try {
      await updateDoc(teamRef, { members: arrayUnion(userId) });
    } catch (caught) {
      if (
        typeof caught === 'object' &&
        caught !== null &&
        'code' in caught &&
        (caught as { code: string }).code === 'not-found'
      ) {
        throw new Error('الفريق غير موجود');
      }
      throw caught;
    }
    await setDoc(
      doc(firestore, 'teams', teamId, 'members', userId),
      newMember(displayName),
      { merge: true },
    );
    const teamSnapshot = await getDoc(teamRef);
    if (!teamSnapshot.exists()) {
      throw new Error('الفريق غير موجود');
    }
    return toTeam(teamId, teamSnapshot.data() as TeamDocument);
  },

  async deleteTeam(teamId, userId) {
    const teamRef = doc(firestore, 'teams', teamId);
    const snapshot = await getDoc(teamRef);
    if (!snapshot.exists()) {
      return;
    }
    const data = snapshot.data() as TeamDocument;
    if (data.creatorId !== userId) {
      throw new Error('غير مسموح لك بحذف الفريق');
    }
    const batch = writeBatch(firestore);
    const membersSnapshot = await getDocs(collection(firestore, 'teams', teamId, 'members'));
    for (const memberDocument of membersSnapshot.docs) {
      const updatesSnapshot = await getDocs(
        collection(firestore, 'teams', teamId, 'members', memberDocument.id, 'updates'),
      );
      updatesSnapshot.docs.forEach((updateDocument) => batch.delete(updateDocument.ref));
      batch.delete(memberDocument.ref);
    }
    batch.delete(doc(firestore, 'inviteCodes', data.inviteCode));
    batch.delete(teamRef);
    await batch.commit();
  },

  async renameTeam(teamId, userId, name) {
    const teamRef = doc(firestore, 'teams', teamId);
    const snapshot = await getDoc(teamRef);
    if (!snapshot.exists()) {
      throw new Error('الفريق غير موجود');
    }
    const data = snapshot.data() as TeamDocument;
    if (data.creatorId !== userId) {
      throw new Error('غير مسموح لك بتغيير اسم الفريق');
    }
    await updateDoc(teamRef, { name });
  },

  async updateMemberName(userId, displayName) {
    const teamsQuery = query(
      collection(firestore, 'teams'),
      where('members', 'array-contains', userId),
    );
    const snapshot = await getDocs(teamsQuery);
    const batch = writeBatch(firestore);
    snapshot.docs.forEach((document) => {
      batch.set(
        doc(firestore, 'teams', document.id, 'members', userId),
        { displayName },
        { merge: true },
      );
    });
    await batch.commit();
  },

  observeMyTeams(userId, listener) {
    const teamsQuery = query(
      collection(firestore, 'teams'),
      where('members', 'array-contains', userId),
    );
    return onSnapshot(teamsQuery, (snapshot) => {
      listener(snapshot.docs.map((document) => toTeam(document.id, document.data() as TeamDocument)));
    });
  },
};
