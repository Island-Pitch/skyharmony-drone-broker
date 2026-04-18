import { describe, it, expect, beforeEach } from 'vitest';
import { IncidentService } from '../IncidentService';
import { AuditService } from '../AuditService';
import { AssetService } from '../AssetService';
import { InMemoryAssetRepository } from '@/data/repositories/InMemoryAssetRepository';
import { InMemoryAuditRepository } from '@/data/repositories/InMemoryAuditRepository';
import { InMemoryIncidentRepository } from '@/data/repositories/InMemoryIncidentRepository';
import { store } from '@/data/store';

describe('IncidentService', () => {
  let incidentService: IncidentService;
  let assetService: AssetService;
  let assetRepo: InMemoryAssetRepository;
  let auditRepo: InMemoryAuditRepository;
  let incidentRepo: InMemoryIncidentRepository;
  const droneTypeId = '00000000-0000-4000-8000-000000000001';
  const reporterId = crypto.randomUUID();

  beforeEach(() => {
    store.reset();
    store.assetTypes.set(droneTypeId, {
      id: droneTypeId,
      name: 'drone',
      description: 'UAV',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    assetRepo = new InMemoryAssetRepository();
    auditRepo = new InMemoryAuditRepository();
    auditRepo.reset();
    incidentRepo = new InMemoryIncidentRepository();
    assetService = new AssetService(assetRepo);
    const auditService = new AuditService(auditRepo);
    incidentService = new IncidentService(incidentRepo, assetRepo, auditService);
  });

  describe('reportIncident', () => {
    it('creates an incident report', async () => {
      const asset = await assetService.createAsset({
        asset_type_id: droneTypeId,
        serial_number: 'VE-1001',
        manufacturer: 'Verge Aero',
        model: 'X1',
        typed_attributes: {},
      });

      const incident = await incidentService.reportIncident({
        asset_id: asset.id,
        reporter_id: reporterId,
        severity: 'functional',
        description: 'Propeller chipped during landing',
      });

      expect(incident.asset_id).toBe(asset.id);
      expect(incident.severity).toBe('functional');
      expect(incident.status).toBe('open');
    });

    it('auto-grounds drone on critical severity', async () => {
      const asset = await assetService.createAsset({
        asset_type_id: droneTypeId,
        serial_number: 'VE-1002',
        manufacturer: 'Verge Aero',
        model: 'X1',
        typed_attributes: {},
      });

      await incidentService.reportIncident({
        asset_id: asset.id,
        reporter_id: reporterId,
        severity: 'critical',
        description: 'Motor failure mid-flight',
      });

      const updated = await assetRepo.findById(asset.id);
      expect(updated?.status).toBe('maintenance');
    });

    it('creates audit event when auto-grounding', async () => {
      const asset = await assetService.createAsset({
        asset_type_id: droneTypeId,
        serial_number: 'VE-1003',
        manufacturer: 'Verge Aero',
        model: 'X1',
        typed_attributes: {},
      });

      await incidentService.reportIncident({
        asset_id: asset.id,
        reporter_id: reporterId,
        severity: 'critical',
        description: 'Critical issue',
      });

      const auditEvents = await auditRepo.findByAssetId(asset.id);
      expect(auditEvents).toHaveLength(1);
      expect(auditEvents[0]?.new_value).toBe('maintenance');
    });

    it('does not change asset status for non-critical severity', async () => {
      const asset = await assetService.createAsset({
        asset_type_id: droneTypeId,
        serial_number: 'VE-1004',
        manufacturer: 'Verge Aero',
        model: 'X1',
        typed_attributes: {},
      });

      await incidentService.reportIncident({
        asset_id: asset.id,
        reporter_id: reporterId,
        severity: 'cosmetic',
        description: 'Minor scratch',
      });

      const updated = await assetRepo.findById(asset.id);
      expect(updated?.status).toBe('available');
    });

    it('validates input with Zod', async () => {
      await expect(
        incidentService.reportIncident({
          asset_id: 'not-a-uuid',
          reporter_id: reporterId,
          severity: 'functional',
          description: 'Test',
        }),
      ).rejects.toThrow();
    });
  });

  describe('resolveIncident', () => {
    it('marks an incident as resolved', async () => {
      const asset = await assetService.createAsset({
        asset_type_id: droneTypeId,
        serial_number: 'VE-1010',
        manufacturer: 'Verge Aero',
        model: 'X1',
        typed_attributes: {},
      });

      const incident = await incidentService.reportIncident({
        asset_id: asset.id,
        reporter_id: reporterId,
        severity: 'functional',
        description: 'Issue',
      });

      const resolved = await incidentService.resolveIncident(
        incident.id,
        'Replaced propeller',
      );

      expect(resolved.status).toBe('resolved');
      expect(resolved.resolution_notes).toBe('Replaced propeller');
    });

    it('throws for unknown incident id', async () => {
      await expect(
        incidentService.resolveIncident(crypto.randomUUID(), 'Fixed'),
      ).rejects.toThrow('Incident not found');
    });
  });

  describe('listIncidents', () => {
    it('returns all incidents', async () => {
      const asset = await assetService.createAsset({
        asset_type_id: droneTypeId,
        serial_number: 'VE-1020',
        manufacturer: 'Verge Aero',
        model: 'X1',
        typed_attributes: {},
      });

      await incidentService.reportIncident({
        asset_id: asset.id,
        reporter_id: reporterId,
        severity: 'cosmetic',
        description: 'Scratch',
      });
      await incidentService.reportIncident({
        asset_id: asset.id,
        reporter_id: reporterId,
        severity: 'functional',
        description: 'Crack',
      });

      const all = await incidentService.listIncidents();
      expect(all).toHaveLength(2);
    });
  });

  describe('getIncident', () => {
    it('returns a single incident by id', async () => {
      const asset = await assetService.createAsset({
        asset_type_id: droneTypeId,
        serial_number: 'VE-1030',
        manufacturer: 'Verge Aero',
        model: 'X1',
        typed_attributes: {},
      });

      const created = await incidentService.reportIncident({
        asset_id: asset.id,
        reporter_id: reporterId,
        severity: 'functional',
        description: 'Test',
      });

      const found = await incidentService.getIncident(created.id);
      expect(found?.id).toBe(created.id);
    });
  });

  describe('getAssetIncidents', () => {
    it('returns incidents for a specific asset', async () => {
      const asset1 = await assetService.createAsset({
        asset_type_id: droneTypeId,
        serial_number: 'VE-1040',
        manufacturer: 'Verge Aero',
        model: 'X1',
        typed_attributes: {},
      });
      const asset2 = await assetService.createAsset({
        asset_type_id: droneTypeId,
        serial_number: 'VE-1041',
        manufacturer: 'Verge Aero',
        model: 'X1',
        typed_attributes: {},
      });

      await incidentService.reportIncident({
        asset_id: asset1.id,
        reporter_id: reporterId,
        severity: 'cosmetic',
        description: 'For asset 1',
      });
      await incidentService.reportIncident({
        asset_id: asset2.id,
        reporter_id: reporterId,
        severity: 'functional',
        description: 'For asset 2',
      });

      const results = await incidentService.getAssetIncidents(asset1.id);
      expect(results).toHaveLength(1);
      expect(results[0]?.asset_id).toBe(asset1.id);
    });
  });
});
