import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { QRScanner } from '../QRScanner';

describe('QRScanner', () => {
  it('renders camera scan button and manual entry instruction', () => {
    render(<QRScanner onScan={vi.fn()} scanning={false} />);
    expect(screen.getByText(/tap to scan qr code/i)).toBeInTheDocument();
    expect(screen.getByText(/enter serial number manually/i)).toBeInTheDocument();
  });

  it('renders serial number input', () => {
    render(<QRScanner onScan={vi.fn()} scanning={false} />);
    expect(screen.getByLabelText(/serial number/i)).toBeInTheDocument();
  });

  it('renders look up button', () => {
    render(<QRScanner onScan={vi.fn()} scanning={false} />);
    expect(screen.getByRole('button', { name: /look up/i })).toBeInTheDocument();
  });

  it('calls onScan with trimmed serial when submitted', () => {
    const onScan = vi.fn();
    render(<QRScanner onScan={onScan} scanning={false} />);

    const input = screen.getByLabelText(/serial number/i);
    fireEvent.change(input, { target: { value: '  VE-0001  ' } });
    fireEvent.click(screen.getByRole('button', { name: /look up/i }));

    expect(onScan).toHaveBeenCalledWith('VE-0001');
  });

  it('does not call onScan with empty input', () => {
    const onScan = vi.fn();
    render(<QRScanner onScan={onScan} scanning={false} />);

    fireEvent.click(screen.getByRole('button', { name: /look up/i }));
    expect(onScan).not.toHaveBeenCalled();
  });

  it('disables input and button while scanning', () => {
    render(<QRScanner onScan={vi.fn()} scanning={true} />);
    expect(screen.getByLabelText(/serial number/i)).toBeDisabled();
  });

  it('shows looking up text while scanning', () => {
    render(<QRScanner onScan={vi.fn()} scanning={true} />);
    expect(screen.getByText(/looking up/i)).toBeInTheDocument();
  });
});
