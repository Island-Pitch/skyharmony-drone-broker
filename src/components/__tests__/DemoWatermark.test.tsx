import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DemoWatermark } from '../DemoWatermark';

describe('DemoWatermark (SHD-51)', () => {
  const originalEnv = import.meta.env.VITE_DEMO_MODE;

  beforeEach(() => {
    import.meta.env.VITE_DEMO_MODE = 'true';
  });

  afterEach(() => {
    import.meta.env.VITE_DEMO_MODE = originalEnv;
  });

  it('renders watermark text when VITE_DEMO_MODE is true', () => {
    render(<DemoWatermark />);
    expect(screen.getByText(/Demo Environment/i)).toBeInTheDocument();
  });

  it('does not render when VITE_DEMO_MODE is not set', () => {
    import.meta.env.VITE_DEMO_MODE = '';
    const { container } = render(<DemoWatermark />);
    expect(container.firstElementChild).toBeNull();
  });

  it('has fixed positioning when visible', () => {
    render(<DemoWatermark />);
    const el = screen.getByText(/Demo Environment/i);
    expect(el.style.position).toBe('fixed');
  });
});
