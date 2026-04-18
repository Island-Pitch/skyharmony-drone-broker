import { NavIcon } from '@/components/NavIcon';

/** Maps asset type names to NavIcon icon names. */
const TYPE_ICON_MAP: Record<string, string> = {
  drone: 'drone',
  battery: 'battery',
  charger: 'zap',
  base_station: 'radio',
  trailer: 'truck',
  antenna_array: 'antenna',
  ground_control: 'monitor',
  rtk_station: 'satellite',
};

/** Formats an asset type name for display (e.g. "base_station" -> "Base Station"). */
function formatTypeName(name: string): string {
  return name
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

interface AssetTypeCardProps {
  name: string;
  description: string;
  count: number;
}

export function AssetTypeCard({ name, description, count }: AssetTypeCardProps) {
  const iconName = TYPE_ICON_MAP[name] ?? 'layers';

  return (
    <div className="asset-type-card stat-card">
      <div className="asset-type-card-header">
        <span className="asset-type-card-icon">
          <NavIcon name={iconName} />
        </span>
        <span className="stat-value">{count}</span>
      </div>
      <div className="stat-label">{formatTypeName(name)}</div>
      <div className="asset-type-card-desc">{description}</div>
    </div>
  );
}

export { TYPE_ICON_MAP, formatTypeName };
