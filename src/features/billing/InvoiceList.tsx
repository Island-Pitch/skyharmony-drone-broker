import { useState } from 'react';
import type { Invoice } from '@/hooks/useInvoices';

interface InvoiceListProps {
  invoices: Invoice[];
  onSelect: (invoice: Invoice) => void;
}

type SortField = 'operator_name' | 'status' | 'total' | 'due_date' | 'created_at';

const STATUS_BADGE_COLORS: Record<string, string> = {
  draft: 'var(--color-info, #6c757d)',
  sent: 'var(--color-primary, #0d6efd)',
  paid: 'var(--color-success, #198754)',
  overdue: 'var(--color-danger, #dc3545)',
};

function formatCurrency(amount: string | number): string {
  return `$${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString();
}

export function InvoiceList({ invoices, onSelect }: InvoiceListProps) {
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortAsc, setSortAsc] = useState(false);

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  }

  const sorted = [...invoices].sort((a, b) => {
    let cmp = 0;
    switch (sortField) {
      case 'operator_name':
        cmp = (a.operator_name ?? '').localeCompare(b.operator_name ?? '');
        break;
      case 'status':
        cmp = a.status.localeCompare(b.status);
        break;
      case 'total':
        cmp = Number(a.total) - Number(b.total);
        break;
      case 'due_date':
        cmp = (a.due_date ?? '').localeCompare(b.due_date ?? '');
        break;
      case 'created_at':
        cmp = (a.created_at ?? '').localeCompare(b.created_at ?? '');
        break;
    }
    return sortAsc ? cmp : -cmp;
  });

  const sortIndicator = (field: SortField) => {
    if (sortField !== field) return '';
    return sortAsc ? ' \u25B2' : ' \u25BC';
  };

  if (invoices.length === 0) {
    return <p>No invoices found.</p>;
  }

  return (
    <table className="data-table">
      <thead>
        <tr>
          <th style={{ cursor: 'pointer' }} onClick={() => handleSort('operator_name')}>
            Operator{sortIndicator('operator_name')}
          </th>
          <th style={{ cursor: 'pointer' }} onClick={() => handleSort('status')}>
            Status{sortIndicator('status')}
          </th>
          <th style={{ cursor: 'pointer' }} onClick={() => handleSort('total')}>
            Total{sortIndicator('total')}
          </th>
          <th style={{ cursor: 'pointer' }} onClick={() => handleSort('due_date')}>
            Due Date{sortIndicator('due_date')}
          </th>
          <th style={{ cursor: 'pointer' }} onClick={() => handleSort('created_at')}>
            Created{sortIndicator('created_at')}
          </th>
        </tr>
      </thead>
      <tbody>
        {sorted.map((inv) => (
          <tr
            key={inv.id}
            onClick={() => onSelect(inv)}
            style={{ cursor: 'pointer' }}
          >
            <td>{inv.operator_name ?? 'Unknown'}</td>
            <td>
              <span
                className="status-badge"
                data-status={inv.status}
                style={{
                  display: 'inline-block',
                  padding: '2px 10px',
                  borderRadius: '12px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: '#fff',
                  background: STATUS_BADGE_COLORS[inv.status] ?? '#6c757d',
                }}
              >
                {inv.status}
              </span>
            </td>
            <td>{formatCurrency(inv.total)}</td>
            <td>{formatDate(inv.due_date)}</td>
            <td>{formatDate(inv.created_at)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
