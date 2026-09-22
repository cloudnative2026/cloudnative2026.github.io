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
        apiFetch<Product[]>("/api/catalog/products", token),

    getById: (token: string, id: number) =>
        apiFetch<Product>(`/api/catalog/products/${id}`, token),

    create: (token: string, body: ProductRequest) =>
        apiFetch<Product>("/api/catalog/products", token, {
            method: "POST",
            body: JSON.stringify(body)
        }),

    update: (token: string, id: number, body: ProductRequest) =>
        apiFetch<Product>(`/api/catalog/products/${id}`, token, {
            method: "PUT",
            body: JSON.stringify(body)
        }),

    delete: (token: string, id: number) =>
        apiFetch<void>(`/api/catalog/products/${id}`, token, {
            method: "DELETE"
        })
};

// ============================================================
//  Orders API  — GET /api/v1/orders
// ============================================================

export const ordersApi = {
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
