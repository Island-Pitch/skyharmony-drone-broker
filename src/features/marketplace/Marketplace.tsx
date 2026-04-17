export function Marketplace() {
  const listings = [
    { id: 1, title: 'Agricultural Survey — 200 acres', price: '$450', operator: 'AgriFly Co.' },
    { id: 2, title: 'Roof Inspection — Commercial', price: '$320', operator: 'SkyScan LLC' },
    { id: 3, title: 'Event Photography — Outdoor', price: '$275', operator: 'DroneShots' },
  ];

  return (
    <div className="page marketplace">
      <h2>Marketplace</h2>
      <div className="listing-grid">
        {listings.map((l) => (
          <div key={l.id} className="listing-card">
            <h3>{l.title}</h3>
            <p className="listing-operator">{l.operator}</p>
            <p className="listing-price">{l.price}</p>
            <button className="btn-primary">Request Quote</button>
          </div>
        ))}
      </div>
    </div>
  );
}
