export function assetUrl(value?: string) {
  if (!value) return "";
  if (/^(https?:|data:|blob:)/.test(value)) return value;
  return value.startsWith("/") ? value : `/${value}`;
}

export const publicApiUrl = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:4000";
