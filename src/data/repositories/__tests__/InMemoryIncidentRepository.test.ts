import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryIncidentRepository } from '../InMemoryIncidentRepository';
import { store } from '@/data/store';

describe('InMemoryIncidentRepository', () => {
  let repo: InMemoryIncidentRepository;
  const assetId = crypto.randomUUID();
  const reporterId = crypto.randomUUID();

  beforeEach(() => {
    store.reset();
    repo = new InMemoryIncidentRepository();
  });

  describe('create', () => {
    it('creates an incident with generated id and timestamps', async () => {
      const incident = await repo.create({
        asset_id: assetId,
        reporter_id: reporterId,
        severity: 'functional',
        description: 'Propeller chipped',
      });

      expect(incident.id).toBeDefined();
      expect(incident.asset_id).toBe(assetId);
      expect(incident.reporter_id).toBe(reporterId);
      expect(incident.severity).toBe('functional');
      expect(incident.description).toBe('Propeller chipped');
      expect(incident.status).toBe('open');
      expect(incident.created_at).toBeDefined();
      expect(incident.updated_at).toBeDefined();
    });

    it('stores the incident in the store', async () => {
      const incident = await repo.create({
        asset_id: assetId,
        reporter_id: reporterId,
        severity: 'cosmetic',
        description: 'Scratch',
      });

      expect(store.incidents.get(incident.id)).toEqual(incident);
    });

    it('accepts optional booking_id and photo_url', async () => {
      const bookingId = crypto.randomUUID();
      const incident = await repo.create({
        asset_id: assetId,
        reporter_id: reporterId,
        severity: 'critical',
        description: 'Motor failure',
        booking_id: bookingId,
        photo_url: 'https://example.com/photo.jpg',
      });

      expect(incident.booking_id).toBe(bookingId);
      expect(incident.photo_url).toBe('https://example.com/photo.jpg');
    });
  });

  describe('findById', () => {
    it('returns an incident by id', async () => {
      const created = await repo.create({
        asset_id: assetId,
        reporter_id: reporterId,
        severity: 'functional',
        description: 'Test',
      });

      const found = await repo.findById(created.id);
      expect(found).toEqual(created);
    });

    it('returns undefined for unknown id', async () => {
      const found = await repo.findById(crypto.randomUUID());
      expect(found).toBeUndefined();
    });
  });

  describe('findAll', () => {
    it('returns all incidents', async () => {
      await repo.create({
        asset_id: assetId,
        reporter_id: reporterId,
        severity: 'cosmetic',
        description: 'One',
      });
      await repo.create({
        asset_id: assetId,
        reporter_id: reporterId,
        severity: 'critical',
        description: 'Two',
      });

      const all = await repo.findAll();
      expect(all).toHaveLength(2);
    });
  });

  describe('findByAssetId', () => {
    it('returns incidents for a specific asset', async () => {
      const otherAssetId = crypto.randomUUID();
      await repo.create({
        asset_id: assetId,
        reporter_id: reporterId,
        severity: 'cosmetic',
        description: 'For target asset',
      });
      await repo.create({
        asset_id: otherAssetId,
        reporter_id: reporterId,
        severity: 'functional',
        description: 'For other asset',
      });

      const results = await repo.findByAssetId(assetId);
      expect(results).toHaveLength(1);
      expect(results[0]?.asset_id).toBe(assetId);
    });
  });

  describe('findBySeverity', () => {
    it('filters by severity', async () => {
      await repo.create({
        asset_id: assetId,
        reporter_id: reporterId,
        severity: 'critical',
        description: 'Critical issue',
      });
      await repo.create({
        asset_id: assetId,
        reporter_id: reporterId,
        severity: 'cosmetic',
        description: 'Minor scratch',
      });

      const critical = await repo.findBySeverity('critical');
      expect(critical).toHaveLength(1);
      expect(critical[0]?.severity).toBe('critical');
    });
  });

  describe('findByStatus', () => {
    it('filters by status', async () => {
      const incident = await repo.create({
        asset_id: assetId,
        reporter_id: reporterId,
        severity: 'functional',
        description: 'Issue',
      });

      const openIncidents = await repo.findByStatus('open');
      expect(openIncidents).toHaveLength(1);

      await repo.update(incident.id, { status: 'resolved' });

      const stillOpen = await repo.findByStatus('open');
      expect(stillOpen).toHaveLength(0);

      const resolved = await repo.findByStatus('resolved');
      expect(resolved).toHaveLength(1);
    });
  });

  describe('update', () => {
    it('updates incident fields', async () => {
      const incident = await repo.create({
        asset_id: assetId,
        reporter_id: reporterId,
        severity: 'functional',
        description: 'Test',
      });

      const updated = await repo.update(incident.id, {
        status: 'resolved',
        resolution_notes: 'Fixed the issue',
      });

      expect(updated.status).toBe('resolved');
      expect(updated.resolution_notes).toBe('Fixed the issue');
      expect(updated.updated_at).toBeDefined();
    });

    it('throws for unknown id', async () => {
      await expect(
        repo.update(crypto.randomUUID(), { status: 'resolved' }),
      ).rejects.toThrow('Incident not found');
    });
  });

  describe('reset', () => {
    it('clears all incidents', async () => {
      await repo.create({
        asset_id: assetId,
        reporter_id: reporterId,
        severity: 'cosmetic',
        description: 'Test',
      });

      repo.reset();
      const all = await repo.findAll();
      expect(all).toHaveLength(0);
    });
  });
});
