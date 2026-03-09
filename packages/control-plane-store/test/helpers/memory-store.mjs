export function createMemoryStore() {
  const collections = new Map();
  const objects = new Map();

  return {
    readCollection(filename) {
      return [...(collections.get(filename) || [])];
    },
    writeCollection(filename, entries) {
      collections.set(filename, [...entries]);
    },
    readObject(filename, fallback) {
      if (!objects.has(filename)) {
        return fallback;
      }
      return structuredClone(objects.get(filename));
    },
    writeObject(filename, value) {
      objects.set(filename, structuredClone(value));
    },
  };
}
