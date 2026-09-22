import { useMsal } from "@azure/msal-react";
import { apiRequest } from "./msalConfig";
import type { AccountInfo } from "@azure/msal-browser";
import { InteractionRequiredAuthError } from "@azure/msal-browser";

// ============================================================
//  Claim names used by Entra ID tokens
// ============================================================

const ROLES_CLAIM = "roles";

// ============================================================
//  Role helpers
// ============================================================

function getRoles(account: AccountInfo | null): string[] {
    if (!account) return [];
    const claims = account.idTokenClaims as Record<string, unknown> | undefined;
    const roles = claims?.[ROLES_CLAIM];
    if (Array.isArray(roles)) return roles as string[];
    return [];
}

export function useIsAdmin(): boolean {
    const { accounts } = useMsal();
    return getRoles(accounts[0] ?? null).includes("Admin");
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
