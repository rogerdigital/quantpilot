export function createCollectionStore({ ensureRoot, resolvePath, readJsonFile, writeJsonFile }) {
  function readCollection(filename) {
    ensureRoot();
    const parsed = readJsonFile(resolvePath(filename), []);
    return Array.isArray(parsed) ? parsed : [];
  }

  function writeCollection(filename, entries) {
    ensureRoot();
    writeJsonFile(resolvePath(filename), entries);
  }

  return {
    readCollection,
    writeCollection,
  };
}
