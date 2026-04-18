import { describe, it, expect, beforeEach } from 'vitest';
import { MaintenanceService } from '../MaintenanceService';
import { InMemoryAssetRepository } from '@/data/repositories/InMemoryAssetRepository';
import { store } from '@/data/store';
import { seedStore } from '@/data/seed';
import { createMockAsset, createMockAssetType } from '@/test/helpers';

describe('MaintenanceService', () => {
  let service: MaintenanceService;

  beforeEach(() => {
    store.reset();
  });

  it('detects high flight hours warning', async () => {
    const assetType = createMockAssetType();
    store.assetTypes.set(assetType.id, assetType);
    const asset = createMockAsset(assetType.id, { flight_hours: 1850, firmware_version: '1.0.0' });
    store.assets.set(asset.id, asset);

    service = new MaintenanceService(new InMemoryAssetRepository());
    const alerts = await service.getAlerts();

    const flightAlert = alerts.find(
      (a) => a.asset_id === asset.id && a.category === 'flight_hours',
    );
    expect(flightAlert).toBeDefined();
    expect(flightAlert?.severity).toBe('warning');
  });

  it('detects critical flight hours', async () => {
    const assetType = createMockAssetType();
    store.assetTypes.set(assetType.id, assetType);
    const asset = createMockAsset(assetType.id, { flight_hours: 1960, firmware_version: '1.0.0' });
    store.assets.set(asset.id, asset);

    service = new MaintenanceService(new InMemoryAssetRepository());
    const alerts = await service.getAlerts();

    const flightAlert = alerts.find(
      (a) => a.asset_id === asset.id && a.category === 'flight_hours',
    );
    expect(flightAlert).toBeDefined();
    expect(flightAlert?.severity).toBe('critical');
  });

  it('detects high battery cycles warning', async () => {
    const assetType = createMockAssetType();
    store.assetTypes.set(assetType.id, assetType);
    const asset = createMockAsset(assetType.id, { battery_cycles: 460, firmware_version: '1.0.0' });
    store.assets.set(asset.id, asset);

    service = new MaintenanceService(new InMemoryAssetRepository());
    const alerts = await service.getAlerts();

    const batteryAlert = alerts.find(
      (a) => a.asset_id === asset.id && a.category === 'battery_cycles',
    );
    expect(batteryAlert).toBeDefined();
    expect(batteryAlert?.severity).toBe('warning');
  });

  it('detects critical battery cycles', async () => {
    const assetType = createMockAssetType();
    store.assetTypes.set(assetType.id, assetType);
    const asset = createMockAsset(assetType.id, { battery_cycles: 495, firmware_version: '1.0.0' });
    store.assets.set(asset.id, asset);

    service = new MaintenanceService(new InMemoryAssetRepository());
    const alerts = await service.getAlerts();

    const batteryAlert = alerts.find(
      (a) => a.asset_id === asset.id && a.category === 'battery_cycles',
    );
    expect(batteryAlert).toBeDefined();
    expect(batteryAlert?.severity).toBe('critical');
  });

  it('detects outdated firmware', async () => {
    const assetType = createMockAssetType();
    store.assetTypes.set(assetType.id, assetType);
    const asset1 = createMockAsset(assetType.id, { firmware_version: '2.0.0' });
    const asset2 = createMockAsset(assetType.id, { firmware_version: '1.0.0' });
    store.assets.set(asset1.id, asset1);
    store.assets.set(asset2.id, asset2);

    service = new MaintenanceService(new InMemoryAssetRepository());
    const alerts = await service.getAlerts();

    const fwAlert = alerts.find(
      (a) => a.asset_id === asset2.id && a.category === 'firmware',
    );
    expect(fwAlert).toBeDefined();
    expect(fwAlert?.severity).toBe('warning');
  });

  it('excludes retired assets', async () => {
    const assetType = createMockAssetType();
    store.assetTypes.set(assetType.id, assetType);
    const asset = createMockAsset(assetType.id, {
      status: 'retired',
      flight_hours: 1999,
      firmware_version: '1.0.0',
    });
    store.assets.set(asset.id, asset);

    service = new MaintenanceService(new InMemoryAssetRepository());
    const alerts = await service.getAlerts();

    expect(alerts.find((a) => a.asset_id === asset.id)).toBeUndefined();
  });

  it('sorts critical alerts before warnings', async () => {
    const assetType = createMockAssetType();
    store.assetTypes.set(assetType.id, assetType);
    const warningAsset = createMockAsset(assetType.id, { flight_hours: 1850, firmware_version: '1.0.0' });
    const criticalAsset = createMockAsset(assetType.id, { flight_hours: 1960, firmware_version: '1.0.0' });
    store.assets.set(warningAsset.id, warningAsset);
    store.assets.set(criticalAsset.id, criticalAsset);

    service = new MaintenanceService(new InMemoryAssetRepository());
    const alerts = await service.getAlerts();

    // Filter to just flight_hours alerts
    const flightAlerts = alerts.filter((a) => a.category === 'flight_hours');
    if (flightAlerts.length >= 2) {
      expect(flightAlerts[0]?.severity).toBe('critical');
    }
  });

  it('generates alerts from seeded data', async () => {
    seedStore();
    service = new MaintenanceService(new InMemoryAssetRepository());
    const alerts = await service.getAlerts();

    // With 500 drones, there should be some alerts
    expect(alerts.length).toBeGreaterThan(0);
  });
});
