import { controlPlaneRuntime } from '../../../../../packages/control-plane-runtime/src/index.mjs';

function parseLimit(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function resolveSince(hours) {
  const parsed = Number(hours);
  if (!Number.isFinite(parsed) || parsed <= 0) return '';
  return new Date(Date.now() - parsed * 60 * 60 * 1000).toISOString();
}

export function listIncidents(options = {}) {
  return controlPlaneRuntime.listIncidents(parseLimit(options.limit, 50), {
    owner: options.owner || '',
    severity: options.severity || '',
    source: options.source || '',
    status: options.status || '',
    since: resolveSince(options.hours),
  });
}

export function getIncidentDetail(incidentId, options = {}) {
  const incident = controlPlaneRuntime.getIncident(incidentId);
  if (!incident) return null;
  return {
    incident,
    notes: controlPlaneRuntime.listIncidentNotes(incidentId, parseLimit(options.noteLimit, 100)),
  };
}

export function createIncident(payload = {}) {
  return controlPlaneRuntime.recordIncident(payload);
}

export function updateIncident(incidentId, payload = {}) {
  return controlPlaneRuntime.transitionIncident(incidentId, payload);
}

export function appendIncidentNote(incidentId, payload = {}) {
  return controlPlaneRuntime.recordIncidentNote(incidentId, payload);
}
