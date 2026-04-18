import type { Incident, CreateIncidentInput, UpdateIncidentInput, IncidentSeverityValue, IncidentStatusValue } from '../../models/incident';
import type { IIncidentRepository } from '../InMemoryIncidentRepository';
import { apiGet, apiPost } from './apiClient';

export class HttpIncidentRepository implements IIncidentRepository {
  async findById(id: string): Promise<Incident | undefined> {
    try {
      const res = await apiGet<Incident>(`/incidents/${id}`);
      return res.data;
    } catch {
      return undefined;
    }
  }

  async findAll(): Promise<Incident[]> {
    const res = await apiGet<Incident[]>('/incidents');
    return res.data;
  }

  async create(input: CreateIncidentInput): Promise<Incident> {
    const res = await apiPost<Incident>('/incidents', input);
    return res.data;
  }

  async update(id: string, input: UpdateIncidentInput): Promise<Incident> {
    if (input.status === 'resolved') {
      const res = await apiPost<Incident>(`/incidents/${id}/resolve`, {
        resolution_notes: input.resolution_notes,
      });
      return res.data;
    }
    throw new Error('Only resolve transition is supported via API');
  }

  async delete(): Promise<void> {
    throw new Error('Incident deletion not supported');
  }

  async findByAssetId(assetId: string): Promise<Incident[]> {
    const all = await this.findAll();
    return all.filter((i) => i.asset_id === assetId);
  }

  async findBySeverity(severity: IncidentSeverityValue): Promise<Incident[]> {
    const res = await apiGet<Incident[]>(`/incidents?severity=${severity}`);
    return res.data;
  }

  async findByStatus(status: IncidentStatusValue): Promise<Incident[]> {
    const res = await apiGet<Incident[]>(`/incidents?status=${status}`);
    return res.data;
  }

  reset(): void {
    // No-op
  }
}
