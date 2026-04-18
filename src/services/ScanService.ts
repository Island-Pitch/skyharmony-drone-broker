import type { Asset } from '@/data/models/asset';
import type { CustodyEvent } from '@/data/models/custody';
import type { IAssetRepository } from '@/data/repositories/interfaces';
import type { ICustodyRepository } from '@/data/repositories/InMemoryCustodyRepository';
import type { AuditService } from './AuditService';

export interface ScanCheckOutResult {
  asset: Asset;
  custodyEvent: CustodyEvent;
}

export interface ScanCheckInResult {
  asset: Asset;
  custodyEvent: CustodyEvent;
}

/** Orchestrates scan-based check-in/check-out for assets. */
export class ScanService {
  constructor(
    private readonly assetRepo: IAssetRepository,
    private readonly custodyRepo: ICustodyRepository,
    private readonly auditService: AuditService,
  ) {}

  /** Look up an asset by its serial number. */
  async lookupBySerial(serial: string): Promise<Asset | undefined> {
    const all = await this.assetRepo.findAll();
    return all.find(
      (a) => a.serial_number.toLowerCase() === serial.toLowerCase(),
    );
  }

  /** Check out an asset: validates status is available, changes to allocated, logs custody + audit events. */
  async checkOut(
    serialNumber: string,
    actorId: string,
    bookingId?: string,
  ): Promise<ScanCheckOutResult> {
    const asset = await this.lookupBySerial(serialNumber);
    if (!asset) {
      throw new Error(`Asset not found for serial: ${serialNumber}`);
    }

    if (asset.status !== 'available') {
      throw new Error(
        `Asset ${serialNumber} cannot be checked out — current status: ${asset.status}`,
      );
    }

    const updated = await this.assetRepo.update(asset.id, {
      status: 'allocated',
      current_operator_id: actorId,
    });

    await this.auditService.recordStatusChange(
      asset.id,
      'available',
      'allocated',
      actorId,
    );

    const custodyEvent = await this.custodyRepo.create({
      asset_id: asset.id,
      action: 'check_out',
      actor_id: actorId,
      booking_id: bookingId,
    });

    return { asset: updated, custodyEvent };
  }

  /** Check in an asset: changes status to available, logs custody + audit events. */
  async checkIn(
    serialNumber: string,
    actorId: string,
  ): Promise<ScanCheckInResult> {
    const asset = await this.lookupBySerial(serialNumber);
    if (!asset) {
      throw new Error(`Asset not found for serial: ${serialNumber}`);
    }

    if (asset.status !== 'allocated') {
      throw new Error(
        `Asset ${serialNumber} cannot be checked in — current status: ${asset.status}`,
      );
    }

    const updated = await this.assetRepo.update(asset.id, {
      status: 'available',
      current_operator_id: null,
    });

    await this.auditService.recordStatusChange(
      asset.id,
      'allocated',
      'available',
      actorId,
    );

    const custodyEvent = await this.custodyRepo.create({
      asset_id: asset.id,
      action: 'check_in',
      actor_id: actorId,
    });

    return { asset: updated, custodyEvent };
  }

  /** Get all custody events for an asset. */
  async getCustodyHistory(assetId: string): Promise<CustodyEvent[]> {
    return this.custodyRepo.findByAssetId(assetId);
  }

  /** Get all custody events for a booking. */
  async getBookingCustody(bookingId: string): Promise<CustodyEvent[]> {
    return this.custodyRepo.findByBookingId(bookingId);
  }
}
