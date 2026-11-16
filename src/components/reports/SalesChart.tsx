import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { SalesPoint } from "../../api/client";
import ChartTooltip from "./ChartTooltip";
import { compact, money, shortDate } from "./format";

// Daily revenue (cancelled orders excluded).
export default function SalesChart({ data }: { data: SalesPoint[] }) {
    const total = data.reduce((sum, d) => sum + d.revenue, 0);
    return (
        <div className="card chart-card">
            <h3>Ventas por día</h3>
            <p className="page-subtitle">Monto de pedidos no cancelados, por fecha de creación</p>
            {total === 0 ? <p className="chart-empty">Sin ventas en el período.</p> : (
                <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={data} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
                        <CartesianGrid vertical={false} stroke="var(--border)" />
                        <XAxis dataKey="date" tickFormatter={shortDate} tickLine={false} minTickGap={16}
                            axisLine={{ stroke: "var(--border)" }} tick={{ fill: "var(--muted)", fontSize: 12 }} />
                        <YAxis tickFormatter={compact} tickLine={false} axisLine={false} width={48}
                            tick={{ fill: "var(--muted)", fontSize: 12 }} />
                        <Tooltip cursor={{ fill: "var(--accent-bg)" }} content={({ active, payload }) => {
                            const point = payload?.[0]?.payload as SalesPoint | undefined;
                            return <ChartTooltip active={active} title={point ? shortDate(point.date) : ""}
                                rows={point ? [["Ventas", money(point.revenue)], ["Pedidos", String(point.orders)]] : []} />;
                        }} />
                        <Bar dataKey="revenue" fill="var(--chart)" radius={[4, 4, 0, 0]} maxBarSize={24}
                            isAnimationActive={false} />
                    </BarChart>
                </ResponsiveContainer>
            )}
            <details className="chart-table">
                <summary>Ver tabla</summary>
                <table className="table">
                    <thead><tr><th>Fecha</th><th className="num">Pedidos</th><th className="num">Ventas</th></tr></thead>
                    <tbody>{data.map(d => (
                        <tr key={d.date}><td>{shortDate(d.date)}</td><td className="num">{d.orders}</td>
                            <td className="num">{money(d.revenue)}</td></tr>
                    ))}</tbody>
                </table>
            </details>
        </div>
    );
}
