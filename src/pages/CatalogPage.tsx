import { Link } from "react-router-dom";
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

    if (loading) return <p className="page-status">Cargando catálogo…</p>;
    if (error) return <p className="page-status error">Error: {error}</p>;
    if (products.length === 0) return <p className="page-status">No hay productos disponibles.</p>;

    const cartCount = cart.items.reduce((total, i) => total + i.quantity, 0);

    return (
        <section className="page">
            <div className="page-header">
                <div>
                    <h1>Catálogo</h1>
                    <p className="page-subtitle">{products.length} productos</p>
                </div>
                {cartCount > 0 && (
                    <Link to="/cart" className="btn btn-primary">
                        Ver carrito ({cartCount})
                    </Link>
                )}
            </div>
            <div className="product-grid">
                {products.map((p) => {
                    const inCart = cart.items.find(i => i.product.id === p.id)?.quantity ?? 0;
                    const max = Math.min(p.stock, 100000);
                    const available = p.active && p.stock > 0;
                    const cartFull = cart.items.length >= 100 && inCart === 0;
                    return (
                        <article key={p.id} className={`product-card card${available ? "" : " unavailable"}`}>
                            <div className="product-img">
                                {p.imageUrl
                                    ? <img src={p.imageUrl} alt={p.name} loading="lazy" />
                                    : <span aria-hidden="true">{p.name.charAt(0)}</span>}
                            </div>
                            <div className="product-body">
                                <h3>{p.name}</h3>
                                {p.description && <p className="product-desc">{p.description}</p>}
                                <div className="product-meta">
                                    <span className="product-price">${Number(p.price).toFixed(2)}</span>
                                    {!p.active ? <span className="badge">No disponible</span>
                                        : p.stock < 1 ? <span className="badge badge-danger">Agotado</span>
                                        : p.stock <= 5 ? <span className="badge badge-warning">Quedan {p.stock}</span>
                                        : <span className="badge badge-success">En stock</span>}
                                </div>
                                {inCart > 0 ? (
                                    <div className="product-in-cart">
                                        <div className="stepper">
                                            <button type="button" aria-label="Quitar uno" onClick={() => cart.quantity(p.id, inCart - 1)}>−</button>
                                            <input type="number" aria-label={`Cantidad de ${p.name}`} min="1" max={max} value={inCart}
                                                onChange={e => Number(e.target.value) >= 1 && cart.quantity(p.id, Number(e.target.value))} />
                                            <button type="button" aria-label="Agregar uno" disabled={inCart >= max} onClick={() => cart.add(p)}>+</button>
                                        </div>
                                        <span className="product-in-cart-label">en el carrito</span>
                                    </div>
                                ) : (
                                    <button type="button" className="btn btn-primary btn-block" disabled={!available || cartFull} onClick={() => cart.add(p)}>
                                        {available ? "Agregar al carrito" : "No disponible"}
                                    </button>
                                )}
                            </div>
                        </article>
                    );
                })}
            </div>
        </section>
    );
}
