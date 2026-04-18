import { describe, it, expect } from 'vitest';
import {
  IncidentSchema,
  IncidentSeverity,
  IncidentStatus,
  CreateIncidentInputSchema,
  UpdateIncidentInputSchema,
} from '../incident';

describe('Incident model', () => {
  const validIncident = {
    id: crypto.randomUUID(),
    asset_id: crypto.randomUUID(),
    reporter_id: crypto.randomUUID(),
    severity: 'functional' as const,
    description: 'Propeller blade chipped during landing',
    status: 'open' as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  describe('IncidentSeverity', () => {
    it('has correct enum values', () => {
      expect(IncidentSeverity.options).toEqual([
        'cosmetic',
        'functional',
        'critical',
      ]);
    });
  });

  describe('IncidentStatus', () => {
    it('has correct enum values', () => {
      expect(IncidentStatus.options).toEqual([
        'open',
        'resolved',
        'maintenance_created',
      ]);
    });
  });

  describe('IncidentSchema', () => {
    it('parses a valid incident', () => {
      const result = IncidentSchema.safeParse(validIncident);
      expect(result.success).toBe(true);
    });

    it('accepts optional booking_id', () => {
      const result = IncidentSchema.safeParse({
        ...validIncident,
        booking_id: crypto.randomUUID(),
      });
      expect(result.success).toBe(true);
    });

    it('accepts optional photo_url', () => {
      const result = IncidentSchema.safeParse({
        ...validIncident,
        photo_url: 'https://example.com/photo.jpg',
      });
      expect(result.success).toBe(true);
    });

    it('accepts optional resolution_notes', () => {
      const result = IncidentSchema.safeParse({
        ...validIncident,
        resolution_notes: 'Propeller replaced',
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid severity', () => {
      const result = IncidentSchema.safeParse({
        ...validIncident,
        severity: 'minor',
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid status', () => {
      const result = IncidentSchema.safeParse({
        ...validIncident,
        status: 'closed',
      });
      expect(result.success).toBe(false);
    });

    it('rejects missing description', () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { description: _, ...noDesc } = validIncident;
      const result = IncidentSchema.safeParse(noDesc);
      expect(result.success).toBe(false);
    });

    it('rejects missing asset_id', () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { asset_id: _, ...noAsset } = validIncident;
      const result = IncidentSchema.safeParse(noAsset);
      expect(result.success).toBe(false);
    });
  });

  describe('CreateIncidentInputSchema', () => {
    it('parses valid create input', () => {
      const result = CreateIncidentInputSchema.safeParse({
        asset_id: crypto.randomUUID(),
        reporter_id: crypto.randomUUID(),
        severity: 'critical',
        description: 'Motor failure mid-flight',
      });
      expect(result.success).toBe(true);
    });

    it('accepts optional booking_id', () => {
      const result = CreateIncidentInputSchema.safeParse({
        asset_id: crypto.randomUUID(),
        reporter_id: crypto.randomUUID(),
        severity: 'cosmetic',
        description: 'Minor scratch on shell',
        booking_id: crypto.randomUUID(),
      });
      expect(result.success).toBe(true);
    });

    it('accepts optional photo_url', () => {
      const result = CreateIncidentInputSchema.safeParse({
        asset_id: crypto.randomUUID(),
        reporter_id: crypto.randomUUID(),
        severity: 'cosmetic',
        description: 'Scratch',
        photo_url: 'https://example.com/img.png',
      });
      expect(result.success).toBe(true);
    });

    it('rejects missing severity', () => {
      const result = CreateIncidentInputSchema.safeParse({
        asset_id: crypto.randomUUID(),
        reporter_id: crypto.randomUUID(),
        description: 'Something broke',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('UpdateIncidentInputSchema', () => {
    it('parses status update', () => {
      const result = UpdateIncidentInputSchema.safeParse({
        status: 'resolved',
      });
      expect(result.success).toBe(true);
    });

    it('parses resolution_notes update', () => {
      const result = UpdateIncidentInputSchema.safeParse({
        resolution_notes: 'Replaced propeller',
      });
      expect(result.success).toBe(true);
    });

    it('allows empty partial update', () => {
      const result = UpdateIncidentInputSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });
});
