import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { LeadTimePoint } from "../../api/client";
import ChartTooltip from "./ChartTooltip";
import { hours, shortDate } from "./format";

// Average hours from creation to delivery, by delivery day. Days without deliveries leave a gap.
export default function LeadTimeChart({ data }: { data: LeadTimePoint[] }) {
    const delivered = data.some(d => d.averageHours !== null);
    return (
        <div className="card chart-card">
            <h3>Lead time promedio</h3>
            <p className="page-subtitle">Horas desde la creación hasta la entrega, por fecha de entrega</p>
            {!delivered ? <p className="chart-empty">Sin entregas en el período.</p> : (
                <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={data} margin={{ top: 12, right: 16, left: 0, bottom: 0 }}>
                        <CartesianGrid vertical={false} stroke="var(--border)" />
                        <XAxis dataKey="date" tickFormatter={shortDate} tickLine={false} minTickGap={16}
                            axisLine={{ stroke: "var(--border)" }} tick={{ fill: "var(--muted)", fontSize: 12 }} />
                        <YAxis tickLine={false} axisLine={false} width={48} unit=" h"
                            tick={{ fill: "var(--muted)", fontSize: 12 }} />
                        <Tooltip cursor={{ stroke: "var(--border)" }} content={({ active, payload }) => {
                            const point = payload?.[0]?.payload as LeadTimePoint | undefined;
                            return <ChartTooltip active={active} title={point ? shortDate(point.date) : ""}
                                rows={point ? [["Promedio", hours(point.averageHours)],
                                    ["Entregados", String(point.deliveredOrders)]] : []} />;
                        }} />
                        <Line type="monotone" dataKey="averageHours" stroke="var(--chart)" strokeWidth={2}
                            strokeLinecap="round" strokeLinejoin="round" isAnimationActive={false}
                            dot={{ r: 4, fill: "var(--chart)", stroke: "var(--surface)", strokeWidth: 2 }}
                            activeDot={{ r: 6, fill: "var(--chart)", stroke: "var(--surface)", strokeWidth: 2 }} />
                    </LineChart>
                </ResponsiveContainer>
            )}
            <details className="chart-table">
                <summary>Ver tabla</summary>
                <table className="table">
                    <thead><tr><th>Fecha</th><th className="num">Entregados</th><th className="num">Promedio</th></tr></thead>
                    <tbody>{data.map(d => (
                        <tr key={d.date}><td>{shortDate(d.date)}</td><td className="num">{d.deliveredOrders}</td>
                            <td className="num">{hours(d.averageHours)}</td></tr>
                    ))}</tbody>
                </table>
            </details>
        </div>
    );
}
