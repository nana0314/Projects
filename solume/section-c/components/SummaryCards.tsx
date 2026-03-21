interface Props {
  total: number;
  avgMortality: number | null;
  minMortality: number | null;
  maxMortality: number | null;
}

function Card({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function SummaryCards({ total, avgMortality, minMortality, maxMortality }: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card label="Total Facilities" value={total.toLocaleString()} sub="matching filters" />
      <Card
        label="Avg Mortality Rate"
        value={avgMortality !== null ? `${avgMortality}` : "—"}
        sub="per 100 patient-years"
      />
      <Card
        label="Min Mortality Rate"
        value={minMortality !== null ? `${minMortality}` : "—"}
        sub="lowest in selection"
      />
      <Card
        label="Max Mortality Rate"
        value={maxMortality !== null ? `${maxMortality}` : "—"}
        sub="highest in selection"
      />
    </div>
  );
}
