import { useCart } from "../cart/useCart";
import { useEffect, useState } from "react";
import { useApiToken } from "../auth/authHelpers";
import { catalogApi, type Product } from "../api/client";
import "./CatalogPage.css";

// ============================================================
//  Catalog Page — visible to all authenticated users
//  GET /api/catalog/products
// ============================================================

export default function CatalogPage() {
    const getToken = useApiToken();
    const cart = useCart();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            try {
                const token = await getToken();
                const data = await catalogApi.getAll(token);
                if (!cancelled) setProducts(data);
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

    if (loading) return <p className="page-status">Loading catalog…</p>;
    if (error) return <p className="page-status error">Error: {error}</p>;
    if (products.length === 0) return <p className="page-status">No products found.</p>;

    return (
        <section className="catalog-page">
            <h2>Product Catalog</h2>
            <div className="product-grid">
                {products.map((p) => (
                    <article key={p.id} className={`product-card${p.active ? "" : " inactive"}`}>
                        {p.imageUrl && (
                            <img
                                src={p.imageUrl}
                                alt={p.name}
                                className="product-img"
                            />
                        )}
                        <div className="product-body">
                            <h3>{p.name}</h3>
                            {p.description && <p className="product-desc">{p.description}</p>}
                            <div className="product-meta">
                                <span className="product-price">${Number(p.price).toFixed(2)}</span>
                                <span className="product-stock">Stock: {p.stock}</span>
                                {!p.active && <span className="badge-inactive">Inactive</span>}
                            </div>
                            <button type="button" disabled={!p.active || p.stock < 1 || (cart.items.find(i => i.product.id === p.id)?.quantity ?? 0) >= Math.min(p.stock, 100000) || (cart.items.length >= 100 && !cart.items.some(i => i.product.id === p.id))} onClick={() => cart.add(p)}>Añadir al carrito</button>
                        </div>
                    </article>
                ))}
            </div>
        </section>
    );
}
