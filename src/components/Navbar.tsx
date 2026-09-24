import { NavLink } from "react-router-dom";
import { useMsal } from "@azure/msal-react";
import { useIsAdmin } from "../auth/authHelpers";
import "./Navbar.css";

// ============================================================
//  Navbar — shown to all authenticated users.
//  Admin-only links are rendered only when role = Admin.
// ============================================================

export default function Navbar() {
    const { instance, accounts } = useMsal();
    const isAdmin = useIsAdmin();
    const account = accounts[0];

    function handleLogout() {
        instance.logoutPopup().catch(console.error);
    }

    return (
        <nav className="navbar">
            <span className="navbar-brand">CloudNative</span>

            <ul className="navbar-links">
                <li>
                    <NavLink to="/catalog" className={({ isActive }) => isActive ? "active" : ""}>
                        Catalog
                    </NavLink>
                </li>
                <li><NavLink to="/cart">Carrito</NavLink></li>
                <li><NavLink to="/orders">Mis pedidos</NavLink></li>
                {isAdmin && (
                    <>
                        <li>
                            <NavLink to="/admin/products" className={({ isActive }) => isActive ? "active" : ""}>
                                Products
                            </NavLink>
                        </li>
                        <li>
                            <NavLink to="/admin/orders" className={({ isActive }) => isActive ? "active" : ""}>
                                Orders
                            </NavLink>
                        </li>
                    </>
                )}
            </ul>

            <div className="navbar-user">
                {account && (
                    <span className="navbar-name">
                        {account.name ?? account.username}
                        {isAdmin && <span className="badge-admin">Admin</span>}
                    </span>
                )}
                <button type="button" className="btn-logout" onClick={handleLogout}>
                    Sign out
                </button>
            </div>
        </nav>
    );
}
