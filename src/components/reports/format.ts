// Shared formatting for the reports page (es-CL).

export function money(value: number) {
    return "$" + value.toLocaleString("es-CL", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const compactFormat = new Intl.NumberFormat("es-CL", { notation: "compact", maximumFractionDigits: 1 });
export function compact(value: number) {
    return compactFormat.format(value);
}

// "2026-11-02" is a calendar day; parse it as local midnight, not UTC.
export function shortDate(day: string) {
    return new Date(`${day}T00:00`).toLocaleDateString("es-CL", { day: "2-digit", month: "short" });
}

export function hours(value: number | null) {
    return value === null ? "—" : `${value.toLocaleString("es-CL", { maximumFractionDigits: 1 })} h`;
}
