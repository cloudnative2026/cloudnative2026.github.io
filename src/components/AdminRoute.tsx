import { Navigate } from "react-router-dom";
import { useIsAdmin } from "../auth/authHelpers";

// ============================================================
//  AdminRoute — redirects non-admins to /catalog
// ============================================================

export default function AdminRoute({ children }: { children: React.ReactNode }) {
    const isAdmin = useIsAdmin();
    if (!isAdmin) return <Navigate to="/catalog" replace />;
    return <>{children}</>;
}
