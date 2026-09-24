import { useState } from "react";
import { Context } from "./useCart";
import type { Line } from "./useCart";
import type { Product } from "../api/client";
export function CartProvider({ children }: { children: React.ReactNode }) {
    const [items, setItems] = useState<Line[]>([]);
    function add(product: Product) {
        if (!product.active || product.stock < 1) return;
        setItems(previous => {
            const existing = previous.find(i => i.product.id === product.id);
            if (existing) return previous.map(i => i.product.id === product.id ? { product, quantity: Math.min(i.quantity + 1, product.stock, 100000) } : i);
            return previous.length < 100 ? [...previous, { product, quantity: 1 }] : previous;
        });
    }
    function quantity(id: number, value: number) {
        if (!Number.isInteger(value) || value < 0) return;
        setItems(previous => value === 0 ? previous.filter(i => i.product.id !== id) : previous.map(i => i.product.id === id ? { ...i, quantity: Math.min(value, i.product.stock, 100000) } : i));
    }
    return <Context.Provider value={{ items, add, quantity, clear: () => setItems([]) }}>{children}</Context.Provider>;
}
