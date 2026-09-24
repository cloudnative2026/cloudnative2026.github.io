import { useMsal } from "@azure/msal-react";
import { apiRequest } from "./msalConfig";
import { usePermissions } from "./permissionsContext";
import { InteractionRequiredAuthError } from "@azure/msal-browser";

// ============================================================
//  Claim names used by Entra ID tokens
// ============================================================

export function useIsAdmin(): boolean {
    return usePermissions().includes("Admin");
}

// ============================================================
//  Acquire Bearer token silently
//  Falls back to acquireTokenRedirect (never a popup).
// ============================================================

export function useApiToken() {
    const { instance, accounts } = useMsal();

    return async (): Promise<string> => {
        const account = accounts[0] ?? instance.getActiveAccount();
        if (!account) throw new Error("No active account");

        try {
            const result = await instance.acquireTokenSilent({
                ...apiRequest,
                account
            });
            return result.accessToken;
        } catch (err) {
            // If a login / consent is required, redirect to Microsoft
            if (err instanceof InteractionRequiredAuthError) {
                await instance.acquireTokenRedirect({ ...apiRequest, account });
                // acquireTokenRedirect navigates away, so this line is
                // never reached — throw to satisfy TypeScript.
                throw err;
            }
            throw err;
        }
    };
}
