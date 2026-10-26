import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useMsal } from "@azure/msal-react";
import { useCart } from "../cart/useCart";
import { useApiToken } from "../auth/authHelpers";
import { ordersApi, type Order } from "../api/client";
import "./CartPage.css";

// The backend needs a positive int customerId; derive a stable one from the
// Entra object id (FNV-1a, 31 bits). Ownership is enforced from the JWT, not this.
function customerIdFrom(userId: string) {
    let hash = 0x811c9dc5;
    for (let i = 0; i < userId.length; i++) {
        hash ^= userId.charCodeAt(i);
        hash = Math.imul(hash, 0x01000193);
    }
    return (hash >>> 1) || 1;
}

export default function CartPage() {
    const cart = useCart();
    const getToken = useApiToken();
    const { accounts } = useMsal();
    const busy = useRef(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [order, setOrder] = useState<Order | null>(null);
    const total = cart.items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
    const count = cart.items.reduce((sum, i) => sum + i.quantity, 0);

    async function checkout() {
        if (busy.current || !cart.items.length) return;
        busy.current = true; setSaving(true); setError("");
        try {
            const created = await ordersApi.create(await getToken(), {
                customerId: customerIdFrom(accounts[0].localAccountId),
                items: cart.items.map(i => ({ productId: i.product.id, quantity: i.quantity }))
            });
            cart.clear(); setOrder(created);
        } catch (err) { setError(String(err)); }
        finally { busy.current = false; setSaving(false); }
    }

    if (order) return (
        <section className="page">
            <div className="card empty-state cart-success">
                <div className="cart-success-icon" aria-hidden="true">✓</div>
                <h1>¡Pedido realizado!</h1>
                <p role="status">Tu pedido <strong>#{order.id}</strong> por <strong>${order.totalAmount.toFixed(2)}</strong> fue creado.
                    Te avisaremos cuando cambie su estado.</p>
                <div className="cart-success-actions">
                    <Link to="/orders" className="btn btn-primary">Ver mis pedidos</Link>
                    <Link to="/catalog" className="btn btn-secondary">Seguir comprando</Link>
                </div>
            </div>
        </section>
    );

    if (!cart.items.length) return (
        <section className="page">
            <div className="card empty-state">
                <h1>Tu carrito está vacío</h1>
                <p className="page-subtitle">Agrega productos desde el catálogo para hacer un pedido.</p>
                <Link to="/catalog" className="btn btn-primary">Ir al catálogo</Link>
            </div>
        </section>
    );

    return (
        <section className="page">
            <div className="page-header">
                <div>
                    <h1>Carrito</h1>
                    <p className="page-subtitle">{count} {count === 1 ? "producto" : "productos"}</p>
                </div>
                <Link to="/catalog" className="btn btn-ghost">← Seguir comprando</Link>
            </div>
            {error && <p className="alert-error" role="alert">{error}</p>}
            <div className="cart-layout">
                <ul className="card cart-lines">
                    {cart.items.map(({ product, quantity }) => {
                        const max = Math.min(product.stock, 100000);
                        return (
                            <li key={product.id} className="cart-line">
                                <div className="cart-line-img">
                                    {product.imageUrl
                                        ? <img src={product.imageUrl} alt="" />
                                        : <span aria-hidden="true">{product.name.charAt(0)}</span>}
                                </div>
                                <div className="cart-line-info">
                                    <h3>{product.name}</h3>
                                    <p className="page-subtitle">${product.price.toFixed(2)} c/u</p>
                                    <button type="button" className="cart-line-remove" disabled={saving} onClick={() => cart.quantity(product.id, 0)}>Quitar</button>
                                </div>
                                <div className="stepper">
                                    <button type="button" aria-label="Quitar uno" disabled={saving || quantity <= 1} onClick={() => cart.quantity(product.id, quantity - 1)}>−</button>
                                    <input type="number" aria-label={`Cantidad de ${product.name}`} min="1" max={max} value={quantity} disabled={saving}
                                        onChange={e => Number(e.target.value) >= 1 && cart.quantity(product.id, Number(e.target.value))} />
                                    <button type="button" aria-label="Agregar uno" disabled={saving || quantity >= max} onClick={() => cart.quantity(product.id, quantity + 1)}>+</button>
                                </div>
                                <span className="cart-line-total">${(product.price * quantity).toFixed(2)}</span>
                            </li>
                        );
                    })}
                </ul>
                <aside className="card cart-summary">
                    <h3>Resumen</h3>
                    <div className="cart-summary-row">
                        <span>Subtotal ({count})</span>
                        <span>${total.toFixed(2)}</span>
                    </div>
                    <div className="cart-summary-row cart-summary-total">
                        <span>Total estimado</span>
                        <span>${total.toFixed(2)}</span>
                    </div>
                    <p className="cart-summary-note">El precio final se calcula al confirmar el pedido.</p>
                    <button type="button" className="btn btn-primary btn-lg btn-block" disabled={saving} onClick={checkout}>
                        {saving ? "Enviando pedido…" : "Hacer pedido"}
                    </button>
                </aside>
            </div>
        </section>
    );
}
