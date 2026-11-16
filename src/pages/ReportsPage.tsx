import { useEffect, useState } from "react";
import { useApiToken } from "../auth/authHelpers";
import { bffApi, type Dashboard } from "../api/client";
import SalesChart from "../components/reports/SalesChart";
import LeadTimeChart from "../components/reports/LeadTimeChart";
import TopProductsChart from "../components/reports/TopProductsChart";
import { hours, money } from "../components/reports/format";
import "./ReportsPage.css";

// ============================================================
//  Reports Page (Admin) — KPIs fed by Kafka through ms-report
//  GET /api/v1/bff/reports/dashboard, refreshed every 30 s
// ============================================================

const RANGES = [7, 30, 90];
const REFRESH_MS = 30_000;

// Whole local days: from the start of (today - days + 1) to the start of tomorrow.
function range(days: number) {
    const to = new Date();
    to.setHours(0, 0, 0, 0);
    to.setDate(to.getDate() + 1);
    const from = new Date(to);
    from.setDate(from.getDate() - days);
    return { from: from.toISOString(), to: to.toISOString() };
}

export default function ReportsPage() {
    const getToken = useApiToken();
    const [days, setDays] = useState(30);
    const [data, setData] = useState<Dashboard | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [reload, setReload] = useState(0);

    useEffect(() => {
        let cancelled = false;
        async function load() {
            try {
                const { from, to } = range(days);
                const dashboard = await bffApi.dashboard(await getToken(), from, to);
                if (!cancelled) { setData(dashboard); setError(null); }
            } catch (err) {
                if (!cancelled) setError(String(err));
            }
        }
        load();
        const timer = setInterval(load, REFRESH_MS);
        return () => { cancelled = true; clearInterval(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [days, reload]);

    if (!data && error) return <p className="page-status error">Error: {error}</p>;
    if (!data) return <p className="page-status">Cargando reportes…</p>;
    const k = data.kpis;

    return (
        <section className="page">
            <div className="page-header">
                <div>
                    <h1>Reportes</h1>
                    <p className="page-subtitle">
                        Actualizado {new Date(data.generatedAt).toLocaleTimeString("es-CL")} · se actualiza cada 30 s
                    </p>
                </div>
                <div className="reports-filters">
                    <select className="input" value={days} aria-label="Período"
                        onChange={(e) => setDays(Number(e.target.value))}>
                        {RANGES.map(d => <option key={d} value={d}>Últimos {d} días</option>)}
                    </select>
                    <button type="button" className="btn btn-secondary" onClick={() => setReload(n => n + 1)}>
                        Actualizar
                    </button>
                </div>
            </div>
            {error && <p className="alert-error" role="alert">No se pudo actualizar: {error}</p>}

            <div className="kpi-grid">
                <div className="card kpi kpi-hero">
                    <span className="kpi-label">Ventas</span>
                    <span className="kpi-value">{money(k.revenue)}</span>
                </div>
                <div className="card kpi"><span className="kpi-label">Pedidos</span><span className="kpi-value">{k.orders}</span></div>
                <div className="card kpi"><span className="kpi-label">Ticket promedio</span><span className="kpi-value">{money(k.averageTicket)}</span></div>
                <div className="card kpi"><span className="kpi-label">Lead time promedio</span><span className="kpi-value">{hours(k.averageLeadTimeHours)}</span></div>
                <div className="card kpi"><span className="kpi-label">Entregados</span><span className="kpi-value">{k.deliveredOrders}</span></div>
                <div className="card kpi"><span className="kpi-label">Cancelados</span><span className="kpi-value">{k.cancelledOrders}</span></div>
            </div>

            <div className="chart-grid">
                <SalesChart data={data.sales} />
                <LeadTimeChart data={data.leadTime} />
                <TopProductsChart data={data.topProducts} />
            </div>
        </section>
    );
}
