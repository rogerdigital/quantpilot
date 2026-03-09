import { createOperatorActionEntry, trimAndSave } from '../shared.mjs';

const FILENAME = 'operator-actions.json';

export function createOperatorActionRepository(store) {
  return {
    listOperatorActions(limit = 50) {
      return store.readCollection(FILENAME).slice(0, limit);
    },
    appendOperatorAction(payload) {
      const actions = store.readCollection(FILENAME);
      const entry = createOperatorActionEntry(payload);
      actions.unshift(entry);
      trimAndSave(store, FILENAME, actions, 100);
      return entry;
    },
  };
}
