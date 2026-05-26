export function createKeyValueStore({ ensureRoot, resolvePath, readJsonFile, writeJsonFile }: any) {
  function readObject(filename: string, fallback: any): any {
    ensureRoot();
    const parsed = readJsonFile(resolvePath(filename), fallback);
    return parsed && typeof parsed === 'object' ? parsed : fallback;
  }

  function writeObject(filename: string, value: any) {
    ensureRoot();
    writeJsonFile(resolvePath(filename), value);
  }

  return {
    readObject,
    writeObject,
  };
}
