import { createContext, useContext } from "react";
export const PermissionsContext = createContext<string[]>([]);
export function usePermissions() { return useContext(PermissionsContext); }
