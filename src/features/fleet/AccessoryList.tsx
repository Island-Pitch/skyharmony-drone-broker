import type { Asset } from '@/data/models/asset';

interface AccessoryListProps {
  accessories: Asset[];
}

export function AccessoryList({ accessories }: AccessoryListProps) {
  if (accessories.length === 0) {
    return <p className="empty-state">No accessories linked.</p>;
  }

  return (
    <div className="accessory-list">
      <h4>Accessories ({accessories.length})</h4>
      <table className="data-table data-table--compact">
        <thead>
          <tr>
            <th>Serial</th>
            <th>Model</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {accessories.map((acc) => (
            <tr key={acc.id}>
              <td>{acc.serial_number}</td>
              <td>{acc.model}</td>
              <td>
                <span className={`status-badge ${acc.status}`}>
                  {acc.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
