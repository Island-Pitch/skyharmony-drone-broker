import type { Incident, IncidentSeverityValue, IncidentStatusValue } from '../models/incident';
import type { CreateIncidentInput, UpdateIncidentInput } from '../models/incident';
import { store } from '../store';

export interface IIncidentRepository {
  create(input: CreateIncidentInput): Promise<Incident>;
  findById(id: string): Promise<Incident | undefined>;
  findAll(): Promise<Incident[]>;
  findByAssetId(assetId: string): Promise<Incident[]>;
  findBySeverity(severity: IncidentSeverityValue): Promise<Incident[]>;
  findByStatus(status: IncidentStatusValue): Promise<Incident[]>;
  update(id: string, input: UpdateIncidentInput): Promise<Incident>;
  reset(): void;
}

export class InMemoryIncidentRepository implements IIncidentRepository {
  async create(input: CreateIncidentInput): Promise<Incident> {
    const now = new Date().toISOString();
    const incident: Incident = {
      id: crypto.randomUUID(),
      asset_id: input.asset_id,
      booking_id: input.booking_id,
      reporter_id: input.reporter_id,
      severity: input.severity,
      description: input.description,
      photo_url: input.photo_url,
      status: 'open',
      created_at: now,
      updated_at: now,
    };
    store.incidents.set(incident.id, incident);
    return incident;
  }

  async findById(id: string): Promise<Incident | undefined> {
    return store.incidents.get(id);
  }

  async findAll(): Promise<Incident[]> {
    return Array.from(store.incidents.values());
  }

  async findByAssetId(assetId: string): Promise<Incident[]> {
    return Array.from(store.incidents.values())
      .filter((i) => i.asset_id === assetId)
      .sort((a, b) => a.created_at.localeCompare(b.created_at));
  }

  async findBySeverity(severity: IncidentSeverityValue): Promise<Incident[]> {
    return Array.from(store.incidents.values())
      .filter((i) => i.severity === severity);
  }

  async findByStatus(status: IncidentStatusValue): Promise<Incident[]> {
    return Array.from(store.incidents.values())
      .filter((i) => i.status === status);
  }

  async update(id: string, input: UpdateIncidentInput): Promise<Incident> {
    const existing = store.incidents.get(id);
    if (!existing) {
      throw new Error(`Incident not found: ${id}`);
    }

    const updated: Incident = {
      ...existing,
      ...Object.fromEntries(
        Object.entries(input).filter(([, v]) => v !== undefined),
      ),
      updated_at: new Date().toISOString(),
    };

    store.incidents.set(id, updated);
    return updated;
  }

  reset(): void {
    store.incidents.clear();
  }
}
