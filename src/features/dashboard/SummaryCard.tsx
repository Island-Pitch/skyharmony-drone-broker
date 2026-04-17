interface SummaryCardProps {
  label: string;
  value: string | number;
}

export function SummaryCard({ label, value }: SummaryCardProps) {
  return (
    <div className="stat-card">
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}
