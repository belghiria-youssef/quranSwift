import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';

import { firebaseAuthRepository } from '@/data/repositories/FirebaseAuthRepository';
import { firestoreTeamRepository } from '@/data/repositories/FirestoreTeamRepository';
import { User } from '@/domain/entities/User';
import { SignInInput, SignUpInput } from '@/domain/repositories/AuthRepository';

interface AuthContextValue {
  user: User | null;
  initializing: boolean;
  signUp: (input: SignUpInput) => Promise<void>;
  signIn: (input: SignInInput) => Promise<void>;
  signOut: () => Promise<void>;
  renameSelf: (displayName: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signInWithGoogle: (idToken: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    return firebaseAuthRepository.observeUser((nextUser) => {
      setUser(nextUser);
      setInitializing(false);
    });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      initializing,
      signUp: async (input: SignUpInput) => {
        const nextUser = await firebaseAuthRepository.signUp(input);
        setUser(nextUser);
      },
      signIn: async (input: SignInInput) => {
        const nextUser = await firebaseAuthRepository.signIn(input);
        setUser(nextUser);
      },
      signOut: async () => {
        await firebaseAuthRepository.signOut();
      },
      renameSelf: async (displayName: string) => {
        const name = displayName.trim();
        const next = await firebaseAuthRepository.updateDisplayName(name);
        setUser(next);
        await firestoreTeamRepository.updateMemberName(next.uid, name);
      },
      resetPassword: async (email: string) => {
        await firebaseAuthRepository.sendPasswordReset(email);
      },
      signInWithGoogle: async (idToken: string) => {
        const next = await firebaseAuthRepository.signInWithGoogle(idToken);
        setUser(next);
      },
    }),
    [user, initializing],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
