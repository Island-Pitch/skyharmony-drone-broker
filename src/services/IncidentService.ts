import { CreateIncidentInputSchema } from '@/data/models/incident';
import type { Incident } from '@/data/models/incident';
import type { IIncidentRepository } from '@/data/repositories/InMemoryIncidentRepository';
import type { IAssetRepository } from '@/data/repositories/interfaces';
import type { AuditService } from './AuditService';

/** Service layer for incident/damage reporting. Validates input, auto-grounds on critical severity. */
export class IncidentService {
  constructor(
    private readonly incidentRepo: IIncidentRepository,
    private readonly assetRepo: IAssetRepository,
    private readonly auditService: AuditService,
  ) {}

  /** Report a new incident. Critical severity auto-grounds the asset (status -> maintenance). */
  async reportIncident(input: unknown): Promise<Incident> {
    const validated = CreateIncidentInputSchema.parse(input);
    const incident = await this.incidentRepo.create(validated);

    if (validated.severity === 'critical') {
      const asset = await this.assetRepo.findById(validated.asset_id);
      if (asset) {
        const oldStatus = asset.status;
        await this.assetRepo.update(validated.asset_id, {
          status: 'maintenance',
        });
        await this.auditService.recordStatusChange(
          validated.asset_id,
          oldStatus,
          'maintenance',
          validated.reporter_id,
        );
      }
    }

    return incident;
  }

  /** Resolve an incident with resolution notes. */
  async resolveIncident(
    id: string,
    resolutionNotes: string,
  ): Promise<Incident> {
    return this.incidentRepo.update(id, {
      status: 'resolved',
      resolution_notes: resolutionNotes,
    });
  }

  /** List all incidents. */
  async listIncidents(): Promise<Incident[]> {
    return this.incidentRepo.findAll();
  }

  /** Get a single incident by id. */
  async getIncident(id: string): Promise<Incident | undefined> {
    return this.incidentRepo.findById(id);
  }

  /** Get all incidents for a specific asset. */
  async getAssetIncidents(assetId: string): Promise<Incident[]> {
    return this.incidentRepo.findByAssetId(assetId);
  }
}
