import { API_BASE_URL } from "../auth/msalConfig";

// ============================================================
//  Shared fetch wrapper — attaches Bearer token automatically
// ============================================================

async function apiFetch<T>(
    path: string,
    token: string,
    options: RequestInit = {}
): Promise<T> {
    const res = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            ...options.headers
        }
    });

    if (!res.ok) {
        const text = await res.text().catch(() => res.statusText);
        throw new Error(`${res.status} ${text}`);
    }

    // 204 No Content
    if (res.status === 204) return undefined as T;

    return res.json() as Promise<T>;
}

// ============================================================
//  Types
// ============================================================

export interface Product {
    id: number;
    name: string;
    description: string | null;
    price: number;
    stock: number;
    imageUrl: string | null;
    active: boolean;
}

export interface ProductRequest {
    name: string;
    description: string;
    price: number;
    stock: number;
    imageUrl: string;
    active: boolean;
}

export interface OrderItem {
    productId: number;
    quantity: number;
    unitPrice: number;
    product?: Product | null;
}

export interface Order {
    id: number;
    customerId: number;
    status: string;
    items: OrderItem[];
    totalAmount: number;
    createdAt: string;
    updatedAt: string;
}

// ============================================================
//  Catalog API  — GET /api/catalog/products
// ============================================================

export const catalogApi = {
    getAll: (token: string) =>
        apiFetch<Product[]>("/api/v1/catalog", token),

    getById: (token: string, id: number) =>
        apiFetch<Product>(`/api/v1/catalog/${id}`, token),

    create: (token: string, body: ProductRequest) =>
        apiFetch<Product>("/api/v1/catalog/", token, {
            method: "POST",
            body: JSON.stringify(body)
        }),

    update: (token: string, id: number, body: ProductRequest) =>
        apiFetch<Product>(`/api/v1/catalog/${id}`, token, {
            method: "PUT",
            body: JSON.stringify(body)
        }),

    delete: (token: string, id: number) =>
        apiFetch<void>(`/api/v1/catalog/${id}`, token, {
            method: "DELETE"
        })
};

// ============================================================
//  Orders API  — GET /api/v1/orders
// ============================================================

export interface Receipt {
    orderId: number;
    status: "NOT_REQUESTED" | "PENDING" | "READY";
    number: string | null;
    requestedAt: string | null;
    generatedAt: string | null;
    html: string | null;
}

export interface OrderRequest {
    customerId: number;
    items: { productId: number; quantity: number }[];
}

export const ordersApi = {
    syncNotificationContact: (token: string) =>
        apiFetch<{ emailAvailable: boolean }>("/api/v1/orders/notification-contact", token, { method: "POST" }),
    requestReceipt: (token: string, id: number) =>
        apiFetch<Receipt>(`/api/v1/orders/${id}/receipt`, token, { method: "POST" }),
    getReceipt: (token: string, id: number) =>
        apiFetch<Receipt>(`/api/v1/orders/${id}/receipt`, token),
    create: (token: string, body: OrderRequest) =>
        apiFetch<Order>("/api/v1/orders", token, { method: "POST", body: JSON.stringify(body) }),
    update: (token: string, id: number, body: OrderRequest) =>
        apiFetch<Order>(`/api/v1/orders/${id}`, token, { method: "PUT", body: JSON.stringify(body) }),
    getAll: (token: string) =>
        apiFetch<Order[]>("/api/v1/orders", token),

    getById: (token: string, id: number) =>
        apiFetch<Order>(`/api/v1/orders/${id}`, token),

    updateStatus: (token: string, id: number, status: string) =>
        apiFetch<Order>(
            `/api/v1/orders/${id}/status?status=${encodeURIComponent(status)}`,
            token,
            { method: "PATCH" }
        ),

    delete: (token: string, id: number) =>
        apiFetch<void>(`/api/v1/orders/${id}`, token, { method: "DELETE" })
};

// ============================================================
//  BFF API (Admin) — /api/v1/bff → ms-report / ms-audit
// ============================================================

export interface Kpis {
    orders: number;
    deliveredOrders: number;
    cancelledOrders: number;
    revenue: number;
    averageTicket: number;
    averageLeadTimeHours: number | null;
}

export interface SalesPoint { date: string; orders: number; revenue: number }
export interface LeadTimePoint { date: string; deliveredOrders: number; averageHours: number | null }
export interface TopProduct { productId: number; name: string | null; quantity: number; revenue: number }

export interface Dashboard {
    from: string;
    to: string;
    kpis: Kpis;
    sales: SalesPoint[];
    leadTime: LeadTimePoint[];
    topProducts: TopProduct[];
    generatedAt: string;
}

export interface AuditEvent {
    eventId: string;
    eventType: string;
    entityType: string;
    entityId: string;
    actorSubject: string | null;
    actorName: string | null;
    actorRoles: string[];
    occurredAt: string;
    sourceIp: string | null;
    userAgent: string | null;
    sourceService: string | null;
    detail: string | null;
}

export interface AuditPage { content: AuditEvent[]; totalElements: number; page: number; size: number }

export interface AuditFilters {
    user?: string;
    type?: string;
    orderId?: number;
    from?: string;
    to?: string;
    page?: number;
    size?: number;
}

function query(params: Record<string, string | number | undefined>) {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params))
        if (value !== undefined && value !== "") search.set(key, String(value));
    return search.toString();
}

export const bffApi = {
    dashboard: (token: string, from: string, to: string) =>
        apiFetch<Dashboard>(`/api/v1/bff/reports/dashboard?${query({ from, to })}`, token),

    auditEvents: (token: string, filters: AuditFilters) =>
        apiFetch<AuditPage>(`/api/v1/bff/audit/events?${query({ ...filters })}`, token),

    auditEventTypes: (token: string) =>
        apiFetch<string[]>("/api/v1/bff/audit/event-types", token)
};
