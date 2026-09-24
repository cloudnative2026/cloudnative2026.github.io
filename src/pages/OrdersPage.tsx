import { useEffect, useState } from "react";
import { useIsAdmin, useApiToken } from "../auth/authHelpers";
import { ordersApi, type Order } from "../api/client";
import "./OrdersPage.css";

// ============================================================
//  Orders Page — Admin only
//  GET /api/v1/orders  |  PATCH /{id}/status  |  DELETE /{id}
// ============================================================

const TRANSITIONS: Record<string, string[]> = {
    CREADO: ["ACEPTADO", "CANCELADO"], ACEPTADO: ["EN_PREPARACION", "CANCELADO"],
    EN_PREPARACION: ["DESPACHADO"], DESPACHADO: ["ENTREGADO"], ENTREGADO: [], CANCELADO: []
};

export default function OrdersPage() {
    const getToken = useApiToken();
    const isAdmin = useIsAdmin();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editing, setEditing] = useState<Order | null>(null);
    const [editError, setEditError] = useState("");
    const [updatingId, setUpdatingId] = useState<number | null>(null);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            try {
                const token = await getToken();
                const data = await ordersApi.getAll(token);
                if (!cancelled) setOrders(data);
            } catch (err) {
                if (!cancelled) setError(String(err));
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        load();
        return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function handleStatusChange(id: number, status: string) {
        setUpdatingId(id);
        try {
            const token = await getToken();
            const updated = await ordersApi.updateStatus(token, id, status);
            setOrders((prev) => prev.map((o) => (o.id === id ? updated : o)));
        } catch (err) {
            alert(`Failed to update status: ${err}`);
        } finally {
            setUpdatingId(null);
        }
    }

    async function saveEdit(event: React.FormEvent) {
        event.preventDefault();
        if (!editing || updatingId !== null) return;
        setUpdatingId(editing.id); setEditError("");
        try {
            const updated = await ordersApi.update(await getToken(), editing.id, {
                customerId: editing.customerId,
                items: editing.items.map(i => ({ productId: i.productId, quantity: i.quantity }))
            });
            setOrders(previous => previous.map(o => o.id === updated.id ? updated : o));
            setEditing(null);
        } catch (error) { setEditError(String(error)); }
        finally { setUpdatingId(null); }
    }

    async function handleDelete(id: number) {
        if (!confirm(`Delete order #${id}?`)) return;
        setUpdatingId(id);
        try {
            const token = await getToken();
            await ordersApi.delete(token, id);
            setOrders((prev) => prev.filter((o) => o.id !== id));
        } catch (err) {
            alert(`Failed to delete order: ${err}`);
        } finally {
            setUpdatingId(null);
        }
    }

    if (loading) return <p className="page-status">Loading orders…</p>;
    if (error) return <p className="page-status error">Error: {error}</p>;
    if (orders.length === 0) return <p className="page-status">No orders found.</p>;

    return (
        <section className="orders-page">
            <h2>{isAdmin ? "Todos los pedidos" : "Mis pedidos"}</h2>
            {isAdmin && editing && <form onSubmit={saveEdit}>
                <h3>Editar pedido #{editing.id}</h3>
                {editError && <p role="alert">{editError}</p>}
                <fieldset disabled={updatingId !== null}>
                    <label>Número de cliente <input type="number" required min="1" max="2147483647" value={editing.customerId} onChange={e => setEditing({ ...editing, customerId: Number(e.target.value) })} /></label>
                    {editing.items.map(item => <div key={item.productId}>
                        <label>Producto #{item.productId} — Cantidad <input type="number" required min="1" max="100000" value={item.quantity} onChange={e => setEditing({ ...editing, items: editing.items.map(i => i.productId === item.productId ? { ...i, quantity: Number(e.target.value) } : i) })} /></label>
                        <button type="button" disabled={editing.items.length === 1} onClick={() => setEditing({ ...editing, items: editing.items.filter(i => i.productId !== item.productId) })}>Quitar</button>
                    </div>)}
                    <p>Al guardar se aplican los precios actuales del catálogo.</p>
                    <button type="submit">Guardar</button>
                    <button type="button" onClick={() => setEditing(null)}>Cancelar</button>
                </fieldset>
            </form>}
            <div className="orders-table-wrapper">
                <table className="orders-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Customer</th>
                            <th>Status</th>
                            <th>Total</th>
                            <th>Items</th>
                            <th>Created</th>
                            {isAdmin && <th>Actions</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map((o) => (
                            <tr key={o.id} className={updatingId === o.id ? "updating" : ""}>
                                <td>{o.id}</td>
                                <td>{o.customerId}</td>
                                <td>
                                    {isAdmin ? <select
                                        value={o.status}
                                        disabled={updatingId === o.id}
                                        onChange={(e) => handleStatusChange(o.id, e.target.value)}
                                        className="status-select"
                                    >
                                        {[o.status, ...(TRANSITIONS[o.status] ?? [])].map((s) => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </select> : o.status}
                                </td>
                                <td>${o.totalAmount.toFixed(2)}</td>
                                <td><details><summary>{o.items.length} productos</summary>{o.items.map(i => <p key={i.productId}>Producto #{i.productId}: {i.quantity} × ${Number(i.unitPrice).toFixed(2)}</p>)}</details></td>
                                <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                                {isAdmin && <td>
                                    <button type="button" disabled={updatingId !== null || o.status !== "CREADO"} onClick={() => { setEditing({ ...o, items: o.items.map(i => ({ ...i })) }); setEditError(""); }}>Editar</button>
                                    <button
                                        type="button"
                                        className="btn-danger"
                                        disabled={updatingId === o.id}
                                        onClick={() => handleDelete(o.id)}
                                    >
                                        Delete
                                    </button>
                                </td>}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
}
