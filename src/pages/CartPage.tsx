import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../cart/useCart";
import { useApiToken } from "../auth/authHelpers";
import { ordersApi } from "../api/client";
import "./OrdersPage.css";

export default function CartPage() {
    const cart = useCart();
    const getToken = useApiToken();
    const busy = useRef(false);
    const [saving, setSaving] = useState(false);
    const [customerId, setCustomerId] = useState("");
    const [error, setError] = useState("");
    const [orderId, setOrderId] = useState<number | null>(null);
    async function checkout(event: React.FormEvent) {
        event.preventDefault();
        if (busy.current || !cart.items.length) return;
        busy.current = true; setSaving(true); setError("");
        try {
            const order = await ordersApi.create(await getToken(), {
                customerId: Number(customerId),
                items: cart.items.map(i => ({ productId: i.product.id, quantity: i.quantity }))
            });
            cart.clear(); setOrderId(order.id);
        } catch (err) { setError(String(err)); }
        finally { busy.current = false; setSaving(false); }
    }
    return <section className="orders-page"><h2>Carrito</h2>
        {orderId && <p role="status">Pedido #{orderId} creado. <Link to="/orders">Ver pedidos</Link></p>}
        {error && <p className="error" role="alert">{error}</p>}
        {!cart.items.length ? <p>Tu carrito está vacío. <Link to="/catalog">Ver catálogo</Link></p> :
        <form onSubmit={checkout}><fieldset disabled={saving}>
            {cart.items.map(({ product, quantity }) => <div key={product.id} className="cart-line">
                <span>{product.name} — ${(product.price * quantity).toFixed(2)}</span>
                <label>Cantidad <input type="number" min="1" max={Math.min(product.stock, 100000)} required value={quantity}
                    onChange={e => cart.quantity(product.id, Number(e.target.value))} /></label>
                <button type="button" onClick={() => cart.quantity(product.id, 0)}>Quitar</button>
            </div>)}
            <p>Total estimado: ${cart.items.reduce((total, i) => total + i.product.price * i.quantity, 0).toFixed(2)}</p>
            <p>El precio final se calcula al confirmar el pedido.</p>
            <label>Número de cliente <input type="number" min="1" max="2147483647" step="1" required value={customerId} onChange={e => setCustomerId(e.target.value)} /></label>
            <button type="submit" className="btn-primary">{saving ? "Enviando…" : "Hacer pedido"}</button>
        </fieldset></form>}
    </section>;
}
