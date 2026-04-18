import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { InvoiceDetail } from '../InvoiceDetail';
import { AuthProvider } from '@/auth/AuthContext';
import { Role } from '@/auth/roles';
import type { Invoice } from '@/hooks/useInvoices';

const paidInvoice: Invoice = {
  id: 'inv-1',
  booking_id: 'bk-1',
  operator_id: 'op-1',
  operator_name: 'NightBrite Drones',
  status: 'paid',
  line_items: [
    { description: 'Drone allocation fee', quantity: 50, unit_price: 350, total: 17500 },
    { description: 'Drone insurance coverage', quantity: 1, unit_price: 1225, total: 1225 },
  ],
  subtotal: '18725',
  tax: '1591.63',
  total: '20316.63',
  due_date: '2026-05-01T00:00:00.000Z',
  paid_date: '2026-04-15T00:00:00.000Z',
  payment_method: 'credit_card',
  stripe_payment_id: null,
  created_at: '2026-04-01T00:00:00.000Z',
  updated_at: '2026-04-15T00:00:00.000Z',
};

const draftInvoice: Invoice = {
  ...paidInvoice,
  id: 'inv-2',
  status: 'draft',
  paid_date: null,
  payment_method: 'pending',
};

function renderWithAuth(ui: React.ReactElement, role: Role = Role.CentralRepoAdmin) {
  return render(<AuthProvider initialRole={role}>{ui}</AuthProvider>);
}

describe('InvoiceDetail', () => {
  it('renders line items table', () => {
    renderWithAuth(<InvoiceDetail invoice={paidInvoice} onPay={vi.fn()} onBack={vi.fn()} />);
    expect(screen.getByText('Drone allocation fee')).toBeInTheDocument();
    expect(screen.getByText('Drone insurance coverage')).toBeInTheDocument();
  });

  it('shows subtotal, tax, and total', () => {
    renderWithAuth(<InvoiceDetail invoice={paidInvoice} onPay={vi.fn()} onBack={vi.fn()} />);
    expect(screen.getByText('Subtotal')).toBeInTheDocument();
    expect(screen.getByText('Tax')).toBeInTheDocument();
    // "Total" appears in both the line items header and the footer
    expect(screen.getAllByText('Total').length).toBeGreaterThanOrEqual(2);
  });

  it('does not show payment button for paid invoices', () => {
    renderWithAuth(<InvoiceDetail invoice={paidInvoice} onPay={vi.fn()} onBack={vi.fn()} />);
    expect(screen.queryByText('Mark as Paid')).not.toBeInTheDocument();
  });

  it('shows payment button for unpaid invoices', () => {
    renderWithAuth(<InvoiceDetail invoice={draftInvoice} onPay={vi.fn()} onBack={vi.fn()} />);
    expect(screen.getByText('Mark as Paid')).toBeInTheDocument();
  });

  it('calls onPay when payment button is clicked', async () => {
    const onPay = vi.fn().mockResolvedValue(undefined);
    renderWithAuth(<InvoiceDetail invoice={draftInvoice} onPay={onPay} onBack={vi.fn()} />);
    fireEvent.click(screen.getByText('Mark as Paid'));
    await waitFor(() => {
      expect(onPay).toHaveBeenCalledWith('inv-2', 'credit_card');
    });
  });

  it('calls onBack when back button is clicked', () => {
    const onBack = vi.fn();
    renderWithAuth(<InvoiceDetail invoice={paidInvoice} onPay={vi.fn()} onBack={onBack} />);
    fireEvent.click(screen.getByText('Back to Invoices'));
    expect(onBack).toHaveBeenCalled();
  });

  it('shows invoice status transitions — draft displayed', () => {
    renderWithAuth(<InvoiceDetail invoice={draftInvoice} onPay={vi.fn()} onBack={vi.fn()} />);
    expect(screen.getByText('draft')).toBeInTheDocument();
  });

  it('renders Download Invoice button', () => {
    renderWithAuth(<InvoiceDetail invoice={paidInvoice} onPay={vi.fn()} onBack={vi.fn()} />);
    expect(screen.getByText('Download Invoice')).toBeInTheDocument();
  });

  it('renders Send to Operator button for admin on unpaid invoice', () => {
    renderWithAuth(
      <InvoiceDetail invoice={draftInvoice} onPay={vi.fn()} onBack={vi.fn()} />,
      Role.CentralRepoAdmin,
    );
    expect(screen.getByText('Send to Operator')).toBeInTheDocument();
  });

  it('hides Send to Operator button for non-admin', () => {
    renderWithAuth(
      <InvoiceDetail invoice={draftInvoice} onPay={vi.fn()} onBack={vi.fn()} />,
      Role.OperatorAdmin,
    );
    expect(screen.queryByText('Send to Operator')).not.toBeInTheDocument();
  });

  it('renders payment method radio buttons for unpaid invoices', () => {
    renderWithAuth(<InvoiceDetail invoice={draftInvoice} onPay={vi.fn()} onBack={vi.fn()} />);
    expect(screen.getByLabelText('Credit Card')).toBeInTheDocument();
    expect(screen.getByLabelText('ACH Transfer')).toBeInTheDocument();
    expect(screen.getByLabelText('Wire Transfer')).toBeInTheDocument();
  });

  it('selects wire transfer and calls onPay with correct method', async () => {
    const onPay = vi.fn().mockResolvedValue(undefined);
    renderWithAuth(<InvoiceDetail invoice={draftInvoice} onPay={onPay} onBack={vi.fn()} />);
    fireEvent.click(screen.getByLabelText('Wire Transfer'));
    fireEvent.click(screen.getByText('Mark as Paid'));
    await waitFor(() => {
      expect(onPay).toHaveBeenCalledWith('inv-2', 'wire');
    });
  });
});
