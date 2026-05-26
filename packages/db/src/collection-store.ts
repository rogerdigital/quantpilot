export function createCollectionStore({
  ensureRoot,
  resolvePath,
  readJsonFile,
  writeJsonFile,
}: any) {
  function readCollection(filename: string): any[] {
    ensureRoot();
    const parsed = readJsonFile(resolvePath(filename), []);
    return Array.isArray(parsed) ? parsed : [];
  }

  function writeCollection(filename: string, entries: any) {
    ensureRoot();
    writeJsonFile(resolvePath(filename), entries);
  }

  return {
    readCollection,
    writeCollection,
  };
}
