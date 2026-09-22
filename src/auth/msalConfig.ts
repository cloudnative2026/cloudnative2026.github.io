import type { Configuration, RedirectRequest, SilentRequest } from "@azure/msal-browser";

// ============================================================
//  CONFIGURACIÓN DE MSAL — Microsoft Entra ID
//
//  Estos valores NO son secretos. Un SPA usa Authorization
//  Code Flow + PKCE, por lo que no necesita client secret.
//
//  La aplicación está configurada como MULTITENANT.
// ============================================================

export const msalConfig: Configuration = {
    auth: {
        // Client ID de "CloudNative Frontend"
        clientId: "4283d60a-867f-4bfa-b154-8fdc4e626bbe",

        // Tenant de Entra ID configurado en el backend
        authority: "https://login.microsoftonline.com/f9bce5c0-eb96-4341-aad7-411ae980b12a",

        // Debe coincidir EXACTAMENTE con el Redirect URI de Entra ID
        redirectUri: "http://localhost:5500"
    },

    cache: {
        // La sesión se elimina al cerrar la pestaña.
        cacheLocation: "sessionStorage"
    }
};


// ============================================================
//  LOGIN
// ============================================================

// Permisos solicitados al iniciar sesión.
// openid + profile permiten obtener la identidad básica del usuario.
export const loginRequest: RedirectRequest = {
    scopes: ["openid", "profile"]
};


// ============================================================
//  ACCESS TOKEN PARA CLOUDNATIVE API
// ============================================================

// Scope expuesto por "CloudNative Api".
//
// IMPORTANTE:
// Este ID corresponde a CloudNative Api,
// NO a CloudNative Frontend.
//
// El token obtenido será enviado al backend como:
// Authorization: Bearer <access_token>
//
export const apiRequest: SilentRequest = {
    scopes: [
        "api://c1e3acd7-4501-432e-a446-71ab2dca8ac3/access_as_user"
    ]
};


// Cuando corre a través de Nginx (puerto 5500), las llamadas a /api/...
// se redirigen automáticamente a ms-catalog o ms-orders según la ruta.
export const API_BASE_URL = window.location.port === "5500" ? "" : "http://localhost:8080";