import { createContext, useContext } from "react";
import type { Product } from "../api/client";
export interface Line { product: Product; quantity: number }
interface Cart { items: Line[]; add: (product: Product) => void; quantity: (id: number, value: number) => void; clear: () => void }
export const Context = createContext<Cart | null>(null);
export function useCart() { const cart = useContext(Context); if (!cart) throw new Error("Missing cart"); return cart; }
