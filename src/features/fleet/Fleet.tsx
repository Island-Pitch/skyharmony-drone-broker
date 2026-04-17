import { useAssets } from '@/hooks/useAssets';

export function Fleet() {
  const { assets, loading } = useAssets();

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

  return (
    <div className="page fleet">
      <h2>Fleet Management</h2>
      <table className="data-table">
        <thead>
          <tr>
            <th>Serial</th>
            <th>Manufacturer</th>
            <th>Model</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {assets.map((asset) => (
            <tr key={asset.id}>
              <td>{asset.serial_number}</td>
              <td>{asset.manufacturer}</td>
              <td>{asset.model}</td>
              <td>
                <span className={`status-badge ${asset.status}`}>
                  {asset.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
