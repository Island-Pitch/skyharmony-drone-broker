import type { Asset } from '@/data/models/asset';
import type { Booking } from '@/data/models/booking';
import type { IAssetRepository } from '@/data/repositories/interfaces';
import type { IBookingRepository } from '@/data/repositories/InMemoryBookingRepository';
import type { AuditService } from './AuditService';
import type { BookingService } from './BookingService';

/** Result of conflict detection for a booking. */
export interface ConflictResult {
  conflicts: Asset[];
  available: Asset[];
  shortfall: number;
}

/** A suggested alternative date with availability info. */
export interface AlternativeDate {
  date: string;
  availableCount: number;
}

/** Result of an allocation execution. */
export interface AllocationResult {
  allocated: Asset[];
  shortfall: number;
  alternatives?: AlternativeDate[];
}

/** Drone type ID used in seed data. */
const DRONE_TYPE_ID = '00000000-0000-4000-8000-000000000001';

/**
 * Allocation engine: availability queries, conflict detection,
 * alternative date suggestions, and deterministic allocation execution.
 */
export class AllocationService {
  constructor(
    private readonly assetRepo: IAssetRepository,
    private readonly bookingRepo: IBookingRepository,
    private readonly bookingService: BookingService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Returns drones with status "available" that are not allocated to any
   * booking overlapping the given date range. Only considers drones
   * (asset_type_id === DRONE_TYPE_ID).
   */
  async getAvailableDrones(date: string, endDate?: string): Promise<Asset[]> {
    const allDrones = (await this.assetRepo.findAll()).filter(
      (a) => a.asset_type_id === DRONE_TYPE_ID,
    );

    // Drones that aren't in an allocatable status
    const candidateDrones = allDrones.filter(
      (a) => a.status === 'available',
    );

    // Find all asset IDs that are allocated to overlapping bookings
    const allocatedIds = await this.getAllocatedAssetIdsForDateRange(date, endDate);

    return candidateDrones
      .filter((d) => !allocatedIds.has(d.id))
      .sort((a, b) => a.serial_number.localeCompare(b.serial_number));
  }

  /**
   * Detects conflicts for a booking: checks if any drones in the booking's
   * allocated_assets overlap with other bookings for the same dates.
   */
  async detectConflicts(bookingId: string): Promise<ConflictResult> {
    const booking = await this.bookingRepo.findById(bookingId);
    if (!booking) {
      throw new Error(`Booking not found: ${bookingId}`);
    }

    if (booking.allocated_assets.length === 0) {
      return { conflicts: [], available: [], shortfall: booking.drone_count };
    }

    // Find all other bookings that overlap this booking's dates
    const allBookings = await this.bookingRepo.findAll();
    const overlapping = allBookings.filter(
      (b) =>
        b.id !== bookingId &&
        this.isActiveBooking(b) &&
        this.datesOverlap(booking, b),
    );

    // Collect all asset IDs allocated to overlapping bookings
    const conflictingIds = new Set<string>();
    for (const ob of overlapping) {
      for (const assetId of ob.allocated_assets) {
        conflictingIds.add(assetId);
      }
    }

    const conflicts: Asset[] = [];
    const available: Asset[] = [];

    for (const assetId of booking.allocated_assets) {
      const asset = await this.assetRepo.findById(assetId);
      if (!asset) continue;

      if (conflictingIds.has(assetId)) {
        conflicts.push(asset);
      } else {
        available.push(asset);
      }
    }

    // Sort deterministically
    conflicts.sort((a, b) => a.serial_number.localeCompare(b.serial_number));
    available.sort((a, b) => a.serial_number.localeCompare(b.serial_number));

    const shortfall = Math.max(0, booking.drone_count - available.length);

    return { conflicts, available, shortfall };
  }

  /**
   * Scans +/- windowDays from the preferred date to find dates where enough
   * drones are available. Returns top 3 alternatives sorted by availability count (desc).
   */
  async suggestAlternativeDates(
    droneCount: number,
    preferredDate: string,
    windowDays = 14,
  ): Promise<AlternativeDate[]> {
    const preferred = new Date(preferredDate);
    const alternatives: AlternativeDate[] = [];

    for (let offset = -windowDays; offset <= windowDays; offset++) {
      if (offset === 0) continue; // skip the preferred date itself

      const candidate = new Date(preferred);
      candidate.setDate(candidate.getDate() + offset);
      const dateStr = candidate.toISOString();

      const available = await this.getAvailableDrones(dateStr);
      if (available.length >= droneCount) {
        alternatives.push({
          date: dateStr,
          availableCount: available.length,
        });
      }
    }

    // Sort by availability count descending, then by date ascending for determinism
    alternatives.sort((a, b) => {
      if (b.availableCount !== a.availableCount) {
        return b.availableCount - a.availableCount;
      }
      return a.date.localeCompare(b.date);
    });

    return alternatives.slice(0, 3);
  }

  /**
   * Allocates available drones to a booking. Updates asset statuses to "allocated",
   * sets current_operator_id, populates booking.allocated_assets, and transitions
   * the booking to "allocated" status.
   *
   * Deterministic: drones are selected by serial_number sort order.
   * If not enough drones are available, performs partial allocation and
   * suggests alternative dates.
   */
  async allocate(bookingId: string, actorId: string): Promise<AllocationResult> {
    const booking = await this.bookingRepo.findById(bookingId);
    if (!booking) {
      throw new Error(`Booking not found: ${bookingId}`);
    }

    if (booking.status !== 'pending') {
      throw new Error(
        `Cannot allocate booking in '${booking.status}' status — must be 'pending'`,
      );
    }

    const availableDrones = await this.getAvailableDrones(
      booking.show_date,
      booking.end_date,
    );

    const toAllocate = availableDrones.slice(0, booking.drone_count);

    // Update each allocated drone
    for (const drone of toAllocate) {
      await this.assetRepo.update(drone.id, {
        status: 'allocated',
        current_operator_id: booking.operator_id,
      });
      await this.auditService.recordStatusChange(
        drone.id,
        'available',
        'allocated',
        actorId,
      );
    }

    // Update booking with allocated asset IDs
    const allocatedIds = toAllocate.map((d) => d.id);
    await this.bookingRepo.update(bookingId, {
      allocated_assets: allocatedIds,
    });

    // Transition booking to allocated
    await this.bookingService.transition(bookingId, 'allocated');

    const shortfall = Math.max(0, booking.drone_count - toAllocate.length);
    const result: AllocationResult = {
      allocated: toAllocate,
      shortfall,
    };

    // If shortfall, suggest alternatives
    if (shortfall > 0) {
      result.alternatives = await this.suggestAlternativeDates(
        booking.drone_count,
        booking.show_date,
      );
    }

    return result;
  }

  // --- Private helpers ---

  /** Get the set of asset IDs allocated to bookings overlapping a date range. */
  private async getAllocatedAssetIdsForDateRange(
    date: string,
    endDate?: string,
  ): Promise<Set<string>> {
    const allBookings = await this.bookingRepo.findAll();
    const ids = new Set<string>();

    const rangeBooking = {
      show_date: date,
      end_date: endDate,
    } as Pick<Booking, 'show_date' | 'end_date'>;

    for (const booking of allBookings) {
      if (
        this.isActiveBooking(booking) &&
        this.datesOverlap(rangeBooking, booking)
      ) {
        for (const assetId of booking.allocated_assets) {
          ids.add(assetId);
        }
      }
    }

    return ids;
  }

  /** A booking is "active" if it's in a state where its assets are occupied. */
  private isActiveBooking(booking: Booking): boolean {
    return ['pending', 'allocated', 'confirmed'].includes(booking.status);
  }

  /**
   * Two date ranges overlap if one starts before the other ends and vice versa.
   * If end_date is not set, it's treated as same-day (show_date only).
   */
  private datesOverlap(
    a: Pick<Booking, 'show_date' | 'end_date'>,
    b: Pick<Booking, 'show_date' | 'end_date'>,
  ): boolean {
    const aStart = new Date(a.show_date).getTime();
    const aEnd = a.end_date
      ? new Date(a.end_date).getTime()
      : aStart + 24 * 60 * 60 * 1000; // default 1 day

    const bStart = new Date(b.show_date).getTime();
    const bEnd = b.end_date
      ? new Date(b.end_date).getTime()
      : bStart + 24 * 60 * 60 * 1000;

    return aStart < bEnd && bStart < aEnd;
  }
}
