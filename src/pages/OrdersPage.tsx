import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useIsAdmin, useApiToken } from "../auth/authHelpers";
import { ordersApi, type Order } from "../api/client";
import "./OrdersPage.css";
import OrderReceipt from "../components/OrderReceipt";

// ============================================================
//  Orders Page — all orders for Admin, own orders otherwise
//  GET /api/v1/orders  |  PATCH /{id}/status  |  DELETE /{id}
// ============================================================

const TRANSITIONS: Record<string, string[]> = {
    CREADO: ["ACEPTADO", "CANCELADO"], ACEPTADO: ["EN_PREPARACION", "CANCELADO"],
    EN_PREPARACION: ["DESPACHADO"], DESPACHADO: ["ENTREGADO"], ENTREGADO: [], CANCELADO: []
};

const STATUS: Record<string, { label: string; badge: string }> = {
    CREADO: { label: "Creado", badge: "badge-accent" },
    ACEPTADO: { label: "Aceptado", badge: "badge-accent" },
    EN_PREPARACION: { label: "En preparación", badge: "badge-warning" },
    DESPACHADO: { label: "Despachado", badge: "badge-warning" },
    ENTREGADO: { label: "Entregado", badge: "badge-success" },
    CANCELADO: { label: "Cancelado", badge: "badge-danger" }
};

export default function OrdersPage() {
    const getToken = useApiToken();
    const isAdmin = useIsAdmin();
    const [receiptOrderId, setReceiptOrderId] = useState<number | null>(null);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
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
            alert(`No se pudo actualizar el estado: ${err}`);
        } finally {
            setUpdatingId(null);
        }
    }

    async function handleDelete(id: number) {
        if (!confirm(`¿Eliminar el pedido #${id}?`)) return;
        setUpdatingId(id);
        try {
            const token = await getToken();
            await ordersApi.delete(token, id);
            setOrders((prev) => prev.filter((o) => o.id !== id));
            if (receiptOrderId === id) setReceiptOrderId(null);
        } catch (err) {
            alert(`No se pudo eliminar el pedido: ${err}`);
        } finally {
            setUpdatingId(null);
        }
    }

    if (loading) return <p className="page-status">Cargando pedidos…</p>;
    if (error) return <p className="page-status error">Error: {error}</p>;

    return (
        <section className="page">
            <div className="page-header">
                <div>
                    <h1>{isAdmin ? "Todos los pedidos" : "Mis pedidos"}</h1>
                    <p className="page-subtitle">{orders.length} {orders.length === 1 ? "pedido" : "pedidos"}</p>
                </div>
            </div>
            {orders.length === 0 ? (
                <div className="card empty-state">
                    <h3>Aún no hay pedidos</h3>
                    <Link to="/catalog" className="btn btn-primary">Ir al catálogo</Link>
                </div>
            ) : (
                <div className="card table-wrapper">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Pedido</th>
                                {isAdmin && <th>Cliente</th>}
                                <th>Estado</th>
                                <th>Productos</th>
                                <th>Fecha</th>
                                <th className="num">Total</th>
                                <th>Boleta</th>
                                {isAdmin && <th className="num">Acciones</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map((o) => (
                                <tr key={o.id} className={updatingId === o.id ? "updating" : ""}>
                                    <td className="order-id">#{o.id}</td>
                                    {isAdmin && <td>{o.customerId}</td>}
                                    <td>
                                        {isAdmin ? <select
                                            value={o.status}
                                            disabled={updatingId === o.id || !TRANSITIONS[o.status]?.length}
                                            onChange={(e) => handleStatusChange(o.id, e.target.value)}
                                            className="input status-select"
                                        >
                                            {[o.status, ...(TRANSITIONS[o.status] ?? [])].map((s) => (
                                                <option key={s} value={s}>{STATUS[s]?.label ?? s}</option>
                                            ))}
                                        </select> : <span className={`badge ${STATUS[o.status]?.badge ?? ""}`}>{STATUS[o.status]?.label ?? o.status}</span>}
                                    </td>
                                    <td>
                                        <details className="order-items">
                                            <summary>{o.items.reduce((n, i) => n + i.quantity, 0)} unidades</summary>
                                            <ul>
                                                {o.items.map(i => <li key={i.productId}>
                                                    <span>{i.product?.name ?? `Producto #${i.productId}`}</span>
                                                    <span>{i.quantity} × ${Number(i.unitPrice).toFixed(2)}</span>
                                                </li>)}
                                            </ul>
                                        </details>
                                    </td>
                                    <td>{new Date(o.createdAt).toLocaleDateString("es-CL")}</td>
                                    <td className="num order-total">${o.totalAmount.toFixed(2)}</td>
                                    <td><button type="button" className="btn btn-sm"
                                        disabled={updatingId === o.id}
                                        onClick={() => setReceiptOrderId(o.id)}>
                                        {receiptOrderId === o.id ? "Boleta seleccionada" : "Generar / ver boleta"}
                                    </button></td>
                                    {isAdmin && <td>
                                        <div className="actions">
                                            <button
                                                type="button"
                                                className="btn btn-danger btn-sm"
                                                disabled={updatingId === o.id}
                                                onClick={() => handleDelete(o.id)}
                                            >
                                                Eliminar
                                            </button>
                                        </div>
                                    </td>}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            {receiptOrderId !== null && <OrderReceipt key={receiptOrderId} orderId={receiptOrderId}
                onClose={() => setReceiptOrderId(null)} />}
        </section>
    );
}
