import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { DemoWatermark } from '../DemoWatermark';

describe('DemoWatermark (SHD-51)', () => {
  it('renders watermark text', () => {
    render(<DemoWatermark />);
    expect(
      screen.getByText(/Prototype.*Sample Data Only/i),
    ).toBeInTheDocument();
  });

  it('has fixed positioning style', () => {
    const { container } = render(<DemoWatermark />);
    const el = container.firstElementChild as HTMLElement;
    expect(el.style.position).toBe('fixed');
  });

  it('is non-intrusive with low opacity', () => {
    const { container } = render(<DemoWatermark />);
    const el = container.firstElementChild as HTMLElement;
    const opacity = parseFloat(el.style.opacity);
    expect(opacity).toBeLessThanOrEqual(0.3);
  });
});
