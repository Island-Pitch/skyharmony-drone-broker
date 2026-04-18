import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { InvoiceList } from '../InvoiceList';
import type { Invoice } from '@/hooks/useInvoices';

const mockInvoices: Invoice[] = [
  {
    id: 'inv-1',
    booking_id: 'bk-1',
    operator_id: 'op-1',
    operator_name: 'NightBrite Drones',
    status: 'paid',
    line_items: [
      { description: 'Drone allocation fee', quantity: 50, unit_price: 350, total: 17500 },
    ],
    subtotal: '17500',
    tax: '1487.50',
    total: '18987.50',
    due_date: '2026-05-01T00:00:00.000Z',
    paid_date: '2026-04-15T00:00:00.000Z',
    payment_method: 'credit_card',
    stripe_payment_id: null,
    created_at: '2026-04-01T00:00:00.000Z',
    updated_at: '2026-04-15T00:00:00.000Z',
  },
  {
    id: 'inv-2',
    booking_id: 'bk-2',
    operator_id: 'op-2',
    operator_name: 'Orion Skies',
    status: 'draft',
    line_items: [
      { description: 'Drone allocation fee', quantity: 80, unit_price: 350, total: 28000 },
    ],
    subtotal: '28000',
    tax: '2380',
    total: '30380',
    due_date: '2026-06-01T00:00:00.000Z',
    paid_date: null,
    payment_method: 'pending',
    stripe_payment_id: null,
    created_at: '2026-04-10T00:00:00.000Z',
    updated_at: '2026-04-10T00:00:00.000Z',
  },
  {
    id: 'inv-3',
    booking_id: 'bk-3',
    operator_id: 'op-1',
    operator_name: 'NightBrite Drones',
    status: 'overdue',
    line_items: [],
    subtotal: '5000',
    tax: '425',
    total: '5425',
    due_date: '2026-03-01T00:00:00.000Z',
    paid_date: null,
    payment_method: 'pending',
    stripe_payment_id: null,
    created_at: '2026-02-01T00:00:00.000Z',
    updated_at: '2026-02-01T00:00:00.000Z',
  },
];

describe('InvoiceList', () => {
  it('renders invoices with status badges', () => {
    render(<InvoiceList invoices={mockInvoices} onSelect={vi.fn()} />);
    expect(screen.getByText('paid')).toBeInTheDocument();
    expect(screen.getByText('draft')).toBeInTheDocument();
    expect(screen.getByText('overdue')).toBeInTheDocument();
  });

  it('renders operator names', () => {
    render(<InvoiceList invoices={mockInvoices} onSelect={vi.fn()} />);
    expect(screen.getAllByText('NightBrite Drones')).toHaveLength(2);
    expect(screen.getByText('Orion Skies')).toBeInTheDocument();
  });

  it('calls onSelect when a row is clicked', () => {
    const onSelect = vi.fn();
    render(<InvoiceList invoices={mockInvoices} onSelect={onSelect} />);
    fireEvent.click(screen.getByText('Orion Skies'));
    expect(onSelect).toHaveBeenCalledWith(mockInvoices[1]);
  });

  it('renders empty message when no invoices', () => {
    render(<InvoiceList invoices={[]} onSelect={vi.fn()} />);
    expect(screen.getByText('No invoices found.')).toBeInTheDocument();
  });

  it('supports sorting by clicking column headers', () => {
    render(<InvoiceList invoices={mockInvoices} onSelect={vi.fn()} />);
    // Click the Status header to sort
    fireEvent.click(screen.getByText(/^Status/));
    // Verify the table still renders (sorting doesn't break)
    expect(screen.getByText('paid')).toBeInTheDocument();
    expect(screen.getByText('draft')).toBeInTheDocument();
  });
});
