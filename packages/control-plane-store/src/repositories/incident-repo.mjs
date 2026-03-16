import { createIncidentActivityEntry, createIncidentEntry, createIncidentNoteEntry, trimAndSave } from '../shared.mjs';

const INCIDENTS_FILE = 'incidents.json';
const NOTES_FILE = 'incident-notes.json';
const ACTIVITIES_FILE = 'incident-activities.json';

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

  function readActivities() {
    return store.readCollection(ACTIVITIES_FILE);
  }

  function listIncidentActivities(incidentId, limit = 100) {
    return readActivities()
      .filter((item) => item.incidentId === incidentId)
      .sort((left, right) => Date.parse(right.createdAt || '') - Date.parse(left.createdAt || ''))
      .slice(0, limit);
  }

  function appendActivity(incidentId, payload = {}) {
    const activities = readActivities();
    const entry = createIncidentActivityEntry({
      ...payload,
      incidentId,
    });
    activities.unshift(entry);
    trimAndSave(store, ACTIVITIES_FILE, activities, 1200);
    return entry;
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
          .filter((item) => {
            if (!filter.owner) return true;
            if (filter.owner === 'unassigned') return !item.owner;
            return item.owner === filter.owner;
          }),
      ).map(hydrateIncident);
      return items.slice(0, limit);
    },
    getIncident(incidentId) {
      const incident = readIncidents().find((item) => item.id === incidentId);
      return incident ? hydrateIncident(incident) : null;
    },
    listIncidentActivities,
    listIncidentNotes(incidentId, limit = 100) {
      return readNotes()
        .filter((item) => item.incidentId === incidentId)
        .sort((left, right) => Date.parse(right.createdAt || '') - Date.parse(left.createdAt || ''))
        .slice(0, limit);
    },
    appendIncident(payload = {}) {
      const incidents = readIncidents();
      const entry = createIncidentEntry(payload);
      incidents.unshift(entry);
      trimAndSave(store, INCIDENTS_FILE, incidents, 200);

      appendActivity(entry.id, {
        kind: 'opened',
        actor: payload.actor || payload.owner || 'operator',
        createdAt: entry.createdAt,
        title: `Incident opened: ${entry.title}`,
        detail: entry.summary || 'Incident created from the investigation console.',
        metadata: {
          severity: entry.severity,
          status: entry.status,
          source: entry.source,
          owner: entry.owner,
        },
      });

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
        appendActivity(entry.id, {
          kind: 'note-added',
          actor: note.author,
          createdAt: note.createdAt,
          title: 'Initial incident note added',
          detail: note.body,
          metadata: {
            noteId: note.id,
          },
        });
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

      if (current.status !== next.status) {
        appendActivity(incidentId, {
          kind: 'status-changed',
          actor: patch.actor || next.owner || 'operator',
          createdAt: next.updatedAt,
          title: `Status changed to ${next.status}`,
          detail: patch.summary || `Incident moved from ${current.status} to ${next.status}.`,
          metadata: {
            from: current.status,
            to: next.status,
          },
        });
      }

      if ((current.owner || '') !== (next.owner || '')) {
        appendActivity(incidentId, {
          kind: 'owner-changed',
          actor: patch.actor || next.owner || 'operator',
          createdAt: next.updatedAt,
          title: next.owner ? `Owner set to ${next.owner}` : 'Owner cleared',
          detail: next.owner
            ? `Ownership changed from ${current.owner || 'unassigned'} to ${next.owner}.`
            : `Ownership cleared from ${current.owner || 'unassigned'}.`,
          metadata: {
            from: current.owner || '',
            to: next.owner || '',
          },
        });
      }

      if ((current.severity || '') !== (next.severity || '')) {
        appendActivity(incidentId, {
          kind: 'severity-changed',
          actor: patch.actor || next.owner || 'operator',
          createdAt: next.updatedAt,
          title: `Severity changed to ${next.severity}`,
          detail: `Severity moved from ${current.severity} to ${next.severity}.`,
          metadata: {
            from: current.severity,
            to: next.severity,
          },
        });
      }

      if ((patch.summary || '') && patch.summary !== current.summary) {
        appendActivity(incidentId, {
          kind: 'summary-updated',
          actor: patch.actor || next.owner || 'operator',
          createdAt: next.updatedAt,
          title: 'Incident summary updated',
          detail: patch.summary,
          metadata: {
            previousSummary: current.summary || '',
          },
        });
      }

      if (Array.isArray(patch.links)) {
        appendActivity(incidentId, {
          kind: 'links-updated',
          actor: patch.actor || next.owner || 'operator',
          createdAt: next.updatedAt,
          title: 'Incident links updated',
          detail: `Linked evidence count is now ${next.links.length}.`,
          metadata: {
            previousCount: Array.isArray(current.links) ? current.links.length : 0,
            nextCount: Array.isArray(next.links) ? next.links.length : 0,
          },
        });
      }

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
      appendActivity(incidentId, {
        kind: 'note-added',
        actor: note.author,
        createdAt: note.createdAt,
        title: 'Incident note added',
        detail: note.body,
        metadata: {
          noteId: note.id,
        },
      });

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
