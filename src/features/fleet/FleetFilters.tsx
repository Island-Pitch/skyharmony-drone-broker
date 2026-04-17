import type { AssetType, AssetStatusValue } from '@/data/models/asset';
import { AssetStatus } from '@/data/models/asset';
import type { AssetFilters } from '@/data/repositories/interfaces';

interface FleetFiltersProps {
  assetTypes: AssetType[];
  filters: AssetFilters;
  onFilterChange: (filters: AssetFilters) => void;
}

const STATUS_OPTIONS = AssetStatus.options;

export function FleetFilters({
  assetTypes,
  filters,
  onFilterChange,
}: FleetFiltersProps) {
  return (
    <div className="fleet-filters">
      <label>
        Type
        <select
          value={filters.type_id ?? ''}
          onChange={(e) =>
            onFilterChange({
              ...filters,
              type_id: e.target.value || undefined,
            })
          }
        >
          <option value="">All Types</option>
          {assetTypes.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </label>

      <label>
        Status
        <select
          value={filters.status ?? ''}
          onChange={(e) =>
            onFilterChange({
              ...filters,
              status: (e.target.value || undefined) as AssetStatusValue | undefined,
            })
          }
        >
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>

      <input
        type="text"
        placeholder="Search serial or model..."
        value={filters.search ?? ''}
        onChange={(e) =>
          onFilterChange({
            ...filters,
            search: e.target.value || undefined,
          })
        }
      />

      <button
        type="button"
        onClick={() => onFilterChange({})}
      >
        Clear Filters
      </button>
    </div>
  );
}
