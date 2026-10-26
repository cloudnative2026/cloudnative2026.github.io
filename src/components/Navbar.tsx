import { NavLink } from "react-router-dom";
import { useMsal } from "@azure/msal-react";
import { useIsAdmin } from "../auth/authHelpers";
import { useCart } from "../cart/useCart";
import "./Navbar.css";

// ============================================================
//  Navbar — shown to all authenticated users.
//  Admin-only links are rendered only when role = Admin.
// ============================================================

export default function Navbar() {
    const { instance, accounts } = useMsal();
    const isAdmin = useIsAdmin();
    const cart = useCart();
    const account = accounts[0];
    const count = cart.items.reduce((total, i) => total + i.quantity, 0);

    function handleLogout() {
        instance.logoutPopup().catch(console.error);
    }

    return (
        <header className="navbar">
            <div className="navbar-inner">
                <NavLink to="/catalog" className="navbar-brand">Pedidos360</NavLink>

                <nav>
                    <ul className="navbar-links">
                        <li><NavLink to="/catalog">Catálogo</NavLink></li>
                        {!isAdmin && <li><NavLink to="/orders">Mis pedidos</NavLink></li>}
                        {isAdmin && (
                            <>
                                <li><NavLink to="/admin/products">Productos</NavLink></li>
                                <li><NavLink to="/admin/orders">Pedidos</NavLink></li>
                            </>
                        )}
                    </ul>
                </nav>

                <div className="navbar-user">
                    <NavLink to="/cart" className="navbar-cart" aria-label={`Carrito, ${count} productos`}>
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M3 4h2l2.4 11.2a1 1 0 0 0 1 .8h8.9a1 1 0 0 0 1-.8L20 8H6.2" />
                            <circle cx="9" cy="20" r="1.4" />
                            <circle cx="17" cy="20" r="1.4" />
                        </svg>
                        Carrito
                        {count > 0 && <span className="navbar-cart-count">{count}</span>}
                    </NavLink>
                    {account && (
                        <span className="navbar-name">
                            {account.name ?? account.username}
                            {isAdmin && <span className="badge badge-accent">Admin</span>}
                        </span>
                    )}
                    <button type="button" className="btn btn-secondary btn-sm" onClick={handleLogout}>
                        Cerrar sesión
                    </button>
                </div>
            </div>
        </header>
    );
}
