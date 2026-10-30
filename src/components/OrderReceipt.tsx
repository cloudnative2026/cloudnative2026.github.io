import { useEffect, useRef, useState } from "react";
import { ordersApi, type Receipt } from "../api/client";
import { useApiToken } from "../auth/authHelpers";

export default function OrderReceipt({ orderId, onClose }: { orderId: number; onClose: () => void }) {
    const getToken = useApiToken();
    const [receipt, setReceipt] = useState<Receipt | null>(null);
    const [error, setError] = useState("");
    const [attempt, setAttempt] = useState(0);
    const frame = useRef<HTMLIFrameElement>(null);
    useEffect(() => {
        let cancelled = false;
        let timer: ReturnType<typeof setTimeout>;
        let polls = 0;
        async function poll(request: boolean) {
            try {
                const token = await getToken();
                if (cancelled) return;
                const result = request ? await ordersApi.requestReceipt(token, orderId) : await ordersApi.getReceipt(token, orderId);
                if (cancelled) return;
                setReceipt(result);
                if (result.status === "PENDING") {
                    if (++polls >= 60) setError("La boleta sigue pendiente. Puedes consultar nuevamente en unos momentos.");
                    else timer = setTimeout(() => { void poll(false); }, 2000);
                }
            } catch {
                if (!cancelled) setError("No pudimos consultar la boleta. Inténtalo nuevamente.");
            }
        }
        setReceipt(null);
        setError("");
        void poll(true);
        return () => { cancelled = true; clearTimeout(timer); };
    // Token retrieval uses the current MSAL account; polling is scoped to this selected order.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orderId, attempt]);

    function download() {
        if (!receipt?.html) return;
        const url = URL.createObjectURL(new Blob([receipt.html], { type: "text/html;charset=utf-8" }));
        const link = document.createElement("a");
        link.href = url;
        link.download = `boleta-${receipt.number}.html`;
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
    return <section className="card receipt-panel" aria-labelledby="receipt-heading">
        <div className="receipt-heading">
            <div><h2 id="receipt-heading">Boleta del pedido #{orderId}</h2>
                <p className="page-subtitle">Comprobante con el detalle y los precios de tu pedido.</p></div>
            <button type="button" className="btn btn-sm" onClick={onClose}>Cerrar</button>
        </div>
        {error ? <div role="alert"><p>{error}</p><button type="button" className="btn btn-primary" onClick={() => setAttempt(n => n + 1)}>Volver a consultar</button></div>
            : receipt?.status !== "READY" ? <p role="status">Estamos preparando tu boleta. Aparecerá aquí automáticamente…</p>
            : <><div className="receipt-actions">
                <span className="badge badge-success">Disponible · {receipt.number}</span>
                <button type="button" className="btn btn-sm" onClick={download}>Descargar boleta</button>
                <button type="button" className="btn btn-primary btn-sm" onClick={() => frame.current?.contentWindow?.print()}>Imprimir / guardar PDF</button>
            </div><iframe ref={frame} title={`Boleta del pedido ${orderId}`} srcDoc={receipt.html ?? ""}
                sandbox="allow-same-origin allow-modals" className="receipt-preview" /></>}
    </section>;
}
