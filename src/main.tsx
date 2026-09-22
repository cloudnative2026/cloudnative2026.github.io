import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { PublicClientApplication, EventType } from '@azure/msal-browser'
import type { AuthenticationResult } from '@azure/msal-browser'
import { MsalProvider } from '@azure/msal-react'
import { msalConfig } from './auth/msalConfig'
import './index.css'
import App from './App.tsx'

// ============================================================
//  Bootstrap MSAL — Redirect flow
//
//  1. initialize() must be awaited before mounting (MSAL v3+)
//  2. handleRedirectPromise() processes the auth code that
//     Microsoft appends to the URL after loginRedirect()
//  3. An event listener sets the active account whenever a
//     successful login/SSO event is emitted, which triggers
//     AuthenticatedTemplate to re-render.
// ============================================================

const msalInstance = new PublicClientApplication(msalConfig)

// Set active account on any successful login event
msalInstance.addEventCallback((event) => {
    if (
        event.eventType === EventType.LOGIN_SUCCESS ||
        event.eventType === EventType.ACQUIRE_TOKEN_SUCCESS
    ) {
        const payload = event.payload as AuthenticationResult
        if (payload?.account) {
            msalInstance.setActiveAccount(payload.account)
        }
    }
})

msalInstance.initialize().then(() => {
    // Process the redirect response (only runs when returning from
    // Microsoft login page — no-op on normal page loads)
    return msalInstance.handleRedirectPromise()
}).then(() => {
    // Restore session for returning users
    const accounts = msalInstance.getAllAccounts()
    if (accounts.length > 0 && !msalInstance.getActiveAccount()) {
        msalInstance.setActiveAccount(accounts[0])
    }

    createRoot(document.getElementById('root')!).render(
        <StrictMode>
            <MsalProvider instance={msalInstance}>
                <App />
            </MsalProvider>
        </StrictMode>,
    )
})
