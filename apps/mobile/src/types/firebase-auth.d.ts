import type { Persistence } from 'firebase/auth';

declare module 'firebase/auth' {
  /** Exported by Firebase's React Native build; the package-wide declaration omits the platform export. */
  export function getReactNativePersistence(storage: {
    getItem: (key: string) => Promise<string | null>;
    setItem: (key: string, value: string) => Promise<void>;
    removeItem: (key: string) => Promise<void>;
  }): Persistence;
}
