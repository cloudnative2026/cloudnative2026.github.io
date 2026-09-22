import { useMsal } from "@azure/msal-react";
import { loginRequest } from "../auth/msalConfig";
import "./LoginPage.css";

// ============================================================
//  Login Page
//  Shown to unauthenticated users.
//  Uses loginRedirect — no popups, no block_nested_popups error.
// ============================================================

export default function LoginPage() {
    const { instance } = useMsal();

    function handleLogin() {
        // loginRedirect navigates the whole page to Microsoft's
        // login portal. On success, Microsoft redirects back to
        // redirectUri and handleRedirectPromise() (in main.tsx)
        // picks up the auth code automatically.
        instance.loginRedirect(loginRequest).catch(console.error);
    }

    return (
        <main className="login-page">
            <div className="login-card">
                <div className="login-logo">
                    <svg viewBox="0 0 96 96" aria-hidden="true">
                        <path fill="#f25022" d="M0 0h46v46H0z" />
                        <path fill="#7fba00" d="M50 0h46v46H50z" />
                        <path fill="#00a4ef" d="M0 50h46v46H0z" />
                        <path fill="#ffb900" d="M50 50h46v46H50z" />
                    </svg>
                </div>
                <h1>CloudNative</h1>
                <p className="login-subtitle">
                    Sign in with your organizational account to continue.
                </p>
                <button
                    type="button"
                    className="login-btn"
                    onClick={handleLogin}
                >
                    <svg viewBox="0 0 96 96" aria-hidden="true" className="ms-icon">
                        <path fill="#f25022" d="M0 0h46v46H0z" />
                        <path fill="#7fba00" d="M50 0h46v46H0z" />
                        <path fill="#00a4ef" d="M0 50h46v46H0z" />
                        <path fill="#ffb900" d="M50 50h46v46H50z" />
                    </svg>
                    Sign in with Microsoft
                </button>
            </div>
        </main>
    );
}
