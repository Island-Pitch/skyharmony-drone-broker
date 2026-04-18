import { useState, useMemo } from 'react';
import { useAssets } from '@/hooks/useAssets';
import { store } from '@/data/store';
import { AssetTypeCard, TYPE_ICON_MAP, formatTypeName } from './AssetTypeCard';
import { NavIcon } from '@/components/NavIcon';
import type { Asset, AssetType } from '@/data/models/asset';

/** Renders a key-value pair from typed_attributes in a readable format. */
function AttributeTag({ label, value }: { label: string; value: unknown }) {
  const display = typeof value === 'number' ? String(value) : String(value ?? '');
  const formattedLabel = label
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
  return (
    <span className="attribute-tag">
      <span className="attribute-tag-label">{formattedLabel}:</span> {display}
    </span>
  );
}

export function Fleet() {
  const { assets, loading } = useAssets();
  const [selectedType, setSelectedType] = useState<string>('');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // Gather asset types from the global store
  const assetTypes = useMemo<AssetType[]>(() => {
    return Array.from(store.assetTypes.values());
  }, [loading]);

  // Build a lookup for type name by ID
  const typeById = useMemo(() => {
    const map = new Map<string, AssetType>();
    assetTypes.forEach((t) => map.set(t.id, t));
    return map;
  }, [assetTypes]);

  // Count assets per type
  const typeCounts = useMemo(() => {
    const counts = new Map<string, number>();
    assets.forEach((a) => {
      counts.set(a.asset_type_id, (counts.get(a.asset_type_id) ?? 0) + 1);
    });
    return counts;
  }, [assets]);

  // Filter assets by selected type
  const filteredAssets = useMemo(() => {
    if (!selectedType) return assets;
    return assets.filter((a) => a.asset_type_id === selectedType);
  }, [assets, selectedType]);

  if (loading) {
    return (
      <div className="page fleet">
        <h2>Fleet Management</h2>
        <p>Loading assets...</p>
      </div>
    );
  }

  if (assets.length === 0) {
    return (
      <div className="page fleet">
        <h2>Fleet Management</h2>
        <p>No assets in the catalog yet.</p>
      </div>
    );
  }

  const getTypeName = (asset: Asset): string => {
    return typeById.get(asset.asset_type_id)?.name ?? 'unknown';
  };

  const getIconName = (typeName: string): string => {
    return TYPE_ICON_MAP[typeName] ?? 'layers';
  };

  return (
    <div className="page fleet">
      <h2>Fleet Management</h2>

      {/* Asset type summary cards */}
      <div className="stats-grid fleet-type-cards">
        {assetTypes.map((t) => (
          <AssetTypeCard
            key={t.id}
            name={t.name}
            description={t.description}
            count={typeCounts.get(t.id) ?? 0}
          />
        ))}
      </div>

      {/* Type filter */}
      <div className="fleet-toolbar">
        <label className="fleet-type-filter">
          Filter by Type
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <option value="">All Types ({assets.length})</option>
            {assetTypes.map((t) => (
              <option key={t.id} value={t.id}>
                {formatTypeName(t.name)} ({typeCounts.get(t.id) ?? 0})
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="table-scroll-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Serial</th>
              <th>Manufacturer</th>
              <th>Model</th>
              <th>Status</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {filteredAssets.map((asset) => {
              const typeName = getTypeName(asset);
              const isExpanded = expandedRow === asset.id;
              const attrs = asset.typed_attributes ?? {};
              const attrKeys = Object.keys(attrs);

              return (
                <>
                  <tr key={asset.id}>
                    <td>
                      <span className="asset-type-badge">
                        <NavIcon name={getIconName(typeName)} />
                        <span>{formatTypeName(typeName)}</span>
                      </span>
                    </td>
                    <td>{asset.serial_number}</td>
                    <td>{asset.manufacturer}</td>
                    <td>{asset.model}</td>
                    <td>
                      <span className={`status-badge ${asset.status}`}>
                        {asset.status}
                      </span>
                    </td>
                    <td>
                      {attrKeys.length > 0 && (
                        <button
                          type="button"
                          className="btn-expand"
                          onClick={() =>
                            setExpandedRow(isExpanded ? null : asset.id)
                          }
                          aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
                        >
                          {isExpanded ? 'Hide' : 'View'}
                        </button>
                      )}
                    </td>
                  </tr>
                  {isExpanded && attrKeys.length > 0 && (
                    <tr key={`${asset.id}-detail`} className="detail-row">
                      <td colSpan={6}>
                        <div className="attribute-tags">
                          {attrKeys.map((key) => (
                            <AttributeTag
                              key={key}
                              label={key}
                              value={attrs[key]}
                            />
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
