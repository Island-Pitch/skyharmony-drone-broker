import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AuditLogViewer } from '../AuditLogViewer';
import type { AuditEvent } from '@/data/models/audit';

describe('AuditLogViewer', () => {
  const makeEvent = (overrides: Partial<AuditEvent> = {}): AuditEvent => ({
    id: crypto.randomUUID(),
    asset_id: crypto.randomUUID(),
    field_changed: 'status',
    old_value: 'available',
    new_value: 'maintenance',
    changed_by: crypto.randomUUID(),
    changed_at: new Date().toISOString(),
    ...overrides,
  });

  it('renders audit events', () => {
    const events = [
      makeEvent({ old_value: 'available', new_value: 'allocated' }),
      makeEvent({ old_value: 'allocated', new_value: 'in_transit' }),
    ];

    render(<AuditLogViewer events={events} />);
    expect(screen.getByText(/available/)).toBeInTheDocument();
    expect(screen.getByText(/allocated/)).toBeInTheDocument();
  });

  it('shows empty state when no events', () => {
    render(<AuditLogViewer events={[]} />);
    expect(screen.getByText(/no audit/i)).toBeInTheDocument();
  });

  it('shows field changed', () => {
    const events = [makeEvent({ field_changed: 'status' })];
    render(<AuditLogViewer events={events} />);
    expect(screen.getByText('status')).toBeInTheDocument();
  });
});
