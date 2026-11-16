import { Bar, BarChart, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { TopProduct } from "../../api/client";
import ChartTooltip from "./ChartTooltip";
import { money } from "./format";

// Units sold per product (cancelled orders excluded), largest first.
export default function TopProductsChart({ data }: { data: TopProduct[] }) {
    const rows = data.map(p => ({ ...p, label: p.name ?? `Producto #${p.productId}` }));
    return (
        <div className="card chart-card">
            <h3>Productos más vendidos</h3>
            <p className="page-subtitle">Unidades vendidas en el período</p>
            {rows.length === 0 ? <p className="chart-empty">Sin ventas en el período.</p> : (
                <ResponsiveContainer width="100%" height={rows.length * 44 + 16}>
                    <BarChart data={rows} layout="vertical" margin={{ top: 8, right: 40, left: 0, bottom: 8 }}>
                        <XAxis type="number" hide />
                        <YAxis type="category" dataKey="label" width={140} tickLine={false} axisLine={false}
                            tick={{ fill: "var(--text-h)", fontSize: 13 }} />
                        <Tooltip cursor={{ fill: "var(--accent-bg)" }} content={({ active, payload }) => {
                            const p = payload?.[0]?.payload as (typeof rows)[number] | undefined;
                            return <ChartTooltip active={active} title={p?.label ?? ""}
                                rows={p ? [["Unidades", String(p.quantity)], ["Ventas", money(p.revenue)]] : []} />;
                        }} />
                        <Bar dataKey="quantity" fill="var(--chart)" radius={[0, 4, 4, 0]} maxBarSize={24}
                            isAnimationActive={false}>
                            <LabelList dataKey="quantity" position="right" fill="var(--text)" fontSize={13} />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            )}
            <details className="chart-table">
                <summary>Ver tabla</summary>
                <table className="table">
                    <thead><tr><th>Producto</th><th className="num">Unidades</th><th className="num">Ventas</th></tr></thead>
                    <tbody>{rows.map(p => (
                        <tr key={p.productId}><td>{p.label}</td><td className="num">{p.quantity}</td>
                            <td className="num">{money(p.revenue)}</td></tr>
                    ))}</tbody>
                </table>
            </details>
        </div>
    );
}
