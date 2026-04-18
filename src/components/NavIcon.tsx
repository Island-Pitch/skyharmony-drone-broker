const size = 18;
const props = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

import type { ReactNode } from 'react';

const icons: Record<string, ReactNode> = {
  grid: (
    <svg {...props}>
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
    </svg>
  ),
  send: (
    <svg {...props}>
      <path d="M22 2L11 13" /><path d="M22 2L15 22L11 13L2 9L22 2Z" />
    </svg>
  ),
  map: (
    <svg {...props}>
      <path d="M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4z" /><path d="M8 2v16" /><path d="M16 6v16" />
    </svg>
  ),
  'shopping-bag': (
    <svg {...props}>
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 01-8 0" />
    </svg>
  ),
  calendar: (
    <svg {...props}>
      <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4" /><path d="M8 2v4" /><path d="M3 10h18" />
    </svg>
  ),
  'dollar-sign': (
    <svg {...props}>
      <path d="M12 1v22" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
    </svg>
  ),
  camera: (
    <svg {...props}>
      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  ),
  layers: (
    <svg {...props}>
      <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
    </svg>
  ),
  'log-out': (
    <svg {...props}>
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" />
    </svg>
  ),
  'alert-triangle': (
    <svg {...props}>
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <path d="M12 9v4" /><path d="M12 17h.01" />
    </svg>
  ),
};

export function NavIcon({ name }: { name: string }) {
  return icons[name] ?? <span>{name}</span>;
}
