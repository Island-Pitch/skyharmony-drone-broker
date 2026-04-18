import { useState, useEffect, useCallback } from 'react';
import { apiGet, apiPost } from '@/data/repositories/http/apiClient';

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface Invoice {
  id: string;
  booking_id: string | null;
  operator_id: string | null;
  operator_name: string | null;
  status: string;
  line_items: InvoiceLineItem[];
  subtotal: string;
  tax: string;
  total: string;
  due_date: string | null;
  paid_date: string | null;
  payment_method: string | null;
  stripe_payment_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface InvoiceSummary {
  total_billed: number;
  total_paid: number;
  total_outstanding: number;
  invoice_count: number;
}

export function useInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [summary, setSummary] = useState<InvoiceSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const [invoiceRes, summaryRes] = await Promise.all([
        apiGet<Invoice[]>('/invoices'),
        apiGet<InvoiceSummary>('/invoices/summary'),
      ]);
      setInvoices(invoiceRes.data);
      setSummary(summaryRes.data);
    } catch {
      // Silently fail — demo mode may not have API
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshInvoices();
  }, [refreshInvoices]);

  const generateInvoice = useCallback(
    async (bookingId: string) => {
      const res = await apiPost<Invoice>(`/invoices/generate/${bookingId}`, {});
      await refreshInvoices();
      return res.data;
    },
    [refreshInvoices],
  );

  const payInvoice = useCallback(
    async (invoiceId: string, paymentMethod: string = 'credit_card') => {
      const res = await apiPost<Invoice>(`/invoices/${invoiceId}/pay`, {
        payment_method: paymentMethod,
      });
      await refreshInvoices();
      return res.data;
    },
    [refreshInvoices],
  );

  return { invoices, summary, loading, generateInvoice, payInvoice, refreshInvoices };
}
