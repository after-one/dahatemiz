import * as SecureStore from 'expo-secure-store';

const chunkSize = 400;

interface SecureStoragePort {
  getItemAsync: (key: string) => Promise<string | null>;
  setItemAsync: (key: string, value: string) => Promise<void>;
  deleteItemAsync: (key: string) => Promise<void>;
}

interface Manifest {
  generation: string;
  chunks: number;
}

function hashKey(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function manifestKey(key: string): string {
  return `dm_auth_${hashKey(key)}_manifest`;
}

function dataKey(key: string, generation: string, index: number): string {
  return `dm_auth_${hashKey(key)}_${generation}_${index}`;
}

function parseManifest(value: string | null): Manifest | null {
  if (!value) return null;
  try {
    const parsed: unknown = JSON.parse(value);
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'generation' in parsed &&
      typeof parsed.generation === 'string' &&
      'chunks' in parsed &&
      typeof parsed.chunks === 'number' &&
      Number.isInteger(parsed.chunks) &&
      parsed.chunks > 0
    ) {
      return { generation: parsed.generation, chunks: parsed.chunks };
    }
  } catch {
    return null;
  }
  return null;
}

export function createSecureAuthStorage(storage: SecureStoragePort) {
  return {
    async getItem(key: string): Promise<string | null> {
      const manifest = parseManifest(await storage.getItemAsync(manifestKey(key)));
      if (!manifest) return null;

      const chunks = await Promise.all(
        Array.from({ length: manifest.chunks }, (_, index) =>
          storage.getItemAsync(dataKey(key, manifest.generation, index)),
        ),
      );
      if (chunks.some((chunk) => chunk === null)) return null;
      return chunks.join('');
    },

    async setItem(key: string, value: string): Promise<void> {
      const keyForManifest = manifestKey(key);
      const oldManifest = parseManifest(await storage.getItemAsync(keyForManifest));
      const generation = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
      const chunks = Array.from({ length: Math.ceil(value.length / chunkSize) }, (_, index) =>
        value.slice(index * chunkSize, (index + 1) * chunkSize),
      );
      const storedChunks = chunks.length > 0 ? chunks : [''];

      await Promise.all(
        storedChunks.map((chunk, index) =>
          storage.setItemAsync(dataKey(key, generation, index), chunk),
        ),
      );
      await storage.setItemAsync(
        keyForManifest,
        JSON.stringify({ generation, chunks: storedChunks.length }),
      );

      if (oldManifest) {
        await Promise.all(
          Array.from({ length: oldManifest.chunks }, (_, index) =>
            storage.deleteItemAsync(dataKey(key, oldManifest.generation, index)),
          ),
        );
      }
    },

    async removeItem(key: string): Promise<void> {
      const keyForManifest = manifestKey(key);
      const manifest = parseManifest(await storage.getItemAsync(keyForManifest));
      await storage.deleteItemAsync(keyForManifest);
      if (manifest) {
        await Promise.all(
          Array.from({ length: manifest.chunks }, (_, index) =>
            storage.deleteItemAsync(dataKey(key, manifest.generation, index)),
          ),
        );
      }
    },
  };
}

export const secureAuthStorage = createSecureAuthStorage(SecureStore);
