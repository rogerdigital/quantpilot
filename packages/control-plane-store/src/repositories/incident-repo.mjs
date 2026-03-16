import { createIncidentEntry, createIncidentNoteEntry, trimAndSave } from '../shared.mjs';

const INCIDENTS_FILE = 'incidents.json';
const NOTES_FILE = 'incident-notes.json';

export function createIncidentRepository(store) {
  function filterByDate(items, since) {
    if (!since) return items;
    const sinceMs = Date.parse(since);
    if (!Number.isFinite(sinceMs)) return items;
    return items.filter((item) => {
      const valueMs = Date.parse(item.updatedAt || item.createdAt || '');
      return Number.isFinite(valueMs) && valueMs >= sinceMs;
    });
  }

  function sortByUpdatedAtDesc(items) {
    return [...items].sort((left, right) => {
      const leftMs = Date.parse(left.updatedAt || left.createdAt || '');
      const rightMs = Date.parse(right.updatedAt || right.createdAt || '');
      if (!Number.isFinite(leftMs) && !Number.isFinite(rightMs)) return 0;
      if (!Number.isFinite(leftMs)) return 1;
      if (!Number.isFinite(rightMs)) return -1;
      return rightMs - leftMs;
    });
  }

  function readIncidents() {
    return store.readCollection(INCIDENTS_FILE);
  }

  function readNotes() {
    return store.readCollection(NOTES_FILE);
  }

  function hydrateIncident(incident) {
    const notes = readNotes().filter((item) => item.incidentId === incident.id);
    const latestNote = sortByUpdatedAtDesc(notes.map((item) => ({
      ...item,
      updatedAt: item.createdAt,
    })))[0] || null;
    return {
      ...incident,
      noteCount: notes.length,
      latestNotePreview: latestNote?.body || incident.latestNotePreview || '',
    };
  }

  return {
    listIncidents(limit = 50, filter = {}) {
      const items = sortByUpdatedAtDesc(
        filterByDate(readIncidents(), filter.since)
          .filter((item) => !filter.status || item.status === filter.status)
          .filter((item) => !filter.severity || item.severity === filter.severity)
          .filter((item) => !filter.source || item.source === filter.source)
          .filter((item) => !filter.owner || item.owner === filter.owner),
      ).map(hydrateIncident);
      return items.slice(0, limit);
    },
    getIncident(incidentId) {
      const incident = readIncidents().find((item) => item.id === incidentId);
      return incident ? hydrateIncident(incident) : null;
    },
    listIncidentNotes(incidentId, limit = 100) {
      const notes = readNotes()
        .filter((item) => item.incidentId === incidentId)
        .sort((left, right) => Date.parse(right.createdAt || '') - Date.parse(left.createdAt || ''))
        .slice(0, limit);
      return notes;
    },
    appendIncident(payload = {}) {
      const incidents = readIncidents();
      const entry = createIncidentEntry(payload);
      incidents.unshift(entry);
      trimAndSave(store, INCIDENTS_FILE, incidents, 200);

      if (payload.initialNote) {
        const notes = readNotes();
        const note = createIncidentNoteEntry({
          incidentId: entry.id,
          body: payload.initialNote,
          author: payload.owner || payload.actor || 'operator',
          createdAt: payload.createdAt || entry.createdAt,
          metadata: payload.initialNoteMetadata || {},
        });
        notes.unshift(note);
        trimAndSave(store, NOTES_FILE, notes, 600);
        return hydrateIncident({
          ...entry,
          noteCount: 1,
          latestNotePreview: note.body,
        });
      }

      return hydrateIncident(entry);
    },
    updateIncident(incidentId, patch = {}) {
      const incidents = readIncidents();
      const index = incidents.findIndex((item) => item.id === incidentId);
      if (index === -1) return null;
      const current = incidents[index];
      const nextStatus = patch.status || current.status;
      const next = {
        ...current,
        ...patch,
        links: Array.isArray(patch.links) ? patch.links : current.links,
        tags: Array.isArray(patch.tags) ? patch.tags : current.tags,
        metadata: patch.metadata ? { ...current.metadata, ...patch.metadata } : current.metadata,
        acknowledgedAt: patch.status === 'investigating'
          ? (patch.acknowledgedAt || current.acknowledgedAt || new Date().toISOString())
          : (patch.acknowledgedAt ?? current.acknowledgedAt),
        resolvedAt: nextStatus === 'resolved'
          ? (patch.resolvedAt || current.resolvedAt || new Date().toISOString())
          : (patch.clearResolvedAt ? '' : current.resolvedAt),
        updatedAt: patch.updatedAt || new Date().toISOString(),
      };
      delete next.clearResolvedAt;
      incidents[index] = next;
      trimAndSave(store, INCIDENTS_FILE, incidents, 200);
      return hydrateIncident(next);
    },
    appendIncidentNote(incidentId, payload = {}) {
      const incidents = readIncidents();
      const index = incidents.findIndex((item) => item.id === incidentId);
      if (index === -1) return null;
      const notes = readNotes();
      const note = createIncidentNoteEntry({
        ...payload,
        incidentId,
      });
      notes.unshift(note);
      trimAndSave(store, NOTES_FILE, notes, 600);

      const current = incidents[index];
      incidents[index] = {
        ...current,
        updatedAt: payload.updatedAt || note.createdAt,
        latestNotePreview: note.body,
        noteCount: Number(current.noteCount || 0) + 1,
      };
      trimAndSave(store, INCIDENTS_FILE, incidents, 200);

      return note;
    },
  };
}
