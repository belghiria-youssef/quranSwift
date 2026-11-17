import { User } from '@/domain/entities/User';

export interface SignUpInput {
  displayName: string;
  email: string;
  password: string;
}

export interface SignInInput {
  email: string;
  password: string;
}

export interface AuthRepository {
  signUp(input: SignUpInput): Promise<User>;
  signIn(input: SignInInput): Promise<User>;
  signOut(): Promise<void>;
  updateDisplayName(displayName: string): Promise<User>;
  sendPasswordReset(email: string): Promise<void>;
  signInWithGoogle(idToken: string): Promise<User>;
  observeUser(listener: (user: User | null) => void): () => void;
}
