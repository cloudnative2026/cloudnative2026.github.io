import { AuthenticatedTemplate, UnauthenticatedTemplate } from "@azure/msal-react";
import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useMsal } from "@azure/msal-react";
import { PermissionsProvider } from "./auth/Permissions";
import { CartProvider } from "./cart/CartContext";
import CartPage from "./pages/CartPage";
import Navbar from "./components/Navbar";
import NotificationToasts from "./components/NotificationToasts";
import AdminRoute from "./components/AdminRoute";
import LoginPage from "./pages/LoginPage";
import CatalogPage from "./pages/CatalogPage";
import OrdersPage from "./pages/OrdersPage";
import ProductsAdminPage from "./pages/ProductsAdminPage";
import AuditPage from "./pages/AuditPage";

// Loaded on demand: recharts is only needed by admins on /reports.
const ReportsPage = lazy(() => import("./pages/ReportsPage"));
import NotFoundPage from "./pages/NotFoundPage";

// ============================================================
//  App
//
//  UnauthenticatedTemplate → Login page
//  AuthenticatedTemplate   → App shell with Navbar + Routes
//
//  Routes:
//    /catalog            — all authenticated users
//    /admin/products     — Admin only (guarded by AdminRoute)
//    /admin/orders       — Admin only (guarded by AdminRoute)
//    /reports            — Admin only (KPIs via ms-bff → ms-report)
//    /audit              — Admin only (timeline via ms-bff → ms-audit)
// ============================================================

function AppShell() {
    const { accounts } = useMsal();
    return (
        <PermissionsProvider key={accounts[0]?.homeAccountId}><CartProvider>
        <BrowserRouter>
            <Navbar />
            <NotificationToasts />
            <Routes>
                <Route path="/catalog" element={<CatalogPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/orders" element={<OrdersPage />} />
                <Route
                    path="/admin/products"
                    element={
                        <AdminRoute>
                            <ProductsAdminPage />
                        </AdminRoute>
                    }
                />
                <Route
                    path="/admin/orders"
                    element={
                        <AdminRoute>
                            <OrdersPage />
                        </AdminRoute>
                    }
                />
                <Route path="/reports" element={<AdminRoute>
                    <Suspense fallback={<p className="page-status">Cargando reportes…</p>}><ReportsPage /></Suspense>
                </AdminRoute>} />
                <Route path="/audit" element={<AdminRoute><AuditPage /></AdminRoute>} />
                <Route path="/" element={<Navigate to="/catalog" replace />} />
                <Route path="*" element={<NotFoundPage />} />
            </Routes>
        </BrowserRouter>
        </CartProvider></PermissionsProvider>
    );
}

export default function App() {
    return (
        <>
            <UnauthenticatedTemplate>
                <LoginPage />
            </UnauthenticatedTemplate>

            <AuthenticatedTemplate>
                <AppShell />
            </AuthenticatedTemplate>
        </>
    );
}
