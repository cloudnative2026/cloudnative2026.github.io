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
            alert(`No se pudo guardar: ${err}`);
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(id: number) {
        if (!confirm(`¿Eliminar el producto #${id}?`)) return;
        try {
            const token = await getToken();
            await catalogApi.delete(token, id);
            setProducts((prev) => prev.filter((p) => p.id !== id));
        } catch (err) {
            alert(`No se pudo eliminar: ${err}`);
        }
    }

    if (loading) return <p className="page-status">Cargando productos…</p>;
    if (error) return <p className="page-status error">Error: {error}</p>;

    return (
        <section className="page">
            <div className="page-header">
                <div>
                    <h1>Productos</h1>
                    <p className="page-subtitle">{products.length} productos en el catálogo</p>
                </div>
                <button type="button" className="btn btn-primary" onClick={openCreate}>
                    + Nuevo producto
                </button>
            </div>

            <div className="card table-wrapper">
                <table className="table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Nombre</th>
                            <th className="num">Precio</th>
                            <th className="num">Stock</th>
                            <th>Estado</th>
                            <th className="num">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map((p) => (
                            <tr key={p.id}>
                                <td className="padmin-id">{p.id}</td>
                                <td>
                                    <div className="padmin-name">
                                        <div className="padmin-thumb">
                                            {p.imageUrl ? <img src={p.imageUrl} alt="" /> : <span aria-hidden="true">{p.name.charAt(0)}</span>}
                                        </div>
                                        {p.name}
                                    </div>
                                </td>
                                <td className="num">${Number(p.price).toFixed(2)}</td>
                                <td className="num">{p.stock}</td>
                                <td>{p.active ? <span className="badge badge-success">Activo</span> : <span className="badge">Inactivo</span>}</td>
                                <td>
                                    <div className="actions">
                                        <button
                                            type="button"
                                            className="btn btn-secondary btn-sm"
                                            onClick={() => openEdit(p)}
                                        >
                                            Editar
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-danger btn-sm"
                                            onClick={() => handleDelete(p.id)}
                                        >
                                            Eliminar
                                        </button>
                                    </div>
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
                        className="modal card"
                        role="dialog"
                        aria-modal="true"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3>{editingId === "new" ? "Nuevo producto" : `Editar producto #${editingId}`}</h3>
                        <form onSubmit={handleSubmit} className="form">
                            <label className="field">
                                Nombre
                                <input
                                    className="input"
                                    name="name"
                                    required
                                    maxLength={200}
                                    value={form.name}
                                    onChange={handleChange}
                                />
                            </label>
                            <label className="field">
                                Descripción
                                <textarea
                                    className="input"
                                    name="description"
                                    rows={3}
                                    maxLength={4000}
                                    value={form.description}
                                    onChange={handleChange}
                                />
                            </label>
                            <div className="form-row">
                                <label className="field">
                                    Precio
                                    <input
                                        className="input"
                                        name="price"
                                        type="number"
                                        min={0}
                                        step={0.01}
                                        required
                                        value={form.price}
                                        onChange={handleChange}
                                    />
                                </label>
                                <label className="field">
                                    Stock
                                    <input
                                        className="input"
                                        name="stock"
                                        type="number"
                                        min={0}
                                        required
                                        value={form.stock}
                                        onChange={handleChange}
                                    />
                                </label>
                            </div>
                            <label className="field">
                                URL de imagen
                                <input
                                    className="input"
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
                                Activo
                            </label>
                            <div className="form-actions">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={closeModal}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={saving}
                                >
                                    {saving ? "Guardando…" : "Guardar"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </section>
    );
}
