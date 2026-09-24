import { useEffect, useState } from "react";
import { useApiToken } from "../auth/authHelpers";
import { catalogApi, type Product, type ProductRequest } from "../api/client";
import "./ProductsAdminPage.css";

// ============================================================
//  Products Admin Page — Admin only
//  Lists all products with edit (PUT) and delete (DELETE).
// ============================================================

const EMPTY_FORM: ProductRequest = {
    name: "",
    description: "",
    price: 0,
    stock: 0,
    imageUrl: "",
    active: true
};

export default function ProductsAdminPage() {
    const getToken = useApiToken();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    // null = create mode, number = edit mode (product id)
    const [editingId, setEditingId] = useState<number | null | "new">(null);
    const [form, setForm] = useState<ProductRequest>(EMPTY_FORM);

    useEffect(() => {
        let cancelled = false;
        async function loadProducts() {
            try {
                const data = await catalogApi.getAll(await getToken());
                if (!cancelled) setProducts(data);
            } catch (err) {
                if (!cancelled) setError(String(err));
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        loadProducts();
        return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function openCreate() {
        setForm(EMPTY_FORM);
        setEditingId("new");
    }

    function openEdit(p: Product) {
        setForm({
            name: p.name,
            description: p.description ?? "",
            price: p.price,
            stock: p.stock,
            imageUrl: p.imageUrl ?? "",
            active: p.active
        });
        setEditingId(p.id);
    }

    function closeModal() {
        setEditingId(null);
    }

    function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        setForm((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked
                : type === "number" ? Number(value)
                : value
        }));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        try {
            const token = await getToken();
            if (editingId === "new") {
                const created = await catalogApi.create(token, form);
                setProducts((prev) => [...prev, created]);
            } else if (editingId !== null) {
                const updated = await catalogApi.update(token, editingId, form);
                setProducts((prev) => prev.map((p) => (p.id === editingId ? updated : p)));
            }
            closeModal();
        } catch (err) {
            alert(`Save failed: ${err}`);
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(id: number) {
        if (!confirm(`Delete product #${id}?`)) return;
        try {
            const token = await getToken();
            await catalogApi.delete(token, id);
            setProducts((prev) => prev.filter((p) => p.id !== id));
        } catch (err) {
            alert(`Delete failed: ${err}`);
        }
    }

    if (loading) return <p className="page-status">Loading products…</p>;
    if (error) return <p className="page-status error">Error: {error}</p>;

    return (
        <section className="padmin-page">
            <div className="padmin-header">
                <h2>Manage Products</h2>
                <button type="button" className="btn-primary" onClick={openCreate}>
                    + New Product
                </button>
            </div>

            <div className="orders-table-wrapper">
                <table className="orders-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Name</th>
                            <th>Price</th>
                            <th>Stock</th>
                            <th>Active</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map((p) => (
                            <tr key={p.id}>
                                <td>{p.id}</td>
                                <td>{p.name}</td>
                                <td>${Number(p.price).toFixed(2)}</td>
                                <td>{p.stock}</td>
                                <td>{p.active ? "✔" : "✘"}</td>
                                <td className="action-cell">
                                    <button
                                        type="button"
                                        className="btn-secondary"
                                        onClick={() => openEdit(p)}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        type="button"
                                        className="btn-danger"
                                        onClick={() => handleDelete(p.id)}
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* ── Modal ── */}
            {editingId !== null && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div
                        className="modal"
                        role="dialog"
                        aria-modal="true"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3>{editingId === "new" ? "New Product" : `Edit Product #${editingId}`}</h3>
                        <form onSubmit={handleSubmit} className="product-form">
                            <label>
                                Name
                                <input
                                    name="name"
                                    required
                                    maxLength={200}
                                    value={form.name}
                                    onChange={handleChange}
                                />
                            </label>
                            <label>
                                Description
                                <textarea
                                    name="description"
                                    rows={3}
                                    maxLength={4000}
                                    value={form.description}
                                    onChange={handleChange}
                                />
                            </label>
                            <div className="form-row">
                                <label>
                                    Price
                                    <input
                                        name="price"
                                        type="number"
                                        min={0}
                                        step={0.01}
                                        required
                                        value={form.price}
                                        onChange={handleChange}
                                    />
                                </label>
                                <label>
                                    Stock
                                    <input
                                        name="stock"
                                        type="number"
                                        min={0}
                                        required
                                        value={form.stock}
                                        onChange={handleChange}
                                    />
                                </label>
                            </div>
                            <label>
                                Image URL
                                <input
                                    name="imageUrl"
                                    type="url"
                                    maxLength={2048}
                                    value={form.imageUrl}
                                    onChange={handleChange}
                                />
                            </label>
                            <label className="checkbox-label">
                                <input
                                    name="active"
                                    type="checkbox"
                                    checked={form.active}
                                    onChange={handleChange}
                                />
                                Active
                            </label>
                            <div className="form-actions">
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={closeModal}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn-primary"
                                    disabled={saving}
                                >
                                    {saving ? "Saving…" : "Save"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </section>
    );
}
