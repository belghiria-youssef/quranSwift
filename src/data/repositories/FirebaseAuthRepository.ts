import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';

import { firebaseAuth } from '@/data/firebase/config';
import { User } from '@/domain/entities/User';
import { AuthRepository, SignInInput, SignUpInput } from '@/domain/repositories/AuthRepository';

const toUser = (user: {
  uid: string;
  displayName: string | null;
  email: string | null;
}): User => ({
  uid: user.uid,
  displayName: user.displayName ?? '',
  email: user.email ?? '',
});

export const firebaseAuthRepository: AuthRepository = {
  async signUp({ displayName, email, password }: SignUpInput) {
    const credential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
    await updateProfile(credential.user, { displayName });
    return toUser({ ...credential.user, displayName });
  },
  async signIn({ email, password }: SignInInput) {
    const credential = await signInWithEmailAndPassword(firebaseAuth, email, password);
    return toUser(credential.user);
  },
  signOut() {
    return signOut(firebaseAuth);
  },
  async updateDisplayName(displayName: string) {
    const current = firebaseAuth.currentUser;
    if (!current) {
      throw new Error('يجب تسجيل الدخول أولًا');
    }
    await updateProfile(current, { displayName });
    return toUser({ ...current, displayName });
  },
  async sendPasswordReset(email: string) {
    await sendPasswordResetEmail(firebaseAuth, email.trim());
  },
  async signInWithGoogle(idToken: string) {
    const credential = GoogleAuthProvider.credential(idToken);
    const result = await signInWithCredential(firebaseAuth, credential);
    return toUser(result.user);
  },
  observeUser(listener) {
    return onAuthStateChanged(firebaseAuth, (user) => listener(user ? toUser(user) : null));
  },
};
