import type { Asset } from '@/data/models/asset';
import type { IAssetRepository } from '@/data/repositories/interfaces';

export type AlertSeverity = 'warning' | 'critical';

export interface MaintenanceAlert {
  asset_id: string;
  serial_number: string;
  manufacturer: string;
  model: string;
  category: 'flight_hours' | 'battery_cycles' | 'firmware';
  severity: AlertSeverity;
  message: string;
  current_value: string;
  threshold: string;
}

const FLIGHT_HOURS_WARNING = 1800;
const FLIGHT_HOURS_CRITICAL = 1950;
const BATTERY_CYCLES_WARNING = 450;
const BATTERY_CYCLES_CRITICAL = 490;

/**
 * Scans fleet assets for maintenance conditions and generates alerts.
 * Checks flight hours, battery cycles, and firmware version drift.
 */
export class MaintenanceService {
  constructor(private readonly assetRepo: IAssetRepository) {}

  async getAlerts(): Promise<MaintenanceAlert[]> {
    const assets = await this.assetRepo.findAll();
    const alerts: MaintenanceAlert[] = [];

    // Determine latest firmware version across fleet
    const firmwareVersions = new Map<string, number>();
    for (const asset of assets) {
      if (asset.firmware_version) {
        const count = firmwareVersions.get(asset.firmware_version) ?? 0;
        firmwareVersions.set(asset.firmware_version, count + 1);
      }
    }
    const latestFirmware = this.findLatestFirmware(firmwareVersions);

    for (const asset of assets) {
      if (asset.status === 'retired') continue;

      this.checkFlightHours(asset, alerts);
      this.checkBatteryCycles(asset, alerts);
      this.checkFirmware(asset, latestFirmware, alerts);
    }

    // Sort: critical first, then warning
    alerts.sort((a, b) => {
      if (a.severity === b.severity) return 0;
      return a.severity === 'critical' ? -1 : 1;
    });

    return alerts;
  }

  private checkFlightHours(asset: Asset, alerts: MaintenanceAlert[]): void {
    if (asset.flight_hours == null) return;

    if (asset.flight_hours >= FLIGHT_HOURS_CRITICAL) {
      alerts.push({
        asset_id: asset.id,
        serial_number: asset.serial_number,
        manufacturer: asset.manufacturer,
        model: asset.model,
        category: 'flight_hours',
        severity: 'critical',
        message: `Flight hours at ${asset.flight_hours} — limit is 2000`,
        current_value: String(asset.flight_hours),
        threshold: '2000',
      });
    } else if (asset.flight_hours >= FLIGHT_HOURS_WARNING) {
      alerts.push({
        asset_id: asset.id,
        serial_number: asset.serial_number,
        manufacturer: asset.manufacturer,
        model: asset.model,
        category: 'flight_hours',
        severity: 'warning',
        message: `Flight hours at ${asset.flight_hours} — approaching 2000 limit`,
        current_value: String(asset.flight_hours),
        threshold: '2000',
      });
    }
  }

  private checkBatteryCycles(asset: Asset, alerts: MaintenanceAlert[]): void {
    if (asset.battery_cycles == null) return;

    if (asset.battery_cycles >= BATTERY_CYCLES_CRITICAL) {
      alerts.push({
        asset_id: asset.id,
        serial_number: asset.serial_number,
        manufacturer: asset.manufacturer,
        model: asset.model,
        category: 'battery_cycles',
        severity: 'critical',
        message: `Battery cycles at ${asset.battery_cycles} — limit is 500`,
        current_value: String(asset.battery_cycles),
        threshold: '500',
      });
    } else if (asset.battery_cycles >= BATTERY_CYCLES_WARNING) {
      alerts.push({
        asset_id: asset.id,
        serial_number: asset.serial_number,
        manufacturer: asset.manufacturer,
        model: asset.model,
        category: 'battery_cycles',
        severity: 'warning',
        message: `Battery cycles at ${asset.battery_cycles} — approaching 500 limit`,
        current_value: String(asset.battery_cycles),
        threshold: '500',
      });
    }
  }

  private checkFirmware(
    asset: Asset,
    latestFirmware: string | null,
    alerts: MaintenanceAlert[],
  ): void {
    if (!asset.firmware_version || !latestFirmware) return;
    if (asset.firmware_version === latestFirmware) return;

    alerts.push({
      asset_id: asset.id,
      serial_number: asset.serial_number,
      manufacturer: asset.manufacturer,
      model: asset.model,
      category: 'firmware',
      severity: 'warning',
      message: `Firmware ${asset.firmware_version} differs from latest ${latestFirmware}`,
      current_value: asset.firmware_version,
      threshold: latestFirmware,
    });
  }

  /** Find the firmware version with the highest semantic version number. */
  private findLatestFirmware(versions: Map<string, number>): string | null {
    let latest: string | null = null;
    let latestParts: number[] = [];

    for (const version of versions.keys()) {
      const parts = version.split('.').map(Number);
      if (!latest || this.compareVersions(parts, latestParts) > 0) {
        latest = version;
        latestParts = parts;
      }
    }

    return latest;
  }

  private compareVersions(a: number[], b: number[]): number {
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      const av = a[i] ?? 0;
      const bv = b[i] ?? 0;
      if (av !== bv) return av - bv;
    }
    return 0;
  }
}
