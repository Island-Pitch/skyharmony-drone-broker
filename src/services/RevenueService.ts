/** Revenue summary data shape. */
export interface RevenueSummary {
  total_revenue: number;
  allocation_fee_revenue: number;
  standby_fee_revenue: number;
  pending_invoices: number;
}

/** Per-operator revenue breakdown entry (SHD-52). */
export interface OperatorRevenue {
  operator_name: string;
  allocation_fee: number;
  standby_fee: number;
  insurance_pool: number;
  total: number;
}

/**
 * Service providing mock revenue data for the admin dashboard.
 * In production this would call a billing/invoicing API.
 */
export class RevenueService {
  async getSummary(): Promise<RevenueSummary> {
    return {
      total_revenue: 284_500,
      allocation_fee_revenue: 198_150,
      standby_fee_revenue: 86_350,
      pending_invoices: 12,
    };
  }

  /** Per-operator revenue split with insurance pool contributions (SHD-52). */
  async getOperatorBreakdown(): Promise<OperatorRevenue[]> {
    return [
      { operator_name: 'NightBrite Drones', allocation_fee: 54_000, standby_fee: 22_000, insurance_pool: 5_500, total: 81_500 },
      { operator_name: 'Orion Skies', allocation_fee: 46_000, standby_fee: 19_000, insurance_pool: 4_750, total: 69_750 },
      { operator_name: 'Vegas Drone Works', allocation_fee: 42_150, standby_fee: 18_350, insurance_pool: 4_250, total: 64_750 },
      { operator_name: 'Patriotic Air', allocation_fee: 32_000, standby_fee: 15_000, insurance_pool: 3_500, total: 50_500 },
      { operator_name: 'Sky Harmony Fleet', allocation_fee: 10_000, standby_fee: 6_000, insurance_pool: 2_000, total: 18_000 },
    ];
  }
}
