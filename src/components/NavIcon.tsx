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
  tool: (
    <svg {...props}>
      <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
    </svg>
  ),
  truck: (
    <svg {...props}>
      <path d="M1 3h15v13H1z" /><path d="M16 8h4l3 3v5h-7V8z" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  ),
  antenna: (
    <svg {...props}>
      <path d="M12 20V10" /><path d="M18 6l-6 4-6-4" /><path d="M21 3l-9 6-9-6" /><path d="M9 20h6" />
    </svg>
  ),
  monitor: (
    <svg {...props}>
      <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8" /><path d="M12 17v4" />
    </svg>
  ),
  satellite: (
    <svg {...props}>
      <path d="M13 7L9 3 3 9l4 4" /><path d="M11 15l4 4 6-6-4-4" /><path d="M8 12l4 4" /><circle cx="6" cy="18" r="3" />
    </svg>
  ),
  drone: (
    <svg {...props}>
      <circle cx="12" cy="12" r="3" /><path d="M12 1v4M12 19v4M1 12h4M19 12h4" /><path d="M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
    </svg>
  ),
  battery: (
    <svg {...props}>
      <rect x="1" y="6" width="18" height="12" rx="2" /><path d="M23 10v4" />
    </svg>
  ),
  zap: (
    <svg {...props}>
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  ),
  radio: (
    <svg {...props}>
      <path d="M12 12m-2 0a2 2 0 104 0 2 2 0 10-4 0" /><path d="M16.24 7.76a6 6 0 010 8.49" /><path d="M7.76 16.24a6 6 0 010-8.49" /><path d="M19.07 4.93a10 10 0 010 14.14" /><path d="M4.93 19.07a10 10 0 010-14.14" />
    </svg>
  ),
  'trending-up': (
    <svg {...props}>
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
    </svg>
  ),
  'bar-chart': (
    <svg {...props}>
      <line x1="12" y1="20" x2="12" y2="10" /><line x1="18" y1="20" x2="18" y2="4" /><line x1="6" y1="20" x2="6" y2="16" />
  plane: (
    <svg {...props}>
      <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.3c.4-.2.6-.6.5-1.1z" />
    </svg>
  ),
  helicopter: (
    <svg {...props}>
      <path d="M3 3h18" /><path d="M12 3v7" /><path d="M7 10h10l2 4H5l2-4z" /><path d="M12 14v4" /><path d="M8 18h8" /><path d="M18 14l3 4" />
    </svg>
  ),
  pyrodrone: (
    <svg {...props}>
      <circle cx="12" cy="15" r="3" /><path d="M12 4v4M8 6l1 3M16 6l-1 3" /><path d="M5 15h2M17 15h2" /><path d="M7 19l1.5-1.5M17 19l-1.5-1.5" />
    </svg>
  ),
  star: (
    <svg {...props}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  activity: (
    <svg {...props}>
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
  'credit-card': (
    <svg {...props}>
      <rect x="1" y="4" width="22" height="16" rx="2" /><path d="M1 10h22" />
    </svg>
  ),
};

export function NavIcon({ name }: { name: string }) {
  return icons[name] ?? <span>{name}</span>;
}
