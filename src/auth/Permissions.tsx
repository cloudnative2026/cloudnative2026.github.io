import { useEffect, useState } from "react";
import { useMsal } from "@azure/msal-react";
import { useApiToken } from "./authHelpers";

import { PermissionsContext } from "./permissionsContext";
export function PermissionsProvider({ children }: { children: React.ReactNode }) {
    const getToken = useApiToken();
    const { accounts } = useMsal();
    const accountId = accounts[0]?.homeAccountId;
    const [state, setState] = useState<{ roles: string[]; error?: string } | null>(null);
    useEffect(() => {
        let cancelled = false;
        getToken().then(token => {
            const encoded = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
            const claims = JSON.parse(atob(encoded));
            const roles = Array.isArray(claims.roles) ? claims.roles.filter((r: unknown) => typeof r === "string") : [];
            if (!cancelled) setState({ roles });
        }).catch(error => { if (!cancelled) setState({ roles: [], error: String(error) }); });
        return () => { cancelled = true; };
    // The provider is keyed by account; acquire the API roles once per session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [accountId]);
    if (!state) return <p className="page-status">Cargando permisos…</p>;
    if (state.error) return <p className="page-status error" role="alert">{state.error}</p>;
    if (!state.roles.some(r => ["Admin", "Operador", "Cliente"].includes(r)))
        return <p className="page-status">Tu cuenta no tiene permisos para acceder a la tienda.</p>;
    return <PermissionsContext.Provider value={state.roles}>{children}</PermissionsContext.Provider>;
}
