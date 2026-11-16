// Hover card shared by the report charts: a title and label/value rows in text tokens.
export default function ChartTooltip({ active, title, rows }: {
    active?: boolean;
    title: string;
    rows: [string, string][];
}) {
    if (!active || rows.length === 0) return null;
    return (
        <div className="chart-tooltip">
            <strong>{title}</strong>
            {rows.map(([label, value]) => (
                <div key={label}><span>{label}</span><span>{value}</span></div>
            ))}
        </div>
    );
}
