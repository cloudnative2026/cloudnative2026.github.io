import { useEffect, useState } from "react";
import { useApiToken } from "../auth/authHelpers";
import { ordersApi, type Order } from "../api/client";
import "./OrdersPage.css";

// ============================================================
//  Orders Page — Admin only
//  GET /api/v1/orders  |  PATCH /{id}/status  |  DELETE /{id}
// ============================================================

const ORDER_STATUSES = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"];

export default function OrdersPage() {
    const getToken = useApiToken();
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
            alert(`Failed to update status: ${err}`);
        } finally {
            setUpdatingId(null);
        }
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
            <h2>Orders</h2>
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
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map((o) => (
                            <tr key={o.id} className={updatingId === o.id ? "updating" : ""}>
                                <td>{o.id}</td>
                                <td>{o.customerId}</td>
                                <td>
                                    <select
                                        value={o.status}
                                        disabled={updatingId === o.id}
                                        onChange={(e) => handleStatusChange(o.id, e.target.value)}
                                        className="status-select"
                                    >
                                        {ORDER_STATUSES.map((s) => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </select>
                                </td>
                                <td>${o.totalAmount.toFixed(2)}</td>
                                <td>{o.items.length}</td>
                                <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                                <td>
                                    <button
                                        type="button"
                                        className="btn-danger"
                                        disabled={updatingId === o.id}
                                        onClick={() => handleDelete(o.id)}
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
}
