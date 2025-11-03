export const ROOT = import.meta.env.VITE_RTDB_ROOT || "/v2";
export const path = (...parts: string[]) => [ROOT, ...parts].join("/");
