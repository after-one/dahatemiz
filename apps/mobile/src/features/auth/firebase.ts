import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  connectAuthEmulator,
  getAuth,
  getReactNativePersistence,
  initializeAuth,
  type Auth,
} from 'firebase/auth';
import { secureAuthStorage } from './secure-auth-storage';

let authInstance: Auth | null = null;

export function getFirebaseAuth(): Auth {
  if (authInstance) return authInstance;

  const emulatorHost = process.env.EXPO_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST?.trim();
  const isProduction = process.env.EXPO_PUBLIC_ENVIRONMENT === 'production';
  if (emulatorHost && (!__DEV__ || isProduction)) {
    throw new Error('Firebase Auth emulator is allowed only in development builds.');
  }

  const projectId =
    process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || (emulatorHost ? 'demo-dahamiz' : '');
  const apiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY || (emulatorHost ? 'demo-api-key' : '');
  const appId =
    process.env.EXPO_PUBLIC_FIREBASE_APP_ID || (emulatorHost ? '1:123456789:web:dahamiz-dev' : '');
  if (!projectId || !apiKey || !appId) {
    throw new Error(
      'Firebase configuration is missing. Add the public Firebase app values to apps/mobile/.env.',
    );
  }

  const app =
    getApps().length > 0
      ? getApp()
      : initializeApp({
          apiKey,
          appId,
          projectId,
          authDomain:
            process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || `${projectId}.firebaseapp.com`,
        });

  try {
    authInstance = initializeAuth(app, {
      persistence: getReactNativePersistence(secureAuthStorage),
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('already-initialized')) {
      authInstance = getAuth(app);
    } else {
      throw error;
    }
  }

  if (emulatorHost) {
    connectAuthEmulator(authInstance, `http://${emulatorHost}`, { disableWarnings: true });
  }

  return authInstance;
}
