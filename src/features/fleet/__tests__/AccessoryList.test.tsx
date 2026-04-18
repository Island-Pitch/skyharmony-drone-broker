import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AccessoryList } from '../AccessoryList';
import type { Asset } from '@/data/models/asset';
import { createMockAsset } from '@/test/helpers';

describe('AccessoryList', () => {
  const typeId = crypto.randomUUID();

  it('renders accessories with serial numbers', () => {
    const accessories: Asset[] = [
      createMockAsset(typeId, { serial_number: 'BAT-001', model: 'LiPo 5200mAh' }),
      createMockAsset(typeId, { serial_number: 'CHG-001', model: 'Fast Charger' }),
    ];

    render(<AccessoryList accessories={accessories} />);
    expect(screen.getByText('BAT-001')).toBeInTheDocument();
    expect(screen.getByText('CHG-001')).toBeInTheDocument();
  });

  it('shows empty state when no accessories', () => {
    render(<AccessoryList accessories={[]} />);
    expect(screen.getByText(/no accessories/i)).toBeInTheDocument();
  });

  it('shows accessory status', () => {
    const accessories: Asset[] = [
      createMockAsset(typeId, {
        serial_number: 'BAT-002',
        status: 'maintenance',
      }),
    ];

    render(<AccessoryList accessories={accessories} />);
    expect(screen.getByText('maintenance')).toBeInTheDocument();
  });
});
