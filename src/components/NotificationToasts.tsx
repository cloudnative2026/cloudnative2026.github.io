import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useApiToken } from "../auth/authHelpers";
import { API_BASE_URL } from "../auth/msalConfig";
import "./NotificationToasts.css";

// ============================================================
//  Avisos en pantalla enviados por ms-notifications (SSE).
//  Se usa fetch y no EventSource porque EventSource no permite
//  enviar el header Authorization.
// ============================================================

interface Notification {
    content: string;
}

export default function NotificationToasts() {
    const getToken = useApiToken();
    const [toasts, setToasts] = useState<{ id: number; content: string }[]>([]);

    useEffect(() => {
        const controller = new AbortController();
        let nextId = 0;

        function show({ content }: Notification) {
            const id = nextId++;
            setToasts((prev) => [...prev, { id, content }]);
            setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 8000);
        }

        async function listen() {
            while (!controller.signal.aborted) {
                try {
                    const res = await fetch(`${API_BASE_URL}/api/v1/notifications/stream`, {
                        headers: { Authorization: `Bearer ${await getToken()}` },
                        signal: controller.signal
                    });
                    if (!res.ok || !res.body) throw new Error(`${res.status}`);
                    const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
                    let buffer = "";
                    for (;;) {
                        const { value, done } = await reader.read();
                        if (done) break;
                        // Cada evento SSE termina con una línea en blanco.
                        const events = (buffer + value).split("\n\n");
                        buffer = events.pop()!;
                        for (const event of events) {
                            const data = event.split("\n").filter((l) => l.startsWith("data:"))
                                .map((l) => l.slice(5)).join("\n");
                            if (data) show(JSON.parse(data));
                        }
                    }
                } catch (err) {
                    if (controller.signal.aborted) return;
                    console.warn("Notificaciones desconectadas:", err);
                }
                // Reconectar tras un corte o el timeout del servidor.
                await new Promise((resolve) => setTimeout(resolve, 3000));
            }
        }

        listen();
        return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="toasts" aria-live="polite">
            {toasts.map((t) => (
                <div key={t.id} className="toast" role="status">
                    {t.content} <Link to="/orders">Ver pedidos</Link>
                </div>
            ))}
        </div>
    );
}
