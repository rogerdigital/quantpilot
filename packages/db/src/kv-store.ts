export function createKeyValueStore({ ensureRoot, resolvePath, readJsonFile, writeJsonFile }) {
  function readObject(filename, fallback) {
    ensureRoot();
    const parsed = readJsonFile(resolvePath(filename), fallback);
    return parsed && typeof parsed === 'object' ? parsed : fallback;
  }

  function writeObject(filename, value) {
    ensureRoot();
    writeJsonFile(resolvePath(filename), value);
  }

  return {
    readObject,
    writeObject,
  };
}
