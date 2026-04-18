/** Revenue summary data shape. */
export interface RevenueSummary {
  total_revenue: number;
  allocation_fee_revenue: number;
  standby_fee_revenue: number;
  pending_invoices: number;
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
}
