import { create } from 'zustand';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  type Unsubscribe,
} from 'firebase/auth';
import { getFirebaseAuth } from './firebase';
import { loadAuthenticatedProfile } from '../../lib/api-client';

export interface AuthProfile {
  uid: string;
  email: string;
  displayName: string;
  isDemo: false;
}

interface AuthState {
  profile: AuthProfile | null;
  isLoading: boolean;
  initialize: () => Unsubscribe | undefined;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
}

function toProfile(user: {
  uid: string;
  email: string | null;
  displayName: string | null;
}): AuthProfile {
  return {
    uid: user.uid,
    email: user.email ?? '',
    displayName: user.displayName?.trim() || user.email?.split('@')[0] || 'Dostum',
    isDemo: false,
  };
}

export const useAuthStore = create<AuthState>((set) => ({
  profile: null,
  isLoading: true,
  initialize: () => {
    try {
      return onAuthStateChanged(
        getFirebaseAuth(),
        (user) => {
          set({ profile: user ? toProfile(user) : null, isLoading: false });
        },
        () => set({ profile: null, isLoading: false }),
      );
    } catch {
      set({ isLoading: false });
      return undefined;
    }
  },
  signIn: async (email, password) => {
    const credential = await signInWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
    const localProfile = toProfile(credential.user);
    const apiProfile = await loadAuthenticatedProfile(await credential.user.getIdToken());
    set({
      profile: { ...localProfile, displayName: apiProfile.displayName || localProfile.displayName },
      isLoading: false,
    });
  },
  signUp: async (email, password, displayName) => {
    const credential = await createUserWithEmailAndPassword(
      getFirebaseAuth(),
      email.trim(),
      password,
    );
    await updateProfile(credential.user, { displayName: displayName.trim() });
    await credential.user.getIdToken(true);
    const localProfile = toProfile(credential.user);
    const apiProfile = await loadAuthenticatedProfile(await credential.user.getIdToken());
    set({
      profile: { ...localProfile, displayName: apiProfile.displayName || localProfile.displayName },
      isLoading: false,
    });
  },
  signOut: async () => {
    await firebaseSignOut(getFirebaseAuth());
    set({ profile: null, isLoading: false });
  },
}));
