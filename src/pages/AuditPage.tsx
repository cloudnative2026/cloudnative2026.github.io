import { useEffect, useState } from "react";
import { useApiToken } from "../auth/authHelpers";
import { bffApi, type AuditFilters, type AuditPage as Page } from "../api/client";
import "./AuditPage.css";

// ============================================================
//  Audit Page (Admin) — timeline of events stored by ms-audit
//  GET /api/v1/bff/audit/events  |  GET /api/v1/bff/audit/event-types
// ============================================================

const PAGE_SIZE = 25;

const EVENTS: Record<string, { label: string; badge: string }> = {
    OrderCreated: { label: "Pedido creado", badge: "badge-accent" },
    OrderUpdated: { label: "Pedido editado", badge: "" },
    OrderAccepted: { label: "Aceptado", badge: "badge-accent" },
    OrderPreparing: { label: "En preparación", badge: "badge-warning" },
    OrderDispatched: { label: "Despachado", badge: "badge-warning" },
    OrderDelivered: { label: "Entregado", badge: "badge-success" },
    OrderCancelled: { label: "Cancelado", badge: "badge-danger" },
    OrderDeleted: { label: "Pedido eliminado", badge: "badge-danger" }
};

interface Form { user: string; type: string; orderId: string; from: string; to: string }
const EMPTY: Form = { user: "", type: "", orderId: "", from: "", to: "" };

// Date inputs are local calendar days; "hasta" includes the whole day.
function toFilters(form: Form, page: number): AuditFilters {
    const day = (value: string, plus = 0) => {
        const date = new Date(`${value}T00:00`);
        date.setDate(date.getDate() + plus);
        return date.toISOString();
    };
    return {
        user: form.user.trim() || undefined,
        type: form.type || undefined,
        orderId: form.orderId ? Number(form.orderId) : undefined,
        from: form.from ? day(form.from) : undefined,
        to: form.to ? day(form.to, 1) : undefined,
        page,
        size: PAGE_SIZE
    };
}

export default function AuditPage() {
    const getToken = useApiToken();
    const [form, setForm] = useState<Form>(EMPTY);
    const [query, setQuery] = useState<{ form: Form; page: number }>({ form: EMPTY, page: 0 });
    const [types, setTypes] = useState<string[]>([]);
    const [result, setResult] = useState<Page | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        getToken().then(bffApi.auditEventTypes).then(setTypes).catch(() => { /* the filter falls back to "Todos" */ });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        let cancelled = false;
        getToken()
            .then(token => bffApi.auditEvents(token, toFilters(query.form, query.page)))
            .then(page => { if (!cancelled) { setResult(page); setError(null); } })
            .catch(err => { if (!cancelled) setError(String(err)); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query]);

    function run(next: { form: Form; page: number }) {
        setLoading(true);
        setQuery(next);
    }

    function search(next: Form) {
        setForm(next);
        run({ form: next, page: 0 });
    }

    const set = (key: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        setForm({ ...form, [key]: e.target.value });
    const total = result?.totalElements ?? 0;
    const first = query.page * PAGE_SIZE;

    return (
        <section className="page">
            <div className="page-header">
                <div>
                    <h1>Auditoría</h1>
                    <p className="page-subtitle">Quién hizo qué, cuándo y desde dónde</p>
                </div>
            </div>

            <form className="card audit-filters" onSubmit={(e) => { e.preventDefault(); search(form); }}>
                <label className="field">Usuario
                    <input className="input" value={form.user} onChange={set("user")} placeholder="Nombre o ID" />
                </label>
                <label className="field">Tipo de evento
                    <select className="input" value={form.type} onChange={set("type")}>
                        <option value="">Todos</option>
                        {types.map(t => <option key={t} value={t}>{EVENTS[t]?.label ?? t}</option>)}
                    </select>
                </label>
                <label className="field">Pedido
                    <input className="input" type="number" min={1} value={form.orderId} onChange={set("orderId")} placeholder="#" />
                </label>
                <label className="field">Desde
                    <input className="input" type="date" value={form.from} onChange={set("from")} />
                </label>
                <label className="field">Hasta
                    <input className="input" type="date" value={form.to} onChange={set("to")} />
                </label>
                <div className="audit-filter-actions">
                    <button type="submit" className="btn btn-primary">Filtrar</button>
                    <button type="button" className="btn btn-secondary" onClick={() => search(EMPTY)}>Limpiar</button>
                </div>
            </form>

            {error && <p className="alert-error" role="alert">Error: {error}</p>}
            {loading && !result ? <p className="page-status">Cargando eventos…</p> : total === 0 ? (
                <div className="card empty-state"><h3>No hay eventos para estos filtros</h3></div>
            ) : (
                <>
                    <p className="page-subtitle audit-count">
                        {first + 1}–{Math.min(first + PAGE_SIZE, total)} de {total} eventos
                    </p>
                    <ol className={`audit-timeline ${loading ? "updating" : ""}`}>
                        {result!.content.map(e => (
                            <li key={e.eventId} className="card audit-event">
                                <time dateTime={e.occurredAt}>
                                    {new Date(e.occurredAt).toLocaleString("es-CL", { dateStyle: "medium", timeStyle: "medium" })}
                                </time>
                                <div className="audit-what">
                                    <span className={`badge ${EVENTS[e.eventType]?.badge ?? ""}`}>
                                        {EVENTS[e.eventType]?.label ?? e.eventType}
                                    </span>
                                    {e.entityType === "ORDER" ? (
                                        <button type="button" className="btn btn-ghost btn-sm" title="Ver trazabilidad del pedido"
                                            onClick={() => search({ ...EMPTY, orderId: e.entityId })}>
                                            Pedido #{e.entityId}
                                        </button>
                                    ) : <span>{e.entityType} {e.entityId}</span>}
                                    {e.detail && <span className="audit-detail">{e.detail}</span>}
                                </div>
                                <div className="audit-who">
                                    <strong>{e.actorName ?? e.actorSubject ?? "Desconocido"}</strong>
                                    {e.actorRoles.length > 0 && <span> · {e.actorRoles.join(", ")}</span>}
                                </div>
                                <div className="audit-where" title={e.userAgent ?? undefined}>
                                    {e.sourceIp ?? "IP desconocida"} · {e.sourceService ?? "—"}
                                </div>
                            </li>
                        ))}
                    </ol>
                    <div className="audit-pager">
                        <button type="button" className="btn btn-secondary btn-sm" disabled={query.page === 0 || loading}
                            onClick={() => run({ ...query, page: query.page - 1 })}>Anterior</button>
                        <button type="button" className="btn btn-secondary btn-sm"
                            disabled={first + PAGE_SIZE >= total || loading}
                            onClick={() => run({ ...query, page: query.page + 1 })}>Siguiente</button>
                    </div>
                </>
            )}
        </section>
    );
}
